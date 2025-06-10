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
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor, ensureStorageInitialized } from "../../utils/storage";

/**
 * Custom hook to manage billing form state and logic
 * Updated to handle async conversion factors from IndexedDB
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

  // Conversion factors state with loading indicator
  const [conversionFactors, setConversionFactors] = useState({
    broiler: 1.45, // Default fallback values
    countryChicken: 1.65,
  });
  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [factorsError, setFactorsError] = useState(null);

  // Dynamically select the conversion factor based on chicken type
  const CONVERSION_FACTOR = billData.chickenType === "country" ? conversionFactors.countryChicken : conversionFactors.broiler;

  // Get base price for current configuration
  const currentBasePrice = getBasePrice(billingOption, rates, billData.productType, billData.saleType, billData.chickenType);

  // Load conversion factors asynchronously
  useEffect(() => {
    const loadConversionFactors = async () => {
      try {
        setIsLoadingFactors(true);
        setFactorsError(null);

        // Ensure storage is initialized first
        await ensureStorageInitialized();

        // Load both conversion factors
        const [broilerFactor, countryFactor] = await Promise.all([getBroilerMeatConversionFactor(), getCountryChickenMeatConversionFactor()]);

        setConversionFactors({
          broiler: broilerFactor,
          countryChicken: countryFactor,
        });

        console.log("Loaded conversion factors:", { broiler: broilerFactor, country: countryFactor });
      } catch (error) {
        console.error("Error loading conversion factors:", error);
        setFactorsError(error);
        // Keep default values on error
        setConversionFactors({
          broiler: 1.45,
          countryChicken: 1.65,
        });
      } finally {
        setIsLoadingFactors(false);
      }
    };

    loadConversionFactors();
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // If editing, populate form with existing data
        if (editData) {
          setBillData(editData);
        }

        // Load regular customers from localStorage/IndexedDB
        // TODO: This should be updated to use IndexedDB when regular customers are migrated
        const savedCustomers = localStorage.getItem("meatShop_regularCustomers");
        if (savedCustomers) {
          const parsedCustomers = JSON.parse(savedCustomers);
          setRegularCustomers(parsedCustomers);
          setFilteredCustomers(parsedCustomers);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
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

  // Handle input changes with async price calculation
  const handleInputChange = async (field, value) => {
    setBillData((prev) => {
      const newData = { ...prev, [field]: value };

      // If sale type is changed, reset customer-specific data if changing from wholesale to retail
      if (field === "saleType" && value === "retail" && prev.saleType === "wholesale") {
        newData.selectedCustomer = null;
        newData.customerSellingPrice = "0";
        newData.withSkinRate = "0";
        newData.withoutSkinRate = "0";
      }

      return newData;
    });

    // Auto-calculate price when relevant fields change (but wait for conversion factors to load)
    if (
      !isLoadingFactors &&
      (field === "weight" ||
        field === "discountPerKg" ||
        field === "productType" ||
        field === "customerSellingPrice" ||
        field === "chickenType" ||
        field === "saleType")
    ) {
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        setBillData((prev) => {
          const calculatedPrice = calculatePrice(
            field === "weight" ? value : prev.weight,
            field === "discountPerKg" ? value : prev.discountPerKg,
            field === "productType" ? value : prev.productType,
            field === "saleType" ? value : prev.saleType,
            billingOption,
            rates,
            CONVERSION_FACTOR,
            field === "customerSellingPrice" ? value : prev.customerSellingPrice
          );

          const updatedData = { ...prev, price: calculatedPrice };

          // If payment is partial, reset amount paid and balance
          if (updatedData.paymentType === "partial") {
            updatedData.amountPaid = "";
            updatedData.balanceAmount = calculatedPrice;
          } else {
            updatedData.amountPaid = calculatedPrice;
            updatedData.balanceAmount = "0";
          }

          return updatedData;
        });
      }, 0);
    }

    // Handle payment type changes
    if (field === "paymentType") {
      setBillData((prev) => ({
        ...prev,
        amountPaid: value === "partial" ? "" : prev.price,
        balanceAmount: value === "partial" ? prev.price : "0",
      }));
    }

    // Calculate balance when amount paid changes
    if (field === "amountPaid") {
      setBillData((prev) => ({
        ...prev,
        balanceAmount: (Number(prev.price) - Number(value)).toFixed(2),
      }));
    }
  };

  // Handle customer selection with async price recalculation
  const handleSelectCustomer = async (customer) => {
    setBillData((prev) => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      selectedCustomer: customer,
      withSkinRate: customer.withSkinRate,
      withoutSkinRate: customer.withoutSkinRate,
      customerSellingPrice: customer.sellingPrice,
    }));
    setShowCustomerDropdown(false);

    // Recalculate price with new customer selling price (wait for conversion factors)
    if (!isLoadingFactors) {
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
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if conversion factors are still loading
    if (isLoadingFactors) {
      setMessage("Please wait for conversion factors to load...");
      return;
    }

    // Validation
    if (!billData.customerName || !billData.customerPhone || !billData.weight || !billData.price || !billData.amountPaid || !billData.numberOfBirds) {
      setMessage("Please fill all required fields");
      return;
    }

    if (Number(billData.weight) <= 0) {
      setMessage("Weight must be greater than 0");
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

    try {
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
        // Store the conversion factor used for this bill for reference
        usedConversionFactor: CONVERSION_FACTOR,
        // Add timestamp for tracking
        timestamp: new Date().toISOString(),
      };

      await onBillGenerate(billWithMetadata);
    } catch (error) {
      console.error("Error generating bill:", error);
      setMessage("Error generating bill. Please try again.");
    }
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
    isLoadingFactors,
    factorsError,
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
