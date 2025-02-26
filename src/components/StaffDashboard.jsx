import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
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
  saveDailyClosing,
} from "../utils/storage";

const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./BillingForm"));
const BillingOptions = React.lazy(() => import("./BillingOptions"));
const BillsTable = React.lazy(() => import("./BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));
const CloseDayModal = React.lazy(() => import("./CloseDayModal"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));

const StaffDashboard = ({ logout }) => {
  const [dailySetup, setDailySetup] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedBillingOption, setSelectedBillingOption] = useState(null);
  const [bills, setBills] = useState([]);
  const [editingBill, setEditingBill] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);

  // Handler functions
  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Logout clicked");
    if (typeof logout === "function") {
      logout();
    }
  };

  const handleCloseDayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Close day clicked");
    setShowCloseDayModal(true);
  };

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
      setBills((prev) => prev.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)));
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
    return Number(dailySetup.freshStock || 0) + Number(dailySetup.remainingStock || 0);
  };

  const getTotalInitialStockInMeatWeight = () => {
    if (!dailySetup) return 0;
    return (getTotalInitialStock() / MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        // For bills with weightType "meat", convert to live weight
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
        // For bills with weightType "live", convert to meat weight
        if (bill.weightType === "live") {
          return total + Number(bill.inventoryWeight || 0) / MEAT_CONVERSION_FACTOR;
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

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0).toFixed(2);
  };

  const getTotalBirds = () => {
    return bills.reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingBirds = () => {
    if (!dailySetup) return 0;
    const totalInitialBirds = Number(dailySetup.freshBirds || 0) + Number(dailySetup.remainingBirds || 0);
    return totalInitialBirds - getTotalBirds();
  };

  const getRetailSales = () => {
    return bills
      .filter((bill) => bill.category === "retail")
      .reduce((total, bill) => total + Number(bill.price || 0), 0)
      .toFixed(2);
  };

  const getWholesaleSales = () => {
    return bills
      .filter((bill) => bill.category === "wholesale")
      .reduce((total, bill) => total + Number(bill.price || 0), 0)
      .toFixed(2);
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
              <CardDescription>Initialize daily operations by setting up today's rates and stock</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-gray-500 mb-4">No active daily setup found. Start a new day to begin operations.</p>
                <Button onClick={() => setShowSetup(true)}>Start Day</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {showSetup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <Suspense fallback={<div>Loading...</div>}>
                <DailySetup onSetupComplete={handleSetupComplete} onCancel={() => setShowSetup(false)} />
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
          <div className="flex space-x-4">
            {dailySetup && (
              <Button variant="secondary" type="button" onClick={handleCloseDayClick}>
                Close Day
              </Button>
            )}
            <Button variant="outline" type="button" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Dashboard Summary - New detailed version */}
        <Suspense fallback={<div>Loading summary...</div>}>
          <DashboardSummary
            dailySetup={dailySetup}
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
          />
        </Suspense>

        {showBillingForm ? (
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingBill ? "Edit Bill" : "New Bill"} - {selectedBillingOption.name}
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
                weightType={dailySetup.estimationMethod === "liveRate" ? "live" : "meat"}
                currentStock={getRemainingStockLiveWeight()}
              />
            </Suspense>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Day Management Component */}
            <Suspense fallback={<div>Loading...</div>}>
              <DayManagement
                dailySetup={dailySetup}
                onStartNewDay={handleStartNewDay}
                currentStock={getRemainingStockLiveWeight()}
                remainingBirds={getRemainingBirds()}
                estimatedEarnings={dailySetup.estimatedEarnings}
                currentEarnings={Number(getCurrentEarnings())}
                totalDiscounts={bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0)}
              />
            </Suspense>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generate Bill</h2>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <BillingOptions onSelectOption={handleBillingOptionSelect} />
            </Suspense>

            <Suspense fallback={<div>Loading...</div>}>
              <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={false} />
            </Suspense>
          </div>
        )}
      </div>

      {showCloseDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <CloseDayModal
                dailySetup={dailySetup}
                currentStock={getRemainingStockLiveWeight()}
                expectedBirds={getRemainingBirds()}
                currentEarnings={Number(getCurrentEarnings())}
                estimatedEarnings={dailySetup.estimatedEarnings}
                totalDiscounts={bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0)}
                onClose={() => setShowCloseDayModal(false)}
                onConfirm={async (closingData) => {
                  const saved = await saveDailyClosing(closingData);
                  if (saved) {
                    await clearDaySetup();
                    window.location.reload();
                  }
                  setShowCloseDayModal(false);
                }}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
