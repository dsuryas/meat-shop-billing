import React, { useState, Suspense, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, Plus, Receipt, XCircle } from "lucide-react";

import {
  saveDailySetup,
  getDailySetup,
  getBills,
  addBill,
} from "../utils/storage";

const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./BillingForm"));

const BillsList = ({ bills }) => (
  <div className="space-y-4">
    {bills.map((bill, index) => (
      <Card key={index} className="bg-white">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{bill.customerName}</h4>
              <p className="text-sm text-gray-500">{bill.customerPhone}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">
                ₹{Number(bill.price).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">
                {Number(bill.weight).toFixed(2)}kg
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>{bill.productType}</span>
            <span>{bill.paymentType}</span>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const StaffDashboard = ({ logout }) => {
  const [dailySetup, setDailySetup] = useState(null);
  const [showBilling, setShowBilling] = useState(false);
  const [bills, setBills] = useState([]);
  const [showBillingForm, setShowBillingForm] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedSetup = getDailySetup();
    if (savedSetup) {
      setDailySetup(savedSetup);
    }

    const savedBills = getBills();
    setBills(savedBills);
  }, []);

  const handleSetupComplete = (setupData) => {
    const savedSetup = saveDailySetup(setupData);
    setDailySetup(savedSetup);
  };

  const handleBillGenerated = (billData) => {
    const newBill = addBill(billData);
    setBills((prevBills) => [newBill, ...prevBills]);
    setShowBillingForm(false);
  };

  const handleCancelBilling = () => {
    setShowBillingForm(false);
  };

  // Calculate current earnings from all bills
  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill.price), 0);
  };

  // Calculate remaining stock
  const getRemainingStock = () => {
    const totalInitialStock =
      Number(dailySetup?.freshStock || 0) +
      Number(dailySetup?.remainingStock || 0);
    const totalSold = bills.reduce(
      (total, bill) => total + Number(bill.weight),
      0
    );
    return totalInitialStock - totalSold;
  };

  if (!dailySetup) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <DailySetup onSetupComplete={handleSetupComplete} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Bills List or Billing Form */}
          <div>
            {showBillingForm ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">New Bill</h2>
                  <Button variant="ghost" onClick={handleCancelBilling}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                  <BillingForm
                    rates={dailySetup}
                    onBillGenerate={handleBillGenerated}
                    onCancel={handleCancelBilling}
                  />
                </Suspense>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Generated Bills</h2>
                  <Button onClick={() => setShowBillingForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Bill
                  </Button>
                </div>
                {bills.length > 0 ? (
                  <BillsList bills={bills} />
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center text-gray-500">
                        <Receipt className="mx-auto h-12 w-12 mb-4" />
                        <p>No bills generated yet</p>
                        <p className="text-sm">
                          Click the Add New Bill button to get started
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div>
            {/* Today's Summary Card - Previous colored version remains the same */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Summary</CardTitle>
                <CardDescription>
                  Overview of today's operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Previous colored summary sections remain the same */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Rates Section */}
                  <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
                    <h3 className="font-semibold text-lg text-blue-700 mb-4 flex items-center">
                      <span className="bg-blue-100 p-2 rounded-full mr-2">
                        💰
                      </span>
                      Today's Rates
                    </h3>
                    {/* Rest of the rates section */}
                    <div className="grid gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700">
                            Paper Rate
                          </span>
                          <span className="font-medium text-blue-800">
                            ₹{dailySetup.paperRate}/kg
                          </span>
                        </div>
                      </div>
                      {/* Rest of the rates remain the same */}
                    </div>
                  </div>

                  {/* Stock Section */}
                  <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
                    <h3 className="font-semibold text-lg text-purple-700 mb-4 flex items-center">
                      <span className="bg-purple-100 p-2 rounded-full mr-2">
                        📦
                      </span>
                      Stock Information
                    </h3>
                    <div className="grid gap-4">
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">
                            Initial Stock
                          </span>
                          <span className="font-medium text-purple-800">
                            {Number(dailySetup.freshStock) +
                              Number(dailySetup.remainingStock)}
                            kg
                          </span>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700">
                            Stock Sold
                          </span>
                          <span className="font-medium text-purple-800">
                            {bills.reduce(
                              (total, bill) => total + Number(bill.weight),
                              0
                            )}
                            kg
                          </span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-100 to-pink-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700 font-medium">
                            Current Stock
                          </span>
                          <span className="font-bold text-lg text-purple-800">
                            {getRemainingStock()}kg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Section */}
                  <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
                    <h3 className="font-semibold text-lg text-green-700 mb-4 flex items-center">
                      <span className="bg-green-100 p-2 rounded-full mr-2">
                        💵
                      </span>
                      Earnings Overview
                    </h3>
                    <div className="grid gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">
                            Estimated
                          </span>
                          <span className="font-medium text-green-800">
                            ₹{dailySetup.estimatedEarnings.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-100 to-emerald-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700 font-medium">
                            Current Earnings
                          </span>
                          <span className="font-bold text-lg text-green-800">
                            ₹{getCurrentEarnings().toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">
                            Bills Generated
                          </span>
                          <div className="flex items-center">
                            <span className="font-medium text-green-800">
                              {bills.length}
                            </span>
                            <span className="text-xs text-green-600 ml-1">
                              bills
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
