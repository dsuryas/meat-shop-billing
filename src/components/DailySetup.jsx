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

const DailySetup = ({ onSetupComplete }) => {
  const [setupData, setSetupData] = useState({
    // Base rates
    paperRate: "",
    retailRate: "",

    // Stock info
    freshStock: "",
    remainingStock: "",

    // Product-specific retail prices
    productPrices: {
      liveChicken: "",
      chickenWithSkin: "",
      choppedChicken: "",
      countryChicken: "",
    },
  });

  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (field, value, isProduct = false) => {
    setSetupData((prev) => ({
      ...prev,
      ...(isProduct
        ? {
            productPrices: {
              ...prev.productPrices,
              [field]: value,
            },
          }
        : { [field]: value }),
    }));
  };

  const calculateEstimatedEarnings = () => {
    const totalStock =
      Number(setupData.freshStock) + Number(setupData.remainingStock);
    const choppedChickenPrice = Number(setupData.productPrices.choppedChicken);
    return totalStock * choppedChickenPrice;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields are filled
    const baseFields = [
      "paperRate",
      "retailRate",
      "freshStock",
      "remainingStock",
    ];
    const productFields = Object.keys(setupData.productPrices);

    const isBaseFieldsEmpty = baseFields.some((field) => !setupData[field]);
    const isProductFieldsEmpty = productFields.some(
      (field) => !setupData.productPrices[field]
    );

    if (isBaseFieldsEmpty || isProductFieldsEmpty) {
      setMessage("Please fill all fields");
      return;
    }

    const estimatedEarnings = calculateEstimatedEarnings();

    onSetupComplete({
      ...setupData,
      estimatedEarnings,
      timestamp: new Date().toISOString(),
    });

    setIsComplete(true);
    setMessage("Daily setup completed successfully!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Setup</CardTitle>
        <CardDescription>Set today's rates and stock details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Base Rates */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Base Rates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Paper Rate (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter paper rate"
                  value={setupData.paperRate}
                  onChange={(e) =>
                    handleInputChange("paperRate", e.target.value)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Base Retail Rate (₹/kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter retail rate"
                  value={setupData.retailRate}
                  onChange={(e) =>
                    handleInputChange("retailRate", e.target.value)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stock Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fresh Stock (kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter fresh stock"
                  value={setupData.freshStock}
                  onChange={(e) =>
                    handleInputChange("freshStock", e.target.value)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Remaining Stock (kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter remaining stock"
                  value={setupData.remainingStock}
                  onChange={(e) =>
                    handleInputChange("remainingStock", e.target.value)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
            </div>
          </div>

          {/* Product-specific Retail Prices */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Product Retail Prices
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Live Chicken (₹/kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.liveChicken}
                  onChange={(e) =>
                    handleInputChange("liveChicken", e.target.value, true)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Chicken with Skin (₹/kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.chickenWithSkin}
                  onChange={(e) =>
                    handleInputChange("chickenWithSkin", e.target.value, true)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Chopped Chicken (₹/kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.choppedChicken}
                  onChange={(e) =>
                    handleInputChange("choppedChicken", e.target.value, true)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Country Chicken (₹/kg)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.countryChicken}
                  onChange={(e) =>
                    handleInputChange("countryChicken", e.target.value, true)
                  }
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
            </div>
          </div>

          {/* Estimated Earnings Display */}
          {(setupData.freshStock || setupData.remainingStock) &&
            setupData.productPrices.choppedChicken && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-700">
                  Estimated Earnings
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  ₹{calculateEstimatedEarnings().toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  Based on total stock of{" "}
                  {Number(setupData.freshStock) +
                    Number(setupData.remainingStock)}{" "}
                  kg
                </p>
              </div>
            )}

          {!isComplete && (
            <Button type="submit" className="w-full">
              Complete Daily Setup
            </Button>
          )}

          {message && (
            <Alert className={isComplete ? "bg-green-50" : "bg-red-50"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default DailySetup;
