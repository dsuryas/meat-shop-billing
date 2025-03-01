import React, { useState, useEffect, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, FileText, BarChart2, ShoppingBag } from "lucide-react";
import { formatDate, MEAT_CONVERSION_FACTOR, COUNTRY_MEAT_CONVERSION_FACTOR, getClosedDay } from "../utils/storage";

// Lazy-load components
const BillsTable = React.lazy(() => import("./BillsTable"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));

const HistoricalDayDetails = ({ dayData, onBack }) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [fullDayData, setFullDayData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!dayData) {
      setIsLoading(false);
      return;
    }

    // Normalize the data structure
    let normalizedData;

    if (dayData.closingData) {
      // We already have a structured object
      normalizedData = dayData;
    } else {
      // We have just the closing data, create a wrapper
      normalizedData = {
        date: dayData.date,
        closingData: dayData,
        bills: dayData.bills || [],
        setup: dayData.setup || {},
      };
    }

    // Check if we have complete data or need to reconstruct it
    if (!normalizedData.bills || !normalizedData.setup || Object.keys(normalizedData.setup).length === 0) {
      // Try to get the closed day data from localStorage
      const closedDay = getClosedDay();

      if (closedDay && normalizedData.closingData && new Date(closedDay.date).toDateString() === new Date(normalizedData.closingData.date).toDateString()) {
        // We found matching data, use it
        setFullDayData({
          date: normalizedData.closingData.date,
          closingData: normalizedData.closingData,
          bills: closedDay.bills || [],
          setup: closedDay.setup || {},
        });
      } else {
        // Create default values based on what we have
        setFullDayData({
          date: normalizedData.closingData.date,
          closingData: normalizedData.closingData,
          bills: [],
          setup: {
            estimationMethod: normalizedData.closingData.estimationMethod || "liveRate",
            paperRate: 0,
            shopRate: 0,
            freshStock: 0,
            remainingStock: 0,
            freshBirds: 0,
            remainingBirds: 0,
            countryFreshStock: 0,
            countryRemainingStock: 0,
            countryFreshBirds: 0,
            countryRemainingBirds: 0,
            estimatedEarnings: normalizedData.closingData.estimatedEarnings || 0,
            productPrices: {
              liveChicken: 0,
              chickenWithSkin: 0,
              choppedChicken: 0,
              countryChicken: 0,
              countryChickenWithSkin: 0,
              countryChickenMeat: 0,
            },
          },
        });
      }
    } else {
      // We have complete data
      setFullDayData(normalizedData);
    }

    setIsLoading(false);
  }, [dayData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading historical data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fullDayData || !fullDayData.closingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            Historical Day Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No data available for this day.</p>
            <p className="text-sm mt-2">The historical record might be incomplete or not properly saved.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const closingData = fullDayData.closingData;
  const bills = fullDayData.bills || [];
  const setup = fullDayData.setup || {};

  // Broiler calculation utilities
  const getTotalInitialStock = () => {
    if (!setup) return 0;
    return Number(setup.freshStock || 0) + Number(setup.remainingStock || 0);
  };

  const getTotalInitialStockInMeatWeight = () => {
    if (!setup) return 0;
    return (getTotalInitialStock() / MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => !bill.chickenType || bill.chickenType === "broiler")
      .reduce((total, bill) => {
        return total + Number(bill.rawWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getSoldStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => !bill.chickenType || bill.chickenType === "broiler")
      .reduce((total, bill) => {
        if (bill.weightType === "live") {
          return total + Number(bill.meatWeight || 0);
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getRemainingStockLiveWeight = () => {
    const totalLive = getTotalInitialStock();
    const soldLive = getSoldStockLiveWeight();
    return Math.max(0, Number(totalLive) - Number(soldLive)).toFixed(3);
  };

  const getRemainingStockMeatWeight = () => {
    const totalMeat = getTotalInitialStockInMeatWeight();
    const soldMeat = getSoldStockMeatWeight();
    return Math.max(0, Number(totalMeat) - Number(soldMeat)).toFixed(2);
  };

  const getTotalBirds = () => {
    return bills.filter((bill) => !bill.chickenType || bill.chickenType === "broiler").reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingBirds = () => {
    if (!setup) return 0;
    const totalInitialBirds = Number(setup.freshBirds || 0) + Number(setup.remainingBirds || 0);
    return totalInitialBirds - getTotalBirds();
  };

  // Country chicken calculation utilities
  const getTotalCountryInitialStock = () => {
    if (!setup) return 0;
    return Number(setup.countryFreshStock || 0) + Number(setup.countryRemainingStock || 0);
  };

  const getTotalCountryInitialStockInMeatWeight = () => {
    if (!setup) return 0;
    return (getTotalCountryInitialStock() / COUNTRY_MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldCountryStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => bill.chickenType === "country")
      .reduce((total, bill) => {
        return total + Number(bill.rawWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getSoldCountryStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => bill.chickenType === "country")
      .reduce((total, bill) => {
        if (bill.weightType === "live") {
          return total + Number(bill.meatWeight || 0);
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getRemainingCountryStockLiveWeight = () => {
    if (closingData.actualCountryStock) {
      return Number(closingData.actualCountryStock).toFixed(2);
    }

    const totalCountryLive = getTotalCountryInitialStock();
    const soldCountryLive = getSoldCountryStockLiveWeight();
    return Math.max(0, Number(totalCountryLive) - Number(soldCountryLive)).toFixed(3);
  };

  const getRemainingCountryStockMeatWeight = () => {
    const totalCountryMeat = getTotalCountryInitialStockInMeatWeight();
    const soldCountryMeat = getSoldCountryStockMeatWeight();
    return Math.max(0, Number(totalCountryMeat) - Number(soldCountryMeat)).toFixed(2);
  };

  const getCountryChickenBirdCount = () => {
    return bills.filter((bill) => bill.chickenType === "country").reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingCountryBirds = () => {
    if (closingData.actualCountryBirds) {
      return Number(closingData.actualCountryBirds);
    }

    if (!setup) return 0;
    const totalInitialCountryBirds = Number(setup.countryFreshBirds || 0) + Number(setup.countryRemainingBirds || 0);
    return totalInitialCountryBirds - getCountryChickenBirdCount();
  };

  // Sales calculations
  const getCurrentEarnings = () => {
    if (!Array.isArray(bills) || bills.length === 0) {
      // If no bills, use the actual earnings from closing data
      return Number(closingData.actualEarnings || 0);
    }
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0);
  };

  const getRetailSales = () => {
    if (!Array.isArray(bills) || bills.length === 0) return 0;
    return bills
      .filter((bill) => bill.category === "retail" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getWholesaleSales = () => {
    if (!Array.isArray(bills) || bills.length === 0) return 0;
    return bills
      .filter((bill) => bill.category === "wholesale" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getCountryChickenSales = () => {
    if (!Array.isArray(bills) || bills.length === 0) return 0;
    return bills.filter((bill) => bill.chickenType === "country").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-col items-center">
            <CardTitle>Date: {new Date(fullDayData.date).toLocaleDateString()}</CardTitle>
            <CardDescription>Closed on {formatDate(closingData.date)}</CardDescription>
          </div>

          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>

      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="mx-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            <BarChart2 className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="bills">
            <FileText className="h-4 w-4 mr-2" />
            Bills
          </TabsTrigger>
          <TabsTrigger value="stock">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Stock Details
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4">
          <Suspense fallback={<div>Loading summary...</div>}>
            <DashboardSummary
              dailySetup={setup}
              bills={bills}
              getTotalInitialStock={getTotalInitialStock}
              getSoldStockLiveWeight={getSoldStockLiveWeight}
              getSoldStockMeatWeight={getSoldStockMeatWeight}
              getRemainingStockLiveWeight={getRemainingStockLiveWeight}
              getRemainingStockMeatWeight={getRemainingStockMeatWeight}
              getTotalInitialStockInMeatWeight={getTotalInitialStockInMeatWeight}
              getRemainingBirds={getRemainingBirds}
              getCurrentEarnings={getCurrentEarnings}
              getRetailSales={getRetailSales}
              getWholesaleSales={getWholesaleSales}
              // Country chicken methods
              getTotalCountryInitialStock={getTotalCountryInitialStock}
              getSoldCountryStockLiveWeight={getSoldCountryStockLiveWeight}
              getSoldCountryStockMeatWeight={getSoldCountryStockMeatWeight}
              getRemainingCountryStockLiveWeight={getRemainingCountryStockLiveWeight}
              getRemainingCountryStockMeatWeight={getRemainingCountryStockMeatWeight}
              getRemainingCountryBirds={getRemainingCountryBirds}
              getCountryChickenSales={getCountryChickenSales}
            />
          </Suspense>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">Financial Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Estimated Earnings:</span>
                    <span className="font-medium">₹{Number(closingData.estimatedEarnings).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Actual Earnings:</span>
                    <span className="font-medium">₹{Number(closingData.actualEarnings).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Discounts:</span>
                    <span className="font-medium">₹{Number(closingData.totalDiscounts || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Expenses:</span>
                    <span className="font-medium">₹{Number(closingData.expenses || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-blue-800 font-medium">Net Earnings:</span>
                    <span className="font-bold text-blue-800">₹{Number(closingData.netEarnings).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Broiler Stock Card */}
            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Broiler Stock Overview</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Expected Stock:</span>
                    <span className="font-medium">{Number(closingData.expectedStock).toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Actual Stock:</span>
                    <span className="font-medium">{Number(closingData.actualStock).toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Weight Loss:</span>
                    <span className="font-medium">{Number(closingData.weightLoss).toFixed(2)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Loss Percentage:</span>
                    <span className="font-medium">{Number(closingData.weightLossPercentage).toFixed(2)}%</span>
                  </div>
                  <div className="text-xs text-green-600 mt-1">{closingData.estimationMethod === "liveRate" ? "Live weight" : "Meat weight"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Country Chicken Card - Show if country chicken data exists */}
            {closingData.expectedCountryStock ||
            closingData.actualCountryStock ||
            closingData.countryWeightLoss ||
            setup.countryFreshStock ||
            setup.countryRemainingStock ? (
              <Card className="bg-emerald-50 border-emerald-100">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-2">Country Chicken Stock</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Expected Stock:</span>
                      <span className="font-medium">{Number(closingData.expectedCountryStock || getTotalCountryInitialStock()).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Actual Stock:</span>
                      <span className="font-medium">{Number(closingData.actualCountryStock || getRemainingCountryStockLiveWeight()).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Weight Loss:</span>
                      <span className="font-medium">{Number(closingData.countryWeightLoss || 0).toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Loss Percentage:</span>
                      <span className="font-medium">{Number(closingData.countryWeightLossPercentage || 0).toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Bird Count</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Expected Birds:</span>
                      <span className="font-medium">{closingData.expectedBirds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Actual Birds:</span>
                      <span className="font-medium">{closingData.actualBirds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Bird Loss:</span>
                      <span className="font-medium">{closingData.birdLoss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Loss Percentage:</span>
                      <span className="font-medium">{Number(closingData.birdLossPercentage).toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bird count section - shown if country chicken exists */}
          {(closingData.expectedCountryBirds ||
            closingData.actualCountryBirds ||
            closingData.countryBirdLoss ||
            setup.countryFreshBirds ||
            setup.countryRemainingBirds) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-amber-50 border-amber-100">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-amber-800 mb-2">Broiler Bird Count</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Expected Birds:</span>
                      <span className="font-medium">{closingData.expectedBirds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Actual Birds:</span>
                      <span className="font-medium">{closingData.actualBirds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Bird Loss:</span>
                      <span className="font-medium">{closingData.birdLoss}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Loss Percentage:</span>
                      <span className="font-medium">{Number(closingData.birdLossPercentage).toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 border-emerald-100">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-2">Country Chicken Bird Count</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Expected Birds:</span>
                      <span className="font-medium">{closingData.expectedCountryBirds || getRemainingCountryBirds()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Actual Birds:</span>
                      <span className="font-medium">{closingData.actualCountryBirds || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Bird Loss:</span>
                      <span className="font-medium">{closingData.countryBirdLoss || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Loss Percentage:</span>
                      <span className="font-medium">{Number(closingData.countryBirdLossPercentage || 0).toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {closingData.expenseNotes && (
            <Card className="mt-4 border-purple-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-purple-800 mb-2">Expense Notes</h3>
                <p className="text-sm text-gray-600">{closingData.expenseNotes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="mt-4">
          <Suspense fallback={<div>Loading bills...</div>}>
            {bills && bills.length > 0 ? (
              <BillsTable bills={bills} isReadOnly={true} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="mb-2">No bills data available for this day.</p>
                    <p className="text-sm">The historical bill records may not have been properly saved with this closing data.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </TabsContent>

        {/* Stock Details Tab */}
        <TabsContent value="stock" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Initial Setup Section */}
            <Card>
              <CardHeader>
                <CardTitle>Initial Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Broiler Stock Information */}
                  <div>
                    <h3 className="text-sm font-medium text-blue-700">Broiler Stock Information</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border rounded p-3 border-blue-100">
                        <div className="text-xs text-gray-500">Fresh Stock</div>
                        <div className="text-lg font-semibold">{Number(setup.freshStock || 0).toFixed(2)} kg</div>
                        <div className="text-xs text-gray-400">{setup.freshBirds || 0} birds</div>
                      </div>
                      <div className="border rounded p-3 border-blue-100">
                        <div className="text-xs text-gray-500">Remaining Stock</div>
                        <div className="text-lg font-semibold">{Number(setup.remainingStock || 0).toFixed(2)} kg</div>
                        <div className="text-xs text-gray-400">{setup.remainingBirds || 0} birds</div>
                      </div>
                    </div>
                  </div>

                  {/* Country Chicken Stock Information - Show if exists */}
                  {(setup.countryFreshStock || setup.countryRemainingStock || setup.countryFreshBirds || setup.countryRemainingBirds) && (
                    <div>
                      <h3 className="text-sm font-medium text-green-700">Country Chicken Stock</h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="border rounded p-3 border-green-100">
                          <div className="text-xs text-gray-500">Fresh Stock</div>
                          <div className="text-lg font-semibold">{Number(setup.countryFreshStock || 0).toFixed(2)} kg</div>
                          <div className="text-xs text-gray-400">{setup.countryFreshBirds || 0} birds</div>
                        </div>
                        <div className="border rounded p-3 border-green-100">
                          <div className="text-xs text-gray-500">Remaining Stock</div>
                          <div className="text-lg font-semibold">{Number(setup.countryRemainingStock || 0).toFixed(2)} kg</div>
                          <div className="text-xs text-gray-400">{setup.countryRemainingBirds || 0} birds</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rates Section */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rates</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Paper Rate</div>
                        <div className="text-lg font-semibold">₹{Number(setup.paperRate || 0).toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Shop Rate</div>
                        <div className="text-lg font-semibold">₹{Number(setup.shopRate || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Product Prices */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Product Prices</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {setup.productPrices &&
                        Object.entries(setup.productPrices).map(([key, value]) => (
                          <div key={key} className="border rounded p-3">
                            <div className="text-xs text-gray-500">{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</div>
                            <div className="text-lg font-semibold">₹{Number(value || 0).toFixed(2)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Closing Data Section */}
            <Card>
              <CardHeader>
                <CardTitle>Closing Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Broiler Stock Comparison */}
                  <div>
                    <h3 className="text-sm font-medium text-blue-700">Broiler Stock Comparison</h3>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Metric</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expected</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actual</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Difference</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Stock (kg)</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{Number(closingData.expectedStock).toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{Number(closingData.actualStock).toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-500">
                              {Number(closingData.weightLoss).toFixed(2)} ({Number(closingData.weightLossPercentage).toFixed(1)}%)
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Birds (count)</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{closingData.expectedBirds}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{closingData.actualBirds}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-500">
                              {closingData.birdLoss} ({Number(closingData.birdLossPercentage).toFixed(1)}%)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Country Chicken Stock Comparison - Show if exists */}
                  {(closingData.expectedCountryStock || closingData.actualCountryStock || closingData.countryWeightLoss) && (
                    <div>
                      <h3 className="text-sm font-medium text-green-700">Country Chicken Stock Comparison</h3>
                      <div className="mt-2 border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Metric</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expected</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actual</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Difference</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Stock (kg)</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{Number(closingData.expectedCountryStock || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{Number(closingData.actualCountryStock || 0).toFixed(2)}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-red-500">
                                {Number(closingData.countryWeightLoss || 0).toFixed(2)}({Number(closingData.countryWeightLossPercentage || 0).toFixed(1)}%)
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">Birds (count)</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{closingData.expectedCountryBirds || 0}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{closingData.actualCountryBirds || 0}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-red-500">
                                {closingData.countryBirdLoss || 0}({Number(closingData.countryBirdLossPercentage || 0).toFixed(1)}%)
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Weight Details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Broiler Weight Details</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border rounded p-3 bg-blue-50">
                        <div className="text-xs text-blue-700">Live Weight Loss</div>
                        <div className="text-lg font-semibold text-blue-800">{Number(closingData.liveWeightLoss || closingData.weightLoss).toFixed(2)} kg</div>
                      </div>
                      <div className="border rounded p-3 bg-green-50">
                        <div className="text-xs text-green-700">Meat Weight Loss</div>
                        <div className="text-lg font-semibold text-green-800">
                          {Number(closingData.meatWeightLoss || closingData.weightLoss / MEAT_CONVERSION_FACTOR).toFixed(2)} kg
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Country Chicken Weight Details - Show if exists */}
                  {(closingData.countryWeightLoss || closingData.countryMeatWeightLoss) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Country Chicken Weight Details</h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="border rounded p-3 bg-emerald-50">
                          <div className="text-xs text-emerald-700">Live Weight Loss</div>
                          <div className="text-lg font-semibold text-emerald-800">{Number(closingData.countryWeightLoss || 0).toFixed(2)} kg</div>
                        </div>
                        <div className="border rounded p-3 bg-teal-50">
                          <div className="text-xs text-teal-700">Meat Weight Loss</div>
                          <div className="text-lg font-semibold text-teal-800">
                            {Number(closingData.countryMeatWeightLoss || closingData.countryWeightLoss / COUNTRY_MEAT_CONVERSION_FACTOR || 0).toFixed(2)} kg
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial Results */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Financial Results</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Estimated Earnings</div>
                        <div className="text-lg font-semibold">₹{Number(closingData.estimatedEarnings).toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Actual Earnings</div>
                        <div className="text-lg font-semibold">₹{Number(closingData.actualEarnings).toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Expenses</div>
                        <div className="text-lg font-semibold">₹{Number(closingData.expenses || 0).toFixed(2)}</div>
                      </div>
                      <div className="border rounded p-3 bg-green-50">
                        <div className="text-xs text-green-700">Net Earnings</div>
                        <div className="text-lg font-semibold text-green-800">₹{Number(closingData.netEarnings).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-end mt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HistoricalDayDetails;
