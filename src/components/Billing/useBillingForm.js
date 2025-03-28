import { useState, useEffect } from "react";
import {
  calculatePrice,
  calculateDiscountFromPrice,
  shouldShowConversions,
  shouldShowChickenTypeSelector,
  shouldShowSaleTypeSelector,
  shouldShowWholesaleOptions,
  getBasePrice,
} from "./BillingUtilities";
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor } from "../../utils/storage";

/**
 * Custom hook to manage billing form state and logic
 * Extracts complex state management from the BillingForm component
 */
const useBillingForm = (billingOption, rates, onBillGenerate, editData, weightType) => {
  // Initialize form state
  const [billData, setBillData] = useState({
    customerName: "",
    customerPhone: "",
    category: billingOption.type === "base" ? billingOption.id : "additional",
    productType: "live",
    weight: "",
    numberOfBirds: "",
    discountPerKg: "",
    price: "",
    paymentType: "cash", // cash, online, partial
    amountPaid: "",
    balanceAmount: "0",
    // Fields for enhanced wholesale billing
    selectedCustomer: null,
    customerSellingPrice: "0",
    withSkinRate: "0",
    withoutSkinRate: "0",
    // Add chicken type field to distinguish between broiler and country chicken
    chickenType: billingOption.id === "countryChicken" ? "country" : "broiler",
    // New field for country chicken sales type
    saleType: billingOption.id === "countryChicken" ? "retail" : billingOption.id,
  });

  // UI state
  const [message, setMessage] = useState("");
  const [regularCustomers, setRegularCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [conversionFactors, setConversionFactors] = useState({
    broiler: getBroilerMeatConversionFactor(),
    countryChicken: getCountryChickenMeatConversionFactor(),
  });

  // Dynamically select the conversion factor based on chicken type
  const CONVERSION_FACTOR = billData.chickenType === "country" ? conversionFactors.countryChicken : conversionFactors.broiler;

  // Get base price for current configuration
  const currentBasePrice = getBasePrice(billingOption, rates, billData.productType, billData.saleType, billData.chickenType);

  // Load initial data
  useEffect(() => {
    // If editing, populate form with existing data
    if (editData) {
      setBillData(editData);
    }

    // Load regular customers from localStorage
    const savedCustomers = localStorage.getItem("meatShop_regularCustomers");
    if (savedCustomers) {
      const parsedCustomers = JSON.parse(savedCustomers);
      setRegularCustomers(parsedCustomers);
      setFilteredCustomers(parsedCustomers);
    }

    // Make sure we have the latest conversion factors
    setConversionFactors({
      broiler: getBroilerMeatConversionFactor(),
      countryChicken: getCountryChickenMeatConversionFactor(),
    });
  }, [editData]);

  // Filter customers as user types
  useEffect(() => {
    if (billData.customerName.trim().length > 0) {
      const filtered = regularCustomers.filter(
        (customer) => customer.name.toLowerCase().includes(billData.customerName.toLowerCase()) || customer.phone.includes(billData.customerName)
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setShowCustomerDropdown(false);
    }
  }, [billData.customerName, regularCustomers]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setBillData((prev) => {
      const newData = { ...prev, [field]: value };

      // If sale type is changed, reset customer-specific data if changing from wholesale to retail
      if (field === "saleType" && value === "retail" && prev.saleType === "wholesale") {
        newData.selectedCustomer = null;
        newData.customerSellingPrice = "0";
        newData.withSkinRate = "0";
        newData.withoutSkinRate = "0";
      }

      // Auto-calculate price when relevant fields change
      if (
        field === "weight" ||
        field === "discountPerKg" ||
        field === "productType" ||
        field === "customerSellingPrice" ||
        field === "chickenType" ||
        field === "saleType"
      ) {
        const calculatedPrice = calculatePrice(
          newData.weight,
          newData.discountPerKg,
          field === "productType" ? value : newData.productType,
          field === "saleType" ? value : newData.saleType,
          billingOption,
          rates,
          CONVERSION_FACTOR,
          newData.customerSellingPrice
        );

        newData.price = calculatedPrice;
        // If payment is partial, reset amount paid and balance
        if (newData.paymentType === "partial") {
          newData.amountPaid = "";
          newData.balanceAmount = calculatedPrice;
        } else {
          newData.amountPaid = calculatedPrice;
          newData.balanceAmount = "0";
        }
      }

      // Handle payment type changes
      if (field === "paymentType") {
        if (value === "partial") {
          newData.amountPaid = "";
          newData.balanceAmount = newData.price;
        } else {
          newData.amountPaid = newData.price;
          newData.balanceAmount = "0";
        }
      }

      // Calculate balance when amount paid changes
      if (field === "amountPaid") {
        newData.balanceAmount = (Number(newData.price) - Number(value)).toFixed(2);
      }

      return newData;
    });
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setBillData({
      ...billData,
      customerName: customer.name,
      customerPhone: customer.phone,
      selectedCustomer: customer,
      withSkinRate: customer.withSkinRate,
      withoutSkinRate: customer.withoutSkinRate,
      customerSellingPrice: customer.sellingPrice,
    });
    setShowCustomerDropdown(false);

    // Recalculate price with new customer selling price
    const calculatedPrice = calculatePrice(
      billData.weight,
      billData.discountPerKg,
      billData.productType,
      billData.saleType,
      billingOption,
      rates,
      CONVERSION_FACTOR,
      customer.sellingPrice
    );

    setBillData((prev) => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      selectedCustomer: customer,
      withSkinRate: customer.withSkinRate,
      withoutSkinRate: customer.withoutSkinRate,
      customerSellingPrice: customer.sellingPrice,
      price: calculatedPrice,
      amountPaid: prev.paymentType === "partial" ? prev.amountPaid : calculatedPrice,
      balanceAmount: prev.paymentType === "partial" ? calculatedPrice : "0",
    }));
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!billData.customerName || !billData.customerPhone || !billData.weight || !billData.price || !billData.amountPaid || !billData.numberOfBirds) {
      setMessage("Please fill all required fields");
      return;
    }

    if (Number(billData.weight) <= 0) {
      setMessage("Weight must be greater than 0");
      return;
    }

    // Convert weight for stock validation if weightType is meat
    let weightForStockValidation = Number(billData.weight);
    if (weightType === "meat") {
      // Always convert live weight to meat weight for stock comparison
      weightForStockValidation = weightForStockValidation / CONVERSION_FACTOR;
    }

    // Use the appropriate current stock based on chicken type
    const stockToCheck = billData.chickenType === "country" ? 0 : 0; // This would be passed in as props in the real implementation

    if (weightForStockValidation > Number(stockToCheck)) {
      setMessage(`Weight cannot exceed current stock (${stockToCheck}kg ${weightType} weight)`);
      return;
    }

    if (Number(billData.amountPaid) < 0) {
      setMessage("Amount paid cannot be negative");
      return;
    }

    if (billData.paymentType !== "partial" && Number(billData.amountPaid) !== Number(billData.price)) {
      setMessage("Amount paid must equal total price for full payment");
      return;
    }

    if (billData.paymentType === "partial" && Number(billData.amountPaid) >= Number(billData.price)) {
      setMessage("Partial payment must be less than total price");
      return;
    }

    const billWithMetadata = {
      ...billData,
      basePrice: currentBasePrice,
      finalPricePerKg: Number(currentBasePrice) + Number(billData.customerSellingPrice || 0) - Number(billData.discountPerKg || 0),
      productName: billingOption.name,
      weightType,
      // Store the raw weight (live weight) and also the weight appropriate for inventory deduction
      rawWeight: Number(billData.weight),
      inventoryWeight: weightType === "meat" ? Number(billData.weight) / CONVERSION_FACTOR : Number(billData.weight),
      meatWeight: Number(billData.weight) / CONVERSION_FACTOR,
      // Include conversion details if available
      // These would be imported from BillingUtilities in the real implementation
      withSkinWeight: 0,
      withoutSkinWeight: 0,
      withSkinPrice: 0,
      withoutSkinPrice: 0,
      withSkinPricePerKg: 0,
      withoutSkinPricePerKg: 0,
      // Store the conversion factor used for this bill for reference
      usedConversionFactor: CONVERSION_FACTOR,
    };

    onBillGenerate(billWithMetadata);
  };

  return {
    billData,
    message,
    regularCustomers,
    filteredCustomers,
    showCustomerDropdown,
    conversionFactors,
    CONVERSION_FACTOR,
    currentBasePrice,
    handleInputChange,
    handleSelectCustomer,
    handleSubmit,
    setMessage,
    shouldShowConversions,
    shouldShowChickenTypeSelector,
    shouldShowSaleTypeSelector,
    shouldShowWholesaleOptions,
    calculateDiscountFromPrice,
  };
};

export default useBillingForm;
