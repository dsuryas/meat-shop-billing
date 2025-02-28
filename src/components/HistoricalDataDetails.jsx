import React, { useState, useEffect, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, FileText, BarChart2, ShoppingBag } from "lucide-react";
import { formatDate, MEAT_CONVERSION_FACTOR } from "../utils/storage";

// Lazy-load components
const BillsTable = React.lazy(() => import("./BillsTable"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));

const HistoricalDayDetails = ({ dayData, onBack }) => {
  const [activeTab, setActiveTab] = useState("summary");

  if (!dayData || !dayData.closingData) {
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
          <div className="text-center py-8 text-gray-500">No data available for this day.</div>
        </CardContent>
      </Card>
    );
  }

  const closingData = dayData.closingData;
  const bills = dayData.bills || [];
  const setup = dayData.setup || {};

  // Calculate metrics for the dashboard summary
  const getTotalInitialStock = () => {
    if (!setup) return 0;
    return Number(setup.freshStock || 0) + Number(setup.remainingStock || 0);
  };

  const getSoldStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        if (bill.weightType === "meat") {
          return total + Number(bill.inventoryWeight || 0) * MEAT_CONVERSION_FACTOR;
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getSoldStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        if (bill.weightType === "live") {
          return total + Number(bill.inventoryWeight || 0) / MEAT_CONVERSION_FACTOR;
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0);
  };

  const getRetailSales = () => {
    return bills.filter((bill) => bill.category === "retail").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getWholesaleSales = () => {
    return bills.filter((bill) => bill.category === "wholesale").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <CardTitle>Historical Day: {new Date(dayData.date).toLocaleDateString()}</CardTitle>
              <CardDescription>Closed on {formatDate(closingData.date)}</CardDescription>
            </div>
          </div>
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
              getRemainingStockLiveWeight={() => Number(closingData.actualStock).toFixed(2)}
              getRemainingStockMeatWeight={() =>
                setup.estimationMethod === "liveRate"
                  ? (Number(closingData.actualStock) / MEAT_CONVERSION_FACTOR).toFixed(2)
                  : Number(closingData.actualStock).toFixed(2)
              }
              getTotalInitialStockInMeatWeight={() =>
                setup.estimationMethod === "liveRate" ? (getTotalInitialStock() / MEAT_CONVERSION_FACTOR).toFixed(2) : getTotalInitialStock()
              }
              getRemainingBirds={() => closingData.actualBirds}
              getCurrentEarnings={() => closingData.actualEarnings}
              getRetailSales={getRetailSales}
              getWholesaleSales={getWholesaleSales}
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

            <Card className="bg-green-50 border-green-100">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Stock Overview</h3>
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
          </div>

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
            <BillsTable bills={bills} isReadOnly={true} />
          </Suspense>
        </TabsContent>

        {/* Stock Details Tab */}
        <TabsContent value="stock" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Initial Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Stock Information</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Fresh Stock</div>
                        <div className="text-lg font-semibold">{Number(setup.freshStock || 0).toFixed(2)} kg</div>
                        <div className="text-xs text-gray-400">{setup.freshBirds || 0} birds</div>
                      </div>
                      <div className="border rounded p-3">
                        <div className="text-xs text-gray-500">Remaining Stock</div>
                        <div className="text-lg font-semibold">{Number(setup.remainingStock || 0).toFixed(2)} kg</div>
                        <div className="text-xs text-gray-400">{setup.remainingBirds || 0} birds</div>
                      </div>
                    </div>
                  </div>

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

            <Card>
              <CardHeader>
                <CardTitle>Closing Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Stock Comparison</h3>
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

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Weight Details</h3>
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

      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HistoricalDayDetails;
