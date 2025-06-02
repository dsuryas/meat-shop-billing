import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "./ui/card";
import ConversionFactorDisplay from "./ConversionRates/ConversionFactorDisplay";

const DashboardSummary = ({
  dailySetup,
  bills,
  getTotalInitialStock,
  getSoldStockLiveWeight,
  getSoldStockMeatWeight,
  getRemainingStockLiveWeight,
  getRemainingStockMeatWeight,
  getTotalInitialStockInMeatWeight,
  getRemainingBirds,
  getCurrentEarnings,
  getRetailSales,
  getWholesaleSales,
  // Country chicken functions with default values using parameter defaults
  getTotalCountryInitialStock = () => 0,
  getSoldCountryStockLiveWeight = () => 0,
  getSoldCountryStockMeatWeight = () => 0,
  getRemainingCountryStockLiveWeight = () => 0,
  getRemainingCountryStockMeatWeight = () => 0,
  getRemainingCountryBirds = () => 0,
  getCountryChickenSales = () => 0,
}) => {
  // State to hold calculated values to prevent Promise rendering issues
  const [calculatedValues, setCalculatedValues] = useState({
    totalInitialStock: "0",
    soldStockLiveWeight: "0",
    soldStockMeatWeight: "0",
    remainingStockLiveWeight: "0",
    remainingStockMeatWeight: "0",
    totalInitialStockInMeatWeight: "0",
    remainingBirds: "0",
    currentEarnings: "0",
    retailSales: "0",
    wholesaleSales: "0",
    totalCountryInitialStock: "0",
    soldCountryStockLiveWeight: "0",
    soldCountryStockMeatWeight: "0",
    remainingCountryStockLiveWeight: "0",
    remainingCountryStockMeatWeight: "0",
    remainingCountryBirds: "0",
    countryChickenSales: "0",
  });

  // Create a default dailySetup object for when it's missing or incomplete
  const defaultDailySetup = {
    paperRate: 0,
    shopRate: 0,
    estimatedEarnings: 0,
    productPrices: {
      liveChicken: 0,
      chickenWithSkin: 0,
      choppedChicken: 0,
      countryChicken: "N/A",
      countryChickenWithSkin: "N/A",
      countryChickenMeat: "N/A",
    },
  };

  // Ensure dailySetup is always a valid object
  const ensuredDailySetup = dailySetup || defaultDailySetup;

  // Error handling for required props
  if (!bills || !Array.isArray(bills)) {
    console.error("DashboardSummary: bills prop must be an array");
    // Still continue rendering with an empty array instead of breaking the page
    bills = [];
  }

  // Safely access dailySetup properties with error handling
  const getProductPrice = (key, defaultValue = "N/A") => {
    try {
      return ensuredDailySetup.productPrices && ensuredDailySetup.productPrices[key] !== undefined && ensuredDailySetup.productPrices[key] !== null
        ? ensuredDailySetup.productPrices[key]
        : defaultValue;
    } catch (error) {
      console.error(`Error accessing product price ${key}:`, error);
      return defaultValue;
    }
  };

  // Safe rendering of estimated earnings
  const renderEstimatedEarnings = () => {
    try {
      // Check if estimatedEarnings exists and is a number before calling toFixed
      return typeof ensuredDailySetup.estimatedEarnings === "number" ? ensuredDailySetup.estimatedEarnings.toFixed(2) : "0.00";
    } catch (error) {
      console.error("Error formatting estimated earnings:", error);
      return "0.00";
    }
  };

  // Calculate values and update state when props change
  useEffect(() => {
    // Safe calculation helper for async handling
    const calculateAndUpdateState = async () => {
      try {
        const newValues = {};

        // Helper to safely execute a calculation function
        const safeCalc = async (fn, key, defaultValue = "0") => {
          try {
            if (typeof fn !== "function") {
              console.error(`Expected a function for ${key} but received:`, fn);
              return defaultValue;
            }

            const result = fn();

            // Handle both synchronous and Promise results
            if (result && typeof result.then === "function") {
              try {
                const resolvedValue = await result;
                newValues[key] = !isNaN(resolvedValue) && resolvedValue !== null && resolvedValue !== undefined ? resolvedValue : defaultValue;
              } catch (error) {
                console.error(`Error resolving promise for ${key}:`, error);
                newValues[key] = defaultValue;
              }
            } else {
              newValues[key] = !isNaN(result) && result !== null && result !== undefined ? result : defaultValue;
            }
          } catch (error) {
            console.error(`Error calculating ${key}:`, error);
            newValues[key] = defaultValue;
          }
        };

        // Execute all calculations
        await Promise.all([
          safeCalc(getTotalInitialStock, "totalInitialStock"),
          safeCalc(getSoldStockLiveWeight, "soldStockLiveWeight"),
          safeCalc(getSoldStockMeatWeight, "soldStockMeatWeight"),
          safeCalc(getRemainingStockLiveWeight, "remainingStockLiveWeight"),
          safeCalc(getRemainingStockMeatWeight, "remainingStockMeatWeight"),
          safeCalc(getTotalInitialStockInMeatWeight, "totalInitialStockInMeatWeight"),
          safeCalc(getRemainingBirds, "remainingBirds"),
          safeCalc(getCurrentEarnings, "currentEarnings"),
          safeCalc(getRetailSales, "retailSales"),
          safeCalc(getWholesaleSales, "wholesaleSales"),
          safeCalc(getTotalCountryInitialStock, "totalCountryInitialStock"),
          safeCalc(getSoldCountryStockLiveWeight, "soldCountryStockLiveWeight"),
          safeCalc(getSoldCountryStockMeatWeight, "soldCountryStockMeatWeight"),
          safeCalc(getRemainingCountryStockLiveWeight, "remainingCountryStockLiveWeight"),
          safeCalc(getRemainingCountryStockMeatWeight, "remainingCountryStockMeatWeight"),
          safeCalc(getRemainingCountryBirds, "remainingCountryBirds"),
          safeCalc(getCountryChickenSales, "countryChickenSales"),
        ]);

        // Update state with all new values
        setCalculatedValues(newValues);
      } catch (error) {
        console.error("Error updating calculated values:", error);
      }
    };

    calculateAndUpdateState();
  }, [
    dailySetup,
    bills,
    getTotalInitialStock,
    getSoldStockLiveWeight,
    getSoldStockMeatWeight,
    getRemainingStockLiveWeight,
    getRemainingStockMeatWeight,
    getTotalInitialStockInMeatWeight,
    getRemainingBirds,
    getCurrentEarnings,
    getRetailSales,
    getWholesaleSales,
    getTotalCountryInitialStock,
    getSoldCountryStockLiveWeight,
    getSoldCountryStockMeatWeight,
    getRemainingCountryStockLiveWeight,
    getRemainingCountryStockMeatWeight,
    getRemainingCountryBirds,
    getCountryChickenSales,
  ]);
  return (
    <div className="space-y-6">
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retail Broiler Rates */}
        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="font-medium text-blue-800">Retail Broiler Rates</h3>
          </div>
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Paper Rate</div>
                <div className="text-xl font-bold text-blue-600">₹{ensuredDailySetup?.paperRate || 0}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Live Chicken</div>
                <div className="text-xl font-bold text-blue-600">₹{getProductPrice("liveChicken", 0)}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">With Skin</div>
                <div className="text-xl font-bold text-blue-600">₹{getProductPrice("chickenWithSkin", 0)}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Shop Rate (Meat)</div>
                <div className="text-xl font-bold text-blue-600">₹{ensuredDailySetup.shopRate || 0}/kg</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Country Chicken Rates */}
        <Card className="border-green-100 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="font-medium text-green-800">Country Chicken Rates</h3>
          </div>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Live Chicken</div>
                <div className="text-xl font-bold text-green-600">₹{getProductPrice("countryChicken", "N/A")}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">With Skin</div>
                <div className="text-xl font-bold text-green-600">
                  ₹{getProductPrice("countryChickenWithSkin") || getProductPrice("countryChicken", "N/A")}/kg
                </div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Meat</div>
                <div className="text-xl font-bold text-green-600">₹{getProductPrice("countryChickenMeat") || getProductPrice("countryChicken", "N/A")}/kg</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock and Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Broiler Live Weight Stock Card */}
        <Card className="border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
            <h3 className="font-medium text-amber-800">Broiler Live Weight</h3>
          </div>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Initial Stock:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.totalInitialStock} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.soldStockLiveWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                <div className="text-sm font-medium text-amber-800">Remaining:</div>
                <div className="text-lg font-bold text-amber-800">{calculatedValues.remainingStockLiveWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-t pt-3">
                <div className="text-sm font-medium text-gray-600">Birds Remaining:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.remainingBirds}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broiler Meat Weight Stock Card */}
        <Card className="border-purple-100 shadow-sm overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
            <h3 className="font-medium text-purple-800">Broiler Meat Weight</h3>
          </div>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Initial Stock:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.totalInitialStockInMeatWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.soldStockMeatWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                <div className="text-sm font-medium text-purple-800">Remaining:</div>
                <div className="text-lg font-bold text-purple-800">{calculatedValues.remainingStockMeatWeight} kg</div>
              </div>
              <div className="mt-2 text-center">
                <ConversionFactorDisplay compact className="italic" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Country Chicken Stock Card */}
        <Card className="border-green-100 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="font-medium text-green-800">Country Chicken Stock</h3>
          </div>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Initial Stock:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.totalCountryInitialStock} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.soldCountryStockLiveWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div className="text-sm font-medium text-green-800">Remaining:</div>
                <div className="text-lg font-bold text-green-800">{calculatedValues.remainingCountryStockLiveWeight} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-t pt-3">
                <div className="text-sm font-medium text-gray-600">Birds Remaining:</div>
                <div className="text-md font-bold text-gray-800">{calculatedValues.remainingCountryBirds}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="font-medium text-blue-800">Revenue</h3>
          </div>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Estimated:</div>
                <div className="text-md font-bold text-gray-800">₹{renderEstimatedEarnings()}</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-800">Current:</div>
                <div className="text-lg font-bold text-blue-800">₹{calculatedValues.currentEarnings}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Retail</div>
                  <div className="text-sm font-semibold text-blue-600">₹{calculatedValues.retailSales}</div>
                </div>
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Wholesale</div>
                  <div className="text-sm font-semibold text-orange-600">₹{calculatedValues.wholesaleSales}</div>
                </div>
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Country</div>
                  <div className="text-sm font-semibold text-green-600">₹{calculatedValues.countryChickenSales}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Define the dailySetup shape for better validation
