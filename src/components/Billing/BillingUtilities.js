// BillingUtilities.js - Contains all billing calculation functions

/**
 * Gets the base price based on billing option, product type, and sale type
 */
export const getBasePrice = (billingOption, rates, productType, saleType, chickenType) => {
  if (billingOption.type === "base") {
    // For country chicken, check sale type
    if (billingOption.id === "countryChicken") {
      if (saleType === "retail") {
        switch (productType) {
          case "live":
            return rates.productPrices.countryChicken || 0;
          case "withSkin":
            return rates.productPrices.countryChickenWithSkin || rates.productPrices.countryChicken || 0;
          case "meat":
            return rates.productPrices.countryChickenMeat || rates.productPrices.countryChicken || 0;
          default:
            return rates.productPrices.countryChicken || 0;
        }
      } else if (saleType === "wholesale") {
        // For wholesale country chicken
        return rates.paperRate;
      }
      return rates.productPrices.countryChicken || 0;
    }

    // For regular broiler options
    switch (billingOption.id) {
      case "retail":
        // For retail, price depends on product type
        switch (productType) {
          case "live":
            return rates.productPrices.liveChicken;
          case "withSkin":
            return rates.productPrices.chickenWithSkin;
          case "meat":
            return rates.shopRate;
          default:
            return 0;
        }
      case "wholesale":
        // For wholesale, we now support multiple product types
        switch (productType) {
          case "live":
            return rates.paperRate;
          case "meat":
            return rates.shopRate;
          default:
            return rates.paperRate;
        }
      default:
        return 0;
    }
  } else {
    // For additional products, get price based on retail/wholesale
    const product = products.find((p) => p.id === billingOption.id);
    return product ? product.wholesalePrice : 0;
  }
};

/**
 * Calculates the final price based on weight, discount, and product configuration
 */
export const calculatePrice = (weight, discountPerKg, productType, saleType, billingOption, rates, conversionFactor, customerSellingPrice) => {
  // Get the base price based on current product type and sale type
  const basePrice = getBasePrice(billingOption, rates, productType, saleType);

  // For wholesale, add customer selling price if available
  let finalBasePrice = basePrice;
  if ((billingOption.id === "wholesale" || (billingOption.id === "countryChicken" && saleType === "wholesale")) && Number(customerSellingPrice) > 0) {
    finalBasePrice = Number(basePrice) + Number(customerSellingPrice);
  }

  const finalRatePerKg = Math.max(0, Number(finalBasePrice) - Number(discountPerKg || 0));

  let calculatedWeight = Number(weight);

  // Only convert to meat weight if product type is meat for retail
  if ((billingOption.id === "retail" || (billingOption.id === "countryChicken" && saleType === "retail")) && productType === "meat") {
    // Use the appropriate conversion factor based on chicken type
    calculatedWeight = Math.round((calculatedWeight / conversionFactor) * 100) / 100;
  }

  return (calculatedWeight * finalRatePerKg).toFixed(2);
};

/**
 * Calculates the discount per kg based on the total price
 */
export const calculateDiscountFromPrice = (price, weight, billingOption, saleType, basePrice, customerSellingPrice) => {
  // For wholesale, include customer selling price
  let finalBasePrice = basePrice;
  if ((billingOption.id === "wholesale" || (billingOption.id === "countryChicken" && saleType === "wholesale")) && Number(customerSellingPrice) > 0) {
    finalBasePrice = Number(basePrice) + Number(customerSellingPrice);
  }

  const totalBasePrice = weight * finalBasePrice;
  const priceReduction = totalBasePrice - price;
  return (priceReduction / weight).toFixed(2);
};

// Conversion Weight Calculations
export const calculateWithSkinWeight = (liveWeight, withSkinRate) => {
  if (!liveWeight || Number(liveWeight) <= 0 || !withSkinRate || Number(withSkinRate) <= 0) {
    return "0.00";
  }
  return (Number(liveWeight) / Number(withSkinRate)).toFixed(2);
};

export const calculateWithoutSkinWeight = (liveWeight, withoutSkinRate) => {
  if (!liveWeight || Number(liveWeight) <= 0 || !withoutSkinRate || Number(withoutSkinRate) <= 0) {
    return "0.00";
  }
  return (Number(liveWeight) / Number(withoutSkinRate)).toFixed(2);
};

// Price Per Kg Calculations
export const calculateWithSkinPricePerKg = (withSkinRate, basePrice, customerSellingPrice, discountPerKg) => {
  if (!withSkinRate || Number(withSkinRate) <= 0) {
    return "0.00";
  }
  const totalRatePerKg = Number(basePrice) + Number(customerSellingPrice || 0) - Number(discountPerKg || 0);
  return (totalRatePerKg * Number(withSkinRate)).toFixed(2);
};

export const calculateWithoutSkinPricePerKg = (withoutSkinRate, basePrice, customerSellingPrice, discountPerKg) => {
  if (!withoutSkinRate || Number(withoutSkinRate) <= 0) {
    return "0.00";
  }
  const totalRatePerKg = Number(basePrice) + Number(customerSellingPrice || 0) - Number(discountPerKg || 0);
  return (totalRatePerKg * Number(withoutSkinRate)).toFixed(2);
};

// Total Price Calculations
export const calculateWithSkinPrice = (liveWeight, withSkinRate, basePrice, customerSellingPrice, discountPerKg) => {
  if (!liveWeight || Number(liveWeight) <= 0 || !withSkinRate || Number(withSkinRate) <= 0) {
    return "0.00";
  }
  const withSkinWeight = Number(liveWeight) / Number(withSkinRate);
  const pricePerKg = calculateWithSkinPricePerKg(withSkinRate, basePrice, customerSellingPrice, discountPerKg);
  return (withSkinWeight * Number(pricePerKg)).toFixed(2);
};

export const calculateWithoutSkinPrice = (liveWeight, withoutSkinRate, basePrice, customerSellingPrice, discountPerKg) => {
  if (!liveWeight || Number(liveWeight) <= 0 || !withoutSkinRate || Number(withoutSkinRate) <= 0) {
    return "0.00";
  }
  const withoutSkinWeight = Number(liveWeight) / Number(withoutSkinRate);
  const pricePerKg = calculateWithoutSkinPricePerKg(withoutSkinRate, basePrice, customerSellingPrice, discountPerKg);
  return (withoutSkinWeight * Number(pricePerKg)).toFixed(2);
};

// UI Helper Functions
export const shouldShowConversions = (billingOption, saleType, selectedCustomer, withSkinRate, withoutSkinRate) => {
  return (
    (billingOption.id === "wholesale" || (billingOption.id === "countryChicken" && saleType === "wholesale")) &&
    selectedCustomer &&
    Number(withSkinRate) > 0 &&
    Number(withoutSkinRate) > 0
  );
};

export const shouldShowChickenTypeSelector = (billingOption) => {
  return billingOption.id !== "countryChicken"; // Only show selector if not already on country chicken
};

export const shouldShowSaleTypeSelector = (billingOption) => {
  return billingOption.id === "countryChicken"; // Only show for country chicken bills
};

export const shouldShowWholesaleOptions = (billingOption, saleType) => {
  return billingOption.id === "wholesale" || (billingOption.id === "countryChicken" && saleType === "wholesale");
};
