import React, { useState, useEffect, Suspense } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, Plus, Receipt } from "lucide-react";
import {
  saveDailySetup,
  getDailySetup,
  getBills,
  addBill,
} from "../utils/storage";

const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./BillingForm"));

// Table header component
const TableHeader = () => (
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Bill No
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Customer
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Product
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Weight
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Amount
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Payment
      </th>
    </tr>
  </thead>
);

const StaffDashboard = ({ logout }) => {
  const [dailySetup, setDailySetup] = useState(null);
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

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill.price), 0);
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
      {/* Navigation Bar */}
      <div className="bg-white shadow">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Summary Squares */}
        <div className="px-4 py-3 border-t grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Today's Rate</div>
            <div className="text-xl font-bold text-blue-700">
              ₹{dailySetup.productPrices.choppedChicken}/kg
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 mb-1">
              Estimated Earnings
            </div>
            <div className="text-xl font-bold text-yellow-700">
              ₹{dailySetup.estimatedEarnings.toFixed(2)}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Total Sales</div>
            <div className="text-xl font-bold text-green-700">
              ₹{getCurrentEarnings().toFixed(2)}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">Bills Generated</div>
            <div className="text-xl font-bold text-purple-700">
              {bills.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {showBillingForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">New Bill</h2>
              <Button variant="ghost" onClick={handleCancelBilling}>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Today's Bills</h2>
              <Button onClick={() => setShowBillingForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Bill
              </Button>
            </div>

            {bills.length > 0 ? (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <TableHeader />
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bill.billNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{bill.customerName}</div>
                            <div className="text-xs text-gray-400">
                              {bill.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {bill.productType
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Number(bill.weight).toFixed(2)} kg
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{Number(bill.price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                bill.paymentType === "partial"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : bill.paymentType === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {bill.paymentType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No bills
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new bill.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
