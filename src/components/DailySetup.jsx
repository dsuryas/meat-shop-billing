import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor } from "../utils/storage";

const DailySetup = ({ onSetupComplete, onCancel, initialDate }) => {
  const [setupData, setSetupData] = useState({
    // Date field
    date: new Date().toISOString().split("T")[0],

    // Base rates
    paperRate: "",
    shopRate: "",

    // Broiler Stock info
    freshStock: "",
    remainingStock: "",
    freshBirds: "",
    remainingBirds: "",

    // Country Chicken Stock info
    countryFreshStock: "",
    countryRemainingStock: "",
    countryFreshBirds: "",
    countryRemainingBirds: "",

    // Product prices
    productPrices: {
      liveChicken: "",
      chickenWithSkin: "",
      choppedChicken: "",
      // Country chicken prices
      countryChicken: "",
      countryChickenWithSkin: "",
      countryChickenMeat: "",
    },

    // Estimation method
    estimationMethod: "liveRate", // or 'skinOutRate'
  });

  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [conversionFactors, setConversionFactors] = useState({
    broiler: getBroilerMeatConversionFactor(),
    countryChicken: getCountryChickenMeatConversionFactor(),
  });

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
    const totalBroilerStock = Number(setupData.freshStock || 0) + Number(setupData.remainingStock || 0);
    const totalCountryStock = Number(setupData.countryFreshStock || 0) + Number(setupData.countryRemainingStock || 0);

    let broilerEarnings = 0;
    let countryEarnings = 0;

    if (totalBroilerStock > 0) {
      if (setupData.estimationMethod === "liveRate") {
        const liveRate = Number(setupData.productPrices.liveChicken || 0);
        broilerEarnings = liveRate > 0 ? totalBroilerStock * liveRate : 0;
      } else {
        const shopRate = Number(setupData.shopRate || 0);
        broilerEarnings = shopRate > 0 ? (totalBroilerStock / 1.45) * shopRate : 0;
      }
    }

    if (totalCountryStock > 0) {
      const countryRate = Number(setupData.productPrices.countryChicken || 0);
      countryEarnings = countryRate > 0 ? totalCountryStock * countryRate : 0;
    }

    return broilerEarnings + countryEarnings;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate date
    if (!setupData.date) {
      setMessage("Please select a date");
      return;
    }

    // Validate rates are filled
    if (!setupData.paperRate || !setupData.shopRate) {
      setMessage("Please fill all rate fields");
      return;
    }

    // Validate stock and birds are at least 0 (not empty)
    if (
      setupData.freshStock === "" ||
      setupData.remainingStock === "" ||
      setupData.freshBirds === "" ||
      setupData.remainingBirds === "" ||
      setupData.countryFreshStock === "" ||
      setupData.countryRemainingStock === "" ||
      setupData.countryFreshBirds === "" ||
      setupData.countryRemainingBirds === ""
    ) {
      setMessage("Stock and bird count cannot be empty. Use 0 if none.");
      return;
    }

    // Validate numbers are not negative
    if (
      Number(setupData.freshStock) < 0 ||
      Number(setupData.remainingStock) < 0 ||
      Number(setupData.freshBirds) < 0 ||
      Number(setupData.remainingBirds) < 0 ||
      Number(setupData.countryFreshStock) < 0 ||
      Number(setupData.countryRemainingStock) < 0 ||
      Number(setupData.countryFreshBirds) < 0 ||
      Number(setupData.countryRemainingBirds) < 0
    ) {
      setMessage("Stock and bird count cannot be negative");
      return;
    }

    // Validate product prices
    if (!setupData.productPrices.liveChicken || !setupData.productPrices.chickenWithSkin) {
      setMessage("Please fill all broiler product prices");
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
          {/* Date Selection */}
          <div>
            <label className="text-sm font-medium">Date</label>
            <Input type="date" value={setupData.date} onChange={(e) => handleInputChange("date", e.target.value)} className="mt-1" disabled={isComplete} />
          </div>

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
                  onChange={(e) => handleInputChange("paperRate", e.target.value)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Shop Rate (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter shop rate"
                  value={setupData.shopRate}
                  onChange={(e) => {
                    // Update both shop rate and chopped chicken rate
                    const value = e.target.value;
                    setSetupData((prev) => ({
                      ...prev,
                      shopRate: value,
                      productPrices: {
                        ...prev.productPrices,
                        choppedChicken: value,
                      },
                    }));
                  }}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
            </div>
          </div>

          {/* Broiler Stock Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Broiler Stock Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Fresh Stock Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter fresh stock weight"
                    value={setupData.freshStock}
                    onChange={(e) => handleInputChange("freshStock", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fresh Stock (Birds)</label>
                  <Input
                    type="number"
                    placeholder="Enter number of birds"
                    value={setupData.freshBirds}
                    onChange={(e) => handleInputChange("freshBirds", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Remaining Stock Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter remaining stock weight"
                    value={setupData.remainingStock}
                    onChange={(e) => handleInputChange("remainingStock", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Remaining Stock (Birds)</label>
                  <Input
                    type="number"
                    placeholder="Enter number of birds"
                    value={setupData.remainingBirds}
                    onChange={(e) => handleInputChange("remainingBirds", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Broiler Product Prices */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Broiler Product Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Live Chicken (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.liveChicken}
                  onChange={(e) => handleInputChange("liveChicken", e.target.value, true)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chicken with Skin (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.chickenWithSkin}
                  onChange={(e) => handleInputChange("chickenWithSkin", e.target.value, true)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Chopped Chicken (₹/kg)
                  <span className="text-xs text-gray-500 ml-2">(Shop rate)</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Equal to shop rate"
                  value={setupData.productPrices.choppedChicken}
                  className="mt-1 bg-gray-50"
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Country Chicken Stock Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Country Chicken Stock Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Fresh Stock Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter fresh stock weight"
                    value={setupData.countryFreshStock}
                    onChange={(e) => handleInputChange("countryFreshStock", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fresh Stock (Birds)</label>
                  <Input
                    type="number"
                    placeholder="Enter number of birds"
                    value={setupData.countryFreshBirds}
                    onChange={(e) => handleInputChange("countryFreshBirds", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Remaining Stock Weight (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter remaining stock weight"
                    value={setupData.countryRemainingStock}
                    onChange={(e) => handleInputChange("countryRemainingStock", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Remaining Stock (Birds)</label>
                  <Input
                    type="number"
                    placeholder="Enter number of birds"
                    value={setupData.countryRemainingBirds}
                    onChange={(e) => handleInputChange("countryRemainingBirds", e.target.value)}
                    className="mt-1"
                    disabled={isComplete}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Country Chicken Product Prices */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Country Chicken Product Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Live Country Chicken (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.countryChicken}
                  onChange={(e) => handleInputChange("countryChicken", e.target.value, true)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country Chicken with Skin (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.countryChickenWithSkin}
                  onChange={(e) => handleInputChange("countryChickenWithSkin", e.target.value, true)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country Chicken Meat (₹/kg)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter price"
                  value={setupData.productPrices.countryChickenMeat}
                  onChange={(e) => handleInputChange("countryChickenMeat", e.target.value, true)}
                  className="mt-1"
                  disabled={isComplete}
                />
              </div>
            </div>
          </div>

          {/* Estimation Method */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Revenue Estimation Method</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="liveRate"
                  name="estimationMethod"
                  checked={setupData.estimationMethod === "liveRate"}
                  onChange={(e) => handleInputChange("estimationMethod", e.target.value)}
                  disabled={isComplete}
                  className="text-blue-600"
                />
                <span className="text-sm">Live Chicken Rate (Total Stock × Live Rate)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="skinOutRate"
                  name="estimationMethod"
                  checked={setupData.estimationMethod === "skinOutRate"}
                  onChange={(e) => handleInputChange("estimationMethod", e.target.value)}
                  disabled={isComplete}
                  className="text-blue-600"
                />
                <span className="text-sm">Skin out Rate ((Total Stock ÷ 1.45) × Skin out Rate)</span>
              </label>
            </div>
          </div>

          {/* Summary Information */}
          {(setupData.freshStock !== "" && setupData.remainingStock !== "") ||
            (setupData.countryFreshStock !== "" && setupData.countryRemainingStock !== "" && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg space-y-2">
                <h3 className="text-lg font-semibold text-green-700">Summary</h3>
                <div className="space-y-1 text-sm text-green-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-green-800">Broiler Chicken</p>
                      <p>
                        Total stock: {Number(setupData.freshStock || 0) + Number(setupData.remainingStock || 0)}
                        kg
                      </p>
                      <p>Total birds: {Number(setupData.freshBirds || 0) + Number(setupData.remainingBirds || 0)}</p>
                      {setupData.estimationMethod === "skinOutRate" && (
                        <p>
                          Estimated meat quantity: {((Number(setupData.freshStock || 0) + Number(setupData.remainingStock || 0)) / 1.45).toFixed(2)}
                          kg
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Country Chicken</p>
                      <p>
                        Total stock: {Number(setupData.countryFreshStock || 0) + Number(setupData.countryRemainingStock || 0)}
                        kg
                      </p>
                      <p>Total birds: {Number(setupData.countryFreshBirds || 0) + Number(setupData.countryRemainingBirds || 0)}</p>
                    </div>
                  </div>
                  {(Number(setupData.freshStock || 0) + Number(setupData.remainingStock || 0) > 0 ||
                    Number(setupData.countryFreshStock || 0) + Number(setupData.countryRemainingStock || 0) > 0) && (
                    <p className="text-xl font-bold text-green-700 mt-2 pt-2 border-t border-green-200">
                      Estimated Earnings: ₹{calculateEstimatedEarnings().toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}

          {!isComplete && (
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Complete Daily Setup
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                  Cancel
                </Button>
              )}
            </div>
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
