import React from "react";

/**
 * Component for displaying product type options based on
 * chicken type (broiler/country) and sale type (retail/wholesale)
 */
const ProductTypeSelector = ({ billingOption, rates, saleType, productType, onChange }) => {
  // Get the appropriate product types for display based on chicken type and sale type
  const getProductTypes = () => {
    if (billingOption.id === "countryChicken") {
      if (saleType === "retail") {
        return (
          <>
            <option value="live">Live Country Chicken (₹{rates.productPrices.countryChicken || 0}/kg)</option>
            <option value="withSkin">
              Country Chicken with Skin (₹{rates.productPrices.countryChickenWithSkin || rates.productPrices.countryChicken || 0}/kg)
            </option>
            <option value="meat">Country Chicken Meat (₹{rates.productPrices.countryChickenMeat || rates.productPrices.countryChicken || 0}/kg)</option>
          </>
        );
      } else {
        // wholesale
        return (
          <>
            <option value="live">Live Country Chicken (₹{rates.paperRate}/kg)</option>
            <option value="meat">Country Chicken Meat (₹{rates.shopRate}/kg)</option>
          </>
        );
      }
    } else if (billingOption.id === "retail") {
      return (
        <>
          <option value="live">Live Chicken (₹{rates.productPrices.liveChicken}/kg)</option>
          <option value="withSkin">With Skin (₹{rates.productPrices.chickenWithSkin}/kg)</option>
          <option value="meat">Meat (₹{rates.shopRate}/kg)</option>
        </>
      );
    } else {
      // wholesale broiler
      return (
        <>
          <option value="live">Live Chicken (₹{rates.paperRate}/kg)</option>
          <option value="meat">Chopped Chicken (₹{rates.shopRate}/kg)</option>
        </>
      );
    }
  };

  return (
    <div>
      <label className="text-sm font-medium">Product Type *</label>
      <select value={productType} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
        {getProductTypes()}
      </select>
    </div>
  );
};

export default ProductTypeSelector;
