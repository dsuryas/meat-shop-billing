import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import {
  saveDailySetup,
  getDailySetup,
  getBills,
  addBill,
  updateBill,
  isDaySetupValid,
  clearDaySetup,
  MEAT_CONVERSION_FACTOR,
} from "../utils/storage";

const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./BillingForm"));
const BillingOptions = React.lazy(() => import("./BillingOptions"));
const BillsTable = React.lazy(() => import("./BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));

const StaffDashboard = ({ logout }) => {
  const [dailySetup, setDailySetup] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedBillingOption, setSelectedBillingOption] = useState(null);
  const [bills, setBills] = useState([]);
  const [editingBill, setEditingBill] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = () => {
    const setup = getDailySetup();
    if (setup && isDaySetupValid(new Date())) {
      setDailySetup(setup);
      const savedBills = getBills();
      setBills(savedBills);
    } else {
      setShowSetup(true);
    }
  };

  // Setup handlers
  const handleSetupComplete = (setupData) => {
    const savedSetup = saveDailySetup(setupData);
    setDailySetup(savedSetup);
    setShowSetup(false);
  };

  // Handle starting a new day
  const handleStartNewDay = (selectedDate) => {
    clearDaySetup();
    setDailySetup(null);
    setShowSetup(true);
    setBills([]);
  };

  // Billing option selection handler
  const handleBillingOptionSelect = (option) => {
    setEditingBill(null);
    setSelectedBillingOption(option);
    setShowBillingForm(true);
  };

  // Bill generation handler
  const handleBillGenerated = (billData) => {
    if (editingBill) {
      // Update existing bill
      const updatedBill = {
        ...editingBill,
        ...billData,
        lastModified: new Date().toISOString(),
      };
      updateBill(updatedBill);
      setBills((prev) =>
        prev.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill))
      );
    } else {
      // Add new bill
      const newBill = {
        ...billData,
        billOption: selectedBillingOption,
        id: Date.now(),
        billNumber: `BILL-${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      addBill(newBill);
      setBills((prev) => [newBill, ...prev]);
    }
    setShowBillingForm(false);
    setSelectedBillingOption(null);
    setEditingBill(null);
  };

  // Edit bill handler
  const handleEditBill = (bill) => {
    if (bill.paymentType === "partial") {
      setEditingBill(bill);
      setSelectedBillingOption(bill.billOption);
      setShowBillingForm(true);
    }
  };

  const handleCancelBilling = () => {
    setShowBillingForm(false);
    setSelectedBillingOption(null);
    setEditingBill(null);
  };

  // Calculation utilities
  const getTotalInitialStock = () => {
    if (!dailySetup) return 0;
    const liveWeight =
      Number(dailySetup.freshStock || 0) +
      Number(dailySetup.remainingStock || 0);
    return dailySetup.estimationMethod === "liveRate"
      ? liveWeight
      : (liveWeight / MEAT_CONVERSION_FACTOR).toFixed(2);
  };

  const getSoldStock = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        const weight = Number(bill?.weight || 0);
        if (
          dailySetup.estimationMethod === "liveRate" &&
          bill.weightType === "meat"
        ) {
          return total + weight * MEAT_CONVERSION_FACTOR;
        } else if (
          dailySetup.estimationMethod === "skinOutRate" &&
          bill.weightType === "live"
        ) {
          return total + weight / MEAT_CONVERSION_FACTOR;
        }
        return total + weight;
      }, 0)
      .toFixed(2);
  };

  const getRemainingStock = () => {
    const totalStock = getTotalInitialStock();
    const sold = getSoldStock();
    return Math.max(0, Number(totalStock) - Number(sold)).toFixed(2);
  };

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0);
  };

  const getTotalBirds = () => {
    return bills.reduce(
      (total, bill) => total + Number(bill?.numberOfBirds || 0),
      0
    );
  };

  const getRemainingBirds = () => {
    if (!dailySetup) return 0;
    const totalInitialBirds =
      Number(dailySetup.freshBirds || 0) +
      Number(dailySetup.remainingBirds || 0);
    return totalInitialBirds - getTotalBirds();
  };

  const getRetailSales = () => {
    return bills
      .filter((bill) => bill.category === "retail")
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getWholesaleSales = () => {
    return bills
      .filter((bill) => bill.category === "wholesale")
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getStockLabel = () => {
    return dailySetup?.estimationMethod === "liveRate"
      ? "Live weight"
      : "Meat weight";
  };

  // Early return for dashboard with Start Day button when no setup exists
  if (!dailySetup) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Staff Dashboard</h1>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Start New Day</CardTitle>
              <CardDescription>
                Initialize daily operations by setting up today's rates and
                stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  No active daily setup found. Start a new day to begin
                  operations.
                </p>
                <Button onClick={() => setShowSetup(true)}>Start Day</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {showSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <Suspense fallback={<div>Loading...</div>}>
                <DailySetup
                  onSetupComplete={handleSetupComplete}
                  onCancel={() => setShowSetup(false)}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="px-4 py-3 border-t grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Today's Stock */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Today's Stock</div>
            <div className="text-xl font-bold text-blue-700">
              {getTotalInitialStock()}kg
            </div>
            <div className="text-sm text-blue-600 mt-1">{getStockLabel()}</div>
          </div>

          {/* Current Stock */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Current Stock</div>
            <div className="text-xl font-bold text-green-700">
              {getRemainingStock()}kg
            </div>
            <div className="text-sm text-green-600 mt-1">{getStockLabel()}</div>
          </div>

          {/* Shop Rate */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">Shop Rate</div>
            <div className="text-xl font-bold text-purple-700">
              ₹{dailySetup?.shopRate}/kg
            </div>
          </div>

          {/* Paper Rate */}
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 mb-1">Paper Rate</div>
            <div className="text-xl font-bold text-orange-700">
              ₹{dailySetup?.paperRate}/kg
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-rose-50 p-4 rounded-lg">
            <div className="text-sm text-rose-600 mb-1">Total Sales</div>
            <div className="text-xl font-bold text-rose-700">
              ₹{getCurrentEarnings().toFixed(2)}
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-rose-600 mt-1">
              <div>R: ₹{getRetailSales().toFixed(2)}</div>
              <div>W: ₹{getWholesaleSales().toFixed(2)}</div>
            </div>
          </div>

          {/* Stock Sold */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 mb-1">Stock Sold</div>
            <div className="text-xl font-bold text-yellow-700">
              {getSoldStock()}kg
            </div>
            <div className="text-sm text-yellow-600 mt-1">
              {getTotalBirds()} birds
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {showBillingForm ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingBill ? "Edit Bill" : "New Bill"} -{" "}
                {selectedBillingOption.name}
              </h2>
              <Button variant="ghost" onClick={handleCancelBilling}>
                Cancel
              </Button>
            </div>
            <Suspense fallback={<div>Loading...</div>}>
              <BillingForm
                rates={dailySetup}
                billingOption={selectedBillingOption}
                onBillGenerate={handleBillGenerated}
                onCancel={handleCancelBilling}
                editData={editingBill}
                weightType={
                  dailySetup.estimationMethod === "liveRate" ? "live" : "meat"
                }
                currentStock={getRemainingStock()}
              />
            </Suspense>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Day Management Component */}
            <Suspense fallback={<div>Loading...</div>}>
              <DayManagement
                dailySetup={dailySetup}
                onStartNewDay={handleStartNewDay}
                currentStock={getRemainingStock()}
                remainingBirds={getRemainingBirds()}
                currentEarnings={getCurrentEarnings()}
                estimatedEarnings={dailySetup.estimatedEarnings}
                totalDiscounts={bills.reduce(
                  (total, bill) =>
                    total +
                    Number(bill.discountPerKg || 0) * Number(bill.weight || 0),
                  0
                )}
              />
            </Suspense>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generate Bill</h2>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <BillingOptions onSelectOption={handleBillingOptionSelect} />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <BillsTable
                bills={bills}
                onEditBill={handleEditBill}
                isAdmin={false}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
