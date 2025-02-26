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
                {/* <div className="text-xs text-gray-400 mt-1">Wholesale</div> */}
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Live Chicken</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.productPrices.liveChicken}/kg</div>
                {/* <div className="text-xs text-gray-400 mt-1">Retail</div> */}
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">With Skin</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.productPrices.chickenWithSkin}/kg</div>
                {/* <div className="text-xs text-gray-400 mt-1">Skin out</div> */}
              </div>
              <div className="border rounded-md p-3 bg-white shadow-sm">
                <div className="text-sm text-gray-500">Shop Rate (Meat)</div>
                <div className="text-xl font-bold text-blue-600">₹{dailySetup.shopRate}/kg</div>
                {/* <div className="text-xs text-gray-400 mt-1">Chopped</div> */}
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
            <div className={dailySetup.productPrices.countryChicken ? "border rounded-md p-3 bg-white shadow-sm" : "p-3 flex items-center justify-center"}>
              {dailySetup.productPrices.countryChicken ? (
                <>
                  <div className="text-sm text-gray-500">Country Chicken Rate</div>
                  <div className="text-xl font-bold text-green-600">₹{dailySetup.productPrices.countryChicken}/kg</div>
                  {/* <div className="text-xs text-gray-400 mt-1">Naatu Kozhi</div> */}
                </>
              ) : (
                <div className="text-sm text-gray-500 italic">No country chicken rates set for today</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock and Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Weight Stock Card */}
        <Card className="border-amber-100 shadow-sm overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
            <h3 className="font-medium text-amber-800">Live Weight Stock</h3>
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

        {/* Meat Weight Stock Card */}
        <Card className="border-purple-100 shadow-sm overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
            <h3 className="font-medium text-purple-800">Meat Weight Stock</h3>
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
              <div className="text-xs text-gray-500 mt-2 text-center italic">Converted using factor: {MEAT_CONVERSION_FACTOR}</div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="border-green-100 shadow-sm overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <h3 className="font-medium text-green-800">Revenue</h3>
          </div>
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center p-2 border-b">
                <div className="text-sm font-medium text-gray-600">Estimated:</div>
                <div className="text-md font-bold text-gray-800">₹{dailySetup.estimatedEarnings.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <div className="text-sm font-medium text-green-800">Current:</div>
                <div className="text-lg font-bold text-green-800">₹{getCurrentEarnings()}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Retail</div>
                  <div className="text-sm font-semibold text-blue-600">₹{getRetailSales()}</div>
                </div>
                <div className="border rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Wholesale</div>
                  <div className="text-sm font-semibold text-orange-600">₹{getWholesaleSales()}</div>
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
