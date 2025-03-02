import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor } from "../../utils/storage";
import ConversionFactorDisplay from "../ConversionRates/ConversionFactorDisplay";
import ConversionDetails from "./ConversionDetails";
import ProductTypeSelector from "./ProductTypeSelector";

// Import utility functions
import {
  getBasePrice,
  calculatePrice,
  calculateDiscountFromPrice,
  calculateWithSkinWeight,
  calculateWithoutSkinWeight,
  calculateWithSkinPricePerKg,
  calculateWithoutSkinPricePerKg,
  calculateWithSkinPrice,
  calculateWithoutSkinPrice,
  shouldShowConversions,
  shouldShowChickenTypeSelector,
  shouldShowSaleTypeSelector,
  shouldShowWholesaleOptions,
} from "./BillingUtilities";

const BillingForm = ({ rates, billingOption, onBillGenerate, onCancel, editData, weightType, currentStock, currentCountryStock }) => {
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
    const stockToCheck = billData.chickenType === "country" ? currentCountryStock : currentStock;

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
      withSkinWeight: calculateWithSkinWeight(billData.weight, billData.withSkinRate),
      withoutSkinWeight: calculateWithoutSkinWeight(billData.weight, billData.withoutSkinRate),
      withSkinPrice: calculateWithSkinPrice(billData.weight, billData.withSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      withoutSkinPrice: calculateWithoutSkinPrice(
        billData.weight,
        billData.withoutSkinRate,
        currentBasePrice,
        billData.customerSellingPrice,
        billData.discountPerKg
      ),
      withSkinPricePerKg: calculateWithSkinPricePerKg(billData.withSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      withoutSkinPricePerKg: calculateWithoutSkinPricePerKg(billData.withoutSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      // Store the conversion factor used for this bill for reference
      usedConversionFactor: CONVERSION_FACTOR,
    };

    onBillGenerate(billWithMetadata);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Bill - {billingOption.name}</CardTitle>
        <CardDescription>
          {shouldShowWholesaleOptions(billingOption, billData.saleType) ? (
            <>
              Paper Rate: ₹{currentBasePrice}/kg
              {Number(billData.customerSellingPrice) > 0 && <span> + Customer Price: ₹{billData.customerSellingPrice}/kg</span>}
            </>
          ) : (
            <>Base Rate: ₹{currentBasePrice}/kg</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-sm font-medium">Customer Name *</label>
              <Input
                placeholder="Enter or search name"
                value={billData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                className="mt-1"
              />
              {/* Customer dropdown for wholesale */}
              {shouldShowWholesaleOptions(billingOption, billData.saleType) && showCustomerDropdown && (
                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number *</label>
              <Input
                placeholder="Enter phone"
                value={billData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Chicken Type Selector - Only if not already on country chicken */}
          {shouldShowChickenTypeSelector(billingOption) && (
            <div>
              <label className="text-sm font-medium">Chicken Type *</label>
              <select
                value={billData.chickenType}
                onChange={(e) => handleInputChange("chickenType", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="broiler">Broiler Chicken</option>
                <option value="country">Country Chicken</option>
              </select>
              <div className="mt-1 flex items-center">
                <div className="text-xs text-gray-500 mr-2">Conversion Factor:</div>
                <div className="text-xs font-medium">{billData.chickenType === "country" ? conversionFactors.countryChicken : conversionFactors.broiler}</div>
              </div>
            </div>
          )}

          {/* Sale Type Selector for Country Chicken */}
          {shouldShowSaleTypeSelector(billingOption) && (
            <div>
              <label className="text-sm font-medium">Sale Type *</label>
              <select
                value={billData.saleType}
                onChange={(e) => handleInputChange("saleType", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
              </select>
              <div className="mt-1 text-xs text-gray-500">
                {billData.saleType === "retail" ? "Retail pricing for individual customers" : "Wholesale pricing for bulk orders"}
              </div>
            </div>
          )}

          {/* Customer selling price for wholesale */}
          {shouldShowWholesaleOptions(billingOption, billData.saleType) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Price (₹/kg)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter additional price per kg"
                value={billData.customerSellingPrice}
                onChange={(e) => handleInputChange("customerSellingPrice", e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-gray-500">Additional per kg price on top of the paper rate</div>
            </div>
          )}

          {/* Product Type Selection */}
          <ProductTypeSelector
            billingOption={billingOption}
            rates={rates}
            saleType={billData.saleType}
            productType={billData.productType}
            onChange={(value) => handleInputChange("productType", value)}
          />

          {/* Weight, Birds, Discount and Price */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">
                Live weight (kg) *
                <span className="text-xs text-gray-500 ml-2">(Meat weight: {(Number(billData.weight || 0) / CONVERSION_FACTOR).toFixed(2)} kg)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter weight"
                value={billData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Number of Birds *</label>
              <Input
                type="number"
                placeholder="Enter count"
                value={billData.numberOfBirds}
                onChange={(e) => handleInputChange("numberOfBirds", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount (₹/kg)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter discount"
                value={billData.discountPerKg}
                onChange={(e) => handleInputChange("discountPerKg", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={billData.price}
                onChange={(e) => {
                  const newPrice = e.target.value;
                  const weight = Number(billData.weight);

                  // Calculate discount per kg based on entered price
                  if (weight > 0) {
                    const newDiscountPerKg = calculateDiscountFromPrice(
                      newPrice,
                      weight,
                      billingOption,
                      billData.saleType,
                      currentBasePrice,
                      billData.customerSellingPrice
                    );
                    handleInputChange("discountPerKg", newDiscountPerKg);
                  }

                  handleInputChange("price", newPrice);
                }}
                className="mt-1"
              />
            </div>
            {billData.discountPerKg && billData.weight && (
              <div className="col-span-4 text-sm text-gray-500">
                Rate after discount: ₹{(Number(currentBasePrice) + Number(billData.customerSellingPrice || 0) - Number(billData.discountPerKg || 0)).toFixed(2)}
                /kg
              </div>
            )}
          </div>

          {/* Display current conversion factor */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm flex justify-between items-center">
              <span className="font-medium">Current Conversion Factor: {CONVERSION_FACTOR}</span>
              <span className="text-xs text-gray-500">({billData.chickenType === "country" ? "Country Chicken" : "Broiler"} - Live to Meat Weight)</span>
            </div>
          </div>

          {/* Conversion Details for Wholesale */}
          {shouldShowConversions(billingOption, billData.saleType, billData.selectedCustomer, billData.withSkinRate, billData.withoutSkinRate) && (
            <ConversionDetails billData={billData} basePrice={currentBasePrice} />
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Payment Type *</label>
              <select
                value={billData.paymentType}
                onChange={(e) => handleInputChange("paymentType", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount Paid (₹) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={billData.amountPaid}
                onChange={(e) => handleInputChange("amountPaid", e.target.value)}
                className="mt-1"
                readOnly={billData.paymentType !== "partial"}
              />
            </div>
          </div>

          {/* Balance Display */}
          {billData.paymentType === "partial" && Number(billData.balanceAmount) > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">Balance Amount: ₹{billData.balanceAmount}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {editData ? "Update Bill" : "Generate Bill"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>

        {message && (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingForm;
