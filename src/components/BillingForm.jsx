import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

const BillingForm = ({ rates, onCancel, onBillGenerate }) => {
  const [billData, setBillData] = useState({
    customerName: "",
    customerPhone: "",
    saleType: "retail", // retail, wholesale, deceased
    productType: "liveChicken", // liveChicken, chickenWithSkin, choppedChicken, countryChicken
    weight: "",
    price: "",
    paymentType: "cash", // cash, online, partial
    amountPaid: "",
  });

  const [message, setMessage] = useState("");

  const calculatePrice = (productType, weight) => {
    if (!weight || !rates?.productPrices) return "";

    const pricePerKg = rates.productPrices[productType];
    return (Number(weight) * Number(pricePerKg)).toFixed(2);
  };

  const handleInputChange = (field, value) => {
    setBillData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-calculate price when weight or product type changes
      if (field === "weight" || field === "productType") {
        newData.price = calculatePrice(newData.productType, newData.weight);
      }

      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !billData.customerName ||
      !billData.customerPhone ||
      !billData.weight ||
      !billData.price ||
      !billData.amountPaid
    ) {
      setMessage("Please fill all required fields");
      return;
    }

    onBillGenerate(billData);

    // Reset form
    setBillData({
      customerName: "",
      customerPhone: "",
      saleType: "retail",
      productType: "liveChicken",
      weight: "",
      price: "",
      paymentType: "cash",
      amountPaid: "",
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Generate Bill</CardTitle>
        <CardDescription>Create a new bill for customer</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                placeholder="Enter name"
                value={billData.customerName}
                onChange={(e) =>
                  handleInputChange("customerName", e.target.value)
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone Number</label>
              <Input
                placeholder="Enter phone"
                value={billData.customerPhone}
                onChange={(e) =>
                  handleInputChange("customerPhone", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Sale Type</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                value={billData.saleType}
                onChange={(e) => handleInputChange("saleType", e.target.value)}
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="deceased">Deceased Stock</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Product Type</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                value={billData.productType}
                onChange={(e) =>
                  handleInputChange("productType", e.target.value)
                }
              >
                <option value="liveChicken">Live Chicken</option>
                <option value="chickenWithSkin">Chicken with Skin</option>
                <option value="choppedChicken">Chopped Chicken</option>
                <option value="countryChicken">Country Chicken</option>
              </select>
            </div>
          </div>

          {/* Weight and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Weight (kg)</label>
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
              <label className="text-sm font-medium">Price (₹)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Total price"
                value={billData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Payment Type</label>
              <select
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                value={billData.paymentType}
                onChange={(e) =>
                  handleInputChange("paymentType", e.target.value)
                }
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount Paid</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={billData.amountPaid}
                onChange={(e) =>
                  handleInputChange("amountPaid", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              Generate Bill
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
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