const dailySetupShape = PropTypes.shape({
  paperRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  shopRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  estimatedEarnings: PropTypes.number.isRequired,
  productPrices: PropTypes.shape({
    liveChicken: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    chickenWithSkin: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    countryChicken: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    countryChickenWithSkin: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    countryChickenMeat: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
});

// Define the bill shape for better validation
const billShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  customerName: PropTypes.string.isRequired,
  customerPhone: PropTypes.string,
  billOption: PropTypes.object,
  weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  category: PropTypes.string.isRequired,
  productType: PropTypes.string.isRequired,
  chickenType: PropTypes.string,
  timestamp: PropTypes.string,
});

// Prop validation
DashboardSummary.propTypes = {
  // Required props
  dailySetup: dailySetupShape.isRequired,
  bills: PropTypes.arrayOf(billShape).isRequired,

  // Broiler stock calculation functions (all required)
  getTotalInitialStock: PropTypes.func.isRequired,
  getSoldStockLiveWeight: PropTypes.func.isRequired,
  getSoldStockMeatWeight: PropTypes.func.isRequired,
  getRemainingStockLiveWeight: PropTypes.func.isRequired,
  getRemainingStockMeatWeight: PropTypes.func.isRequired,
  getTotalInitialStockInMeatWeight: PropTypes.func.isRequired,
  getRemainingBirds: PropTypes.func.isRequired,

  // Revenue calculation functions (all required)
  getCurrentEarnings: PropTypes.func.isRequired,
  getRetailSales: PropTypes.func.isRequired,
  getWholesaleSales: PropTypes.func.isRequired,

  // Country chicken functions (optional)
  getTotalCountryInitialStock: PropTypes.func,
  getSoldCountryStockLiveWeight: PropTypes.func,
  getSoldCountryStockMeatWeight: PropTypes.func,
  getRemainingCountryStockLiveWeight: PropTypes.func,
  getRemainingCountryStockMeatWeight: PropTypes.func,
  getRemainingCountryBirds: PropTypes.func,
  getCountryChickenSales: PropTypes.func,
};

export default DashboardSummary;
