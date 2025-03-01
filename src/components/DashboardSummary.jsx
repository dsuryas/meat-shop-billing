import React from "react";
import { Card, CardContent } from "./ui/card";
import { MEAT_CONVERSION_FACTOR } from "../utils/storage";

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
  // Country chicken functions
  getTotalCountryInitialStock,
  getSoldCountryStockLiveWeight,
  getSoldCountryStockMeatWeight,
  getRemainingCountryStockLiveWeight,
  getRemainingCountryStockMeatWeight,
  getRemainingCountryBirds,
  getCountryChickenSales,
}) => {
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
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.paperRate}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Live Chicken</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.productPrices.liveChicken}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">With Skin</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.productPrices.chickenWithSkin}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Shop Rate (Meat)</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.shopRate}/kg</div>
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
                <div className="text-xl font-bold text-green-600">₹{dailySetup.productPrices.countryChicken || "N/A"}/kg</div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">With Skin</div>
                <div className="text-xl font-bold text-green-600">
                  ₹{dailySetup.productPrices.countryChickenWithSkin || dailySetup.productPrices.countryChicken || "N/A"}/kg
                </div>
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Meat</div>
                <div className="text-xl font-bold text-green-600">
                  ₹{dailySetup.productPrices.countryChickenMeat || dailySetup.productPrices.countryChicken || "N/A"}/kg
                </div>
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
                <div className="text-md font-bold text-gray-800">{getTotalInitialStock()} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{getSoldStockLiveWeight()} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                <div className="text-sm font-medium text-amber-800">Remaining:</div>
                <div className="text-lg font-bold text-amber-800">{getRemainingStockLiveWeight()} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-t pt-3">
                <div className="text-sm font-medium text-gray-600">Birds Remaining:</div>
                <div className="text-md font-bold text-gray-800">{getRemainingBirds()}</div>
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
                <div className="text-md font-bold text-gray-800">{getTotalInitialStockInMeatWeight()} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{getSoldStockMeatWeight()} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                <div className="text-sm font-medium text-purple-800">Remaining:</div>
                <div className="text-lg font-bold text-purple-800">{getRemainingStockMeatWeight()} kg</div>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center italic">Conversion: {MEAT_CONVERSION_FACTOR}</div>
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
                <div className="text-md font-bold text-gray-800">{getTotalCountryInitialStock ? getTotalCountryInitialStock() : "N/A"} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Sold:</div>
                <div className="text-md font-bold text-gray-800">{getSoldCountryStockLiveWeight ? getSoldCountryStockLiveWeight() : "0"} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div className="text-sm font-medium text-green-800">Remaining:</div>
                <div className="text-lg font-bold text-green-800">{getRemainingCountryStockLiveWeight ? getRemainingCountryStockLiveWeight() : "N/A"} kg</div>
              </div>
              <div className="flex justify-between items-center p-2 border-t pt-3">
                <div className="text-sm font-medium text-gray-600">Birds Remaining:</div>
                <div className="text-md font-bold text-gray-800">{getRemainingCountryBirds ? getRemainingCountryBirds() : "N/A"}</div>
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
                <div className="text-md font-bold text-gray-800">₹{dailySetup.estimatedEarnings.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <div className="text-sm font-medium text-blue-800">Current:</div>
                <div className="text-lg font-bold text-blue-800">₹{getCurrentEarnings()}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Retail</div>
                  <div className="text-sm font-semibold text-blue-600">₹{getRetailSales()}</div>
                </div>
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Wholesale</div>
                  <div className="text-sm font-semibold text-orange-600">₹{getWholesaleSales()}</div>
                </div>
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Country</div>
                  <div className="text-sm font-semibold text-green-600">₹{getCountryChickenSales ? getCountryChickenSales() : "0"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardSummary;
