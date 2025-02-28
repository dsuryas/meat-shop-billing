import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Select } from "./ui/select";
import { MEAT_CONVERSION_FACTOR } from "../utils/storage";

const BillingForm = ({ rates, billingOption, onBillGenerate, onCancel, editData, weightType, currentStock }) => {
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
    // New fields for enhanced wholesale billing
    selectedCustomer: null,
    customerSellingPrice: "0",
    withSkinRate: "0",
    withoutSkinRate: "0",
  });

  const [message, setMessage] = useState("");
  const [regularCustomers, setRegularCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

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

  const getBasePrice = (productType = billData.productType) => {
    if (billingOption.type === "base") {
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
        case "countryChicken":
          return rates.productPrices.countryChicken;
        default:
          return 0;
      }
    } else {
      // For additional products, get price based on retail/wholesale
      const product = products.find((p) => p.id === billingOption.id);
      return product ? (billData.category === "wholesale" ? product.wholesalePrice : product.retailPrice) : 0;
    }
  };

  const calculatePrice = (weight, discountPerKg = billData.discountPerKg, productType = billData.productType) => {
    // Get the base price based on current product type
    const basePrice = getBasePrice(productType);

    // For wholesale, add customer selling price if available
    let finalBasePrice = basePrice;
    if (billingOption.id === "wholesale" && Number(billData.customerSellingPrice) > 0) {
      finalBasePrice = Number(basePrice) + Number(billData.customerSellingPrice);
    }

    const finalRatePerKg = Math.max(0, Number(finalBasePrice) - Number(discountPerKg || 0));

    let calculatedWeight = Number(weight);

    // Only convert to meat weight if product type is meat for retail broilers
    if (billingOption.id === "retail" && productType === "meat") {
      // rounding to 2 decimals
      calculatedWeight = Math.round((calculatedWeight / MEAT_CONVERSION_FACTOR) * 100) / 100;
    }

    return (calculatedWeight * finalRatePerKg).toFixed(2);
  };

  const calculateDiscountFromPrice = (price, weight) => {
    const basePrice = getBasePrice();
    // For wholesale, include customer selling price
    let finalBasePrice = basePrice;
    if (billingOption.id === "wholesale" && Number(billData.customerSellingPrice) > 0) {
      finalBasePrice = Number(basePrice) + Number(billData.customerSellingPrice);
    }

    const totalBasePrice = weight * finalBasePrice;
    const priceReduction = totalBasePrice - price;
    return (priceReduction / weight).toFixed(2);
  };

  const handleInputChange = (field, value) => {
    setBillData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate price when weight, discount, product type, or customer selling price changes
      if (field === "weight" || field === "discountPerKg" || field === "productType" || field === "customerSellingPrice") {
        const calculatedPrice = calculatePrice(newData.weight, newData.discountPerKg, field === "productType" ? value : newData.productType);

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
    const calculatedPrice = calculatePrice(billData.weight, billData.discountPerKg, billData.productType);

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

  // Calculate conversion weights and prices
  const calculateWithSkinWeight = (liveWeight) => {
    if (!liveWeight || Number(liveWeight) <= 0 || !billData.withSkinRate || Number(billData.withSkinRate) <= 0) {
      return "0.00";
    }
    return (Number(liveWeight) / Number(billData.withSkinRate)).toFixed(2);
  };

  const calculateWithoutSkinWeight = (liveWeight) => {
    if (!liveWeight || Number(liveWeight) <= 0 || !billData.withoutSkinRate || Number(billData.withoutSkinRate) <= 0) {
      return "0.00";
    }
    return (Number(liveWeight) / Number(billData.withoutSkinRate)).toFixed(2);
  };

  const calculateWithSkinPricePerKg = () => {
    if (!billData.withSkinRate || Number(billData.withSkinRate) <= 0) {
      return "0.00";
    }
    const basePrice = getBasePrice();
    const customerPrice = Number(billData.customerSellingPrice) || 0;
    const totalRatePerKg = Number(basePrice) + customerPrice - Number(billData.discountPerKg || 0);
    return (totalRatePerKg * Number(billData.withSkinRate)).toFixed(2);
  };

  const calculateWithoutSkinPricePerKg = () => {
    if (!billData.withoutSkinRate || Number(billData.withoutSkinRate) <= 0) {
      return "0.00";
    }
    const basePrice = getBasePrice();
    const customerPrice = Number(billData.customerSellingPrice) || 0;
    const totalRatePerKg = Number(basePrice) + customerPrice - Number(billData.discountPerKg || 0);
    return (totalRatePerKg * Number(billData.withoutSkinRate)).toFixed(2);
  };

  const calculateWithSkinPrice = (liveWeight) => {
    if (!liveWeight || Number(liveWeight) <= 0 || !billData.withSkinRate || Number(billData.withSkinRate) <= 0) {
      return "0.00";
    }
    const withSkinWeight = Number(liveWeight) / Number(billData.withSkinRate);
    const pricePerKg = calculateWithSkinPricePerKg();
    return (withSkinWeight * Number(pricePerKg)).toFixed(2);
  };

  const calculateWithoutSkinPrice = (liveWeight) => {
    if (!liveWeight || Number(liveWeight) <= 0 || !billData.withoutSkinRate || Number(billData.withoutSkinRate) <= 0) {
      return "0.00";
    }
    const withoutSkinWeight = Number(liveWeight) / Number(billData.withoutSkinRate);
    const pricePerKg = calculateWithoutSkinPricePerKg();
    return (withoutSkinWeight * Number(pricePerKg)).toFixed(2);
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
      weightForStockValidation = weightForStockValidation / MEAT_CONVERSION_FACTOR;
    }

    if (weightForStockValidation > Number(currentStock)) {
      setMessage(`Weight cannot exceed current stock (${currentStock}kg ${weightType} weight)`);
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
      basePrice: getBasePrice(),
      finalPricePerKg: Number(getBasePrice()) + Number(billData.customerSellingPrice || 0) - Number(billData.discountPerKg || 0),
      productName: billingOption.name,
      weightType,
      // Store the raw weight (live weight) and also the weight appropriate for inventory deduction
      rawWeight: Number(billData.weight),
      inventoryWeight: weightType === "meat" ? Number(billData.weight) / MEAT_CONVERSION_FACTOR : Number(billData.weight),
      meatWeight: Number(billData.weight) / MEAT_CONVERSION_FACTOR,
      // Include conversion details if available
      withSkinWeight: calculateWithSkinWeight(billData.weight),
      withoutSkinWeight: calculateWithoutSkinWeight(billData.weight),
      withSkinPrice: calculateWithSkinPrice(billData.weight),
      withoutSkinPrice: calculateWithoutSkinPrice(billData.weight),
      withSkinPricePerKg: calculateWithSkinPricePerKg(),
      withoutSkinPricePerKg: calculateWithoutSkinPricePerKg(),
    };

    onBillGenerate(billWithMetadata);
  };

  // Determine if we should show the conversion details
  const shouldShowConversions = () => {
    return billingOption.id === "wholesale" && billData.selectedCustomer && Number(billData.withSkinRate) > 0 && Number(billData.withoutSkinRate) > 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Bill - {billingOption.name}</CardTitle>
        <CardDescription>
          Paper Rate: ₹{getBasePrice()}/kg
          {Number(billData.customerSellingPrice) > 0 && <span> + Customer Price: ₹{billData.customerSellingPrice}/kg</span>}
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
              {billingOption.id === "wholesale" && showCustomerDropdown && (
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

          {/* Customer selling price for wholesale */}
          {billingOption.id === "wholesale" && (
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
          {billingOption.id === "retail" && (
            <div>
              <label className="text-sm font-medium">Product Type *</label>
              <select
                value={billData.productType}
                onChange={(e) => handleInputChange("productType", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="live">Live Chicken (₹{rates.productPrices.liveChicken}/kg)</option>
                <option value="withSkin">With Skin (₹{rates.productPrices.chickenWithSkin}/kg)</option>
                <option value="meat">Meat (₹{rates.shopRate}/kg)</option>
              </select>
            </div>
          )}

          {/* Product Type Selection for Wholesale */}
          {billingOption.id === "wholesale" && (
            <div>
              <label className="text-sm font-medium">Product Type *</label>
              <select
                value={billData.productType}
                onChange={(e) => handleInputChange("productType", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="live">Live Chicken (₹{rates.paperRate}/kg)</option>
                <option value="meat">Chopped Chicken (₹{rates.shopRate}/kg)</option>
              </select>
            </div>
          )}

          {/* Weight, Birds, Discount and Price */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">
                Live weight (kg) *
                <span className="text-xs text-gray-500 ml-2">(Meat weight: {(Number(billData.weight || 0) / MEAT_CONVERSION_FACTOR).toFixed(2)} kg)</span>
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
                    const newDiscountPerKg = calculateDiscountFromPrice(newPrice, weight);
                    handleInputChange("discountPerKg", newDiscountPerKg);
                  }

                  handleInputChange("price", newPrice);
                }}
                className="mt-1"
              />
            </div>
            {billData.discountPerKg && billData.weight && (
              <div className="col-span-4 text-sm text-gray-500">
                Rate after discount: ₹{(Number(getBasePrice()) + Number(billData.customerSellingPrice || 0) - Number(billData.discountPerKg)).toFixed(2)}
                /kg
              </div>
            )}
          </div>

          {/* Conversion Details for Wholesale */}
          {shouldShowConversions() && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">Conversion Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-r border-blue-200 pr-4">
                  <h4 className="font-medium text-blue-700 mb-2">With Skin</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Conversion Rate:</td>
                        <td className="py-1 font-medium text-right">{billData.withSkinRate}</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Price Per Kg:</td>
                        <td className="py-1 font-medium text-right">₹{calculateWithSkinPricePerKg()}</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Converted Weight:</td>
                        <td className="py-1 font-medium text-right">{calculateWithSkinWeight(billData.weight)} kg</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 italic">Total Price:</td>
                        <td className="py-1 font-bold text-right">₹{calculateWithSkinPrice(billData.weight)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-medium text-blue-700 mb-2">Without Skin</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Conversion Rate:</td>
                        <td className="py-1 font-medium text-right">{billData.withoutSkinRate}</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Price Per Kg:</td>
                        <td className="py-1 font-medium text-right">₹{calculateWithoutSkinPricePerKg()}</td>
                      </tr>
                      <tr className="border-b border-blue-100">
                        <td className="py-1 text-blue-600 italic">Converted Weight:</td>
                        <td className="py-1 font-medium text-right">{calculateWithoutSkinWeight(billData.weight)} kg</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-blue-600 italic">Total Price:</td>
                        <td className="py-1 font-bold text-right">₹{calculateWithoutSkinPrice(billData.weight)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-blue-200 text-xs text-blue-600">
                <h4 className="text-sm text-blue-700 mb-2">Without Conversion</h4>
                <div>
                  Base Rate: ₹{getBasePrice()}/kg + Customer Price: ₹{billData.customerSellingPrice}/kg - Discount: ₹{billData.discountPerKg || 0}/kg
                </div>
                <div>
                  Final Customer Price: ₹{(Number(getBasePrice()) + Number(billData.customerSellingPrice) - Number(billData.discountPerKg || 0)).toFixed(2)}
                  /kg
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Payment Type *</label>
              <Select value={billData.paymentType} onChange={(e) => handleInputChange("paymentType", e.target.value)} className="mt-1">
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="partial">Partial</option>
              </Select>
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
              Generate Bill
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
