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
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    // If editing, populate form with existing data
    if (editData) {
      setBillData(editData);
    }
  }, [editData]);

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
          return rates.paperRate;
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
    const finalRatePerKg = Math.max(0, Number(basePrice) - Number(discountPerKg || 0));

    let calculatedWeight = Number(weight);

    // Only convert to meat weight if product type is meat for retail broilers
    if (billingOption.id === "retail" && productType === "meat") {
      calculatedWeight = calculatedWeight / MEAT_CONVERSION_FACTOR;
    }

    console.log("Calculated price:", {
      calculatedWeight,
      basePrice,
      billingOption,
      productType: billData.productType,
    });

    return (calculatedWeight * finalRatePerKg).toFixed(2);
  };

  const calculateDiscountFromPrice = (price, weight) => {
    const basePrice = getBasePrice();
    const totalBasePrice = weight * basePrice;
    const priceReduction = totalBasePrice - price;
    return (priceReduction / weight).toFixed(2);
  };

  const handleInputChange = (field, value) => {
    setBillData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate price when weight, discount or product type changes
      if (field === "weight" || field === "discountPerKg" || field === "productType") {
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

    if (Number(billData.weight) > Number(currentStock)) {
      setMessage(`Weight cannot exceed current stock (${currentStock}kg)`);
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
      productName: billingOption.name,
      weightType,
    };

    onBillGenerate(billWithMetadata);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Bill - {billingOption.name}</CardTitle>
        <CardDescription>Base Rate: ₹{getBasePrice()}/kg</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Customer Name *</label>
              <Input
                placeholder="Enter name"
                value={billData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                className="mt-1"
              />
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

          {/* Product Type Selection for Retail */}
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

          {/* Weight, Birds, Discount and Price */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">
                Weight (kg) *
                {billingOption.id === "retail" && billData.productType === "meat" && (
                  <span className="text-xs text-gray-500 ml-2">(Meat weight: {(Number(billData.weight || 0) / MEAT_CONVERSION_FACTOR).toFixed(2)} kg)</span>
                )}
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
                  const basePrice = getBasePrice();

                  // Calculate discount per kg based on entered price
                  if (weight && basePrice) {
                    const totalBasePrice = weight * basePrice;
                    const priceReduction = totalBasePrice - Number(newPrice);
                    const newDiscountPerKg = (priceReduction / weight).toFixed(2);

                    handleInputChange("discountPerKg", newDiscountPerKg);
                  }

                  handleInputChange("price", newPrice);
                }}
                className="mt-1"
              />
            </div>
            {billData.discountPerKg && billData.weight && (
              <div className="col-span-4 text-sm text-gray-500">
                Rate after discount: ₹{(getBasePrice() - Number(billData.discountPerKg)).toFixed(2)}
                /kg
              </div>
            )}
          </div>

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
