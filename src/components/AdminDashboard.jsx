import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, History } from "lucide-react";
import {
  getDailySetup,
  getBills,
  updateBill,
  saveDailyClosing,
  clearDaySetup,
  MEAT_CONVERSION_FACTOR,
  isDaySetupValid,
  getClosedDay,
  startNewDaySetup,
} from "../utils/storage";
import { Input } from "./ui/input";

const PriceManagement = React.lazy(() => import("./PriceManagement"));
const UserManagement = React.lazy(() => import("./UserManagement"));
const ProductManagement = React.lazy(() => import("./ProductManagement"));
const Stats = React.lazy(() => import("./Stats"));
const WeightLossHistory = React.lazy(() => import("./WeightLossHistory"));
const BillingForm = React.lazy(() => import("./BillingForm"));
const BillsTable = React.lazy(() => import("./BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));
const DailySetup = React.lazy(() => import("./DailySetup"));
const RegularCustomerForm = React.lazy(() => import("./RegularCustomerForm"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));
const HistoricalDataTable = React.lazy(() => import("./HistoricalDataTable"));
const HistoricalDayDetails = React.lazy(() => import("./HistoricalDayDetails"));

const AdminDashboard = ({ logout }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [bills, setBills] = useState([]);
  const [dailySetup, setDailySetup] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedBillingOption, setSelectedBillingOption] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [closedDayData, setClosedDayData] = useState(null);
  const [viewingClosedDay, setViewingClosedDay] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [selectedHistoricalDay, setSelectedHistoricalDay] = useState(null);

  const TABS = [
    { id: "home", label: "Home" },
    { id: "history", label: "History" },
    { id: "prices", label: "Prices" },
    { id: "products", label: "Products" },
    { id: "users", label: "Staff" },
    { id: "customers", label: "Customers" },
    { id: "stats", label: "Stats" },
    { id: "weight-loss", label: "Weight Loss" },
  ];

  useEffect(() => {
    loadDailyData();
  }, []);

  useEffect(() => {
    // Set active tab to home when daily setup is loaded
    if (dailySetup) {
      setActiveTab("home");
    }
  }, [dailySetup]);

  const loadDailyData = () => {
    // Always get the most recently closed day data
    const closedDay = getClosedDay();
    setClosedDayData(closedDay);

    // Get the current saved bills
    const savedBills = getBills();
    setBills(Array.isArray(savedBills) ? savedBills : []);

    // Get the daily setup
    const setup = getDailySetup();

    // Check if we have a valid setup for today
    if (setup && isDaySetupValid(new Date())) {
      setDailySetup(setup);
      setViewingClosedDay(false);
    } else if (closedDay) {
      // If no current setup but we have closed day data, we can view that
      setViewingClosedDay(true);
      setDailySetup(closedDay.setup);
      setBills(closedDay.bills || []);
    } else {
      setShowSetup(true);
      setBills([]);
      setViewingClosedDay(false);
    }
  };

  // Toggle between viewing current day and closed day
  const toggleDayView = () => {
    if (viewingClosedDay) {
      // Switch to current day view if available
      const setup = getDailySetup();
      if (setup && isDaySetupValid(new Date())) {
        setViewingClosedDay(false);
        setDailySetup(setup);
        const currentBills = getBills();
        setBills(Array.isArray(currentBills) ? currentBills : []);
      }
    } else if (closedDayData) {
      // Switch to closed day view
      setViewingClosedDay(true);
      setDailySetup(closedDayData.setup);
      setBills(closedDayData.bills || []);
    }
  };

  const handleSetupComplete = (setupData) => {
    setDailySetup(setupData);
    setShowSetup(false);
    setViewingClosedDay(false);
  };

  const handleStartNewDay = (selectedDate) => {
    // Save reference to current data before clearing
    startNewDaySetup();

    // Clear current setup
    clearDaySetup();
    setDailySetup(null);
    setShowSetup(true);
    setBills([]);
    setViewingClosedDay(false);
  };

  const handleEditBill = (bill) => {
    if (viewingClosedDay) {
      // Don't allow editing when viewing closed day
      return;
    }
    setEditingBill(bill);
    setSelectedBillingOption(bill.billOption);
    setShowBillingForm(true);
  };

  const handleBillUpdated = (updatedBillData) => {
    const updatedBill = {
      ...editingBill,
      ...updatedBillData,
      lastModified: new Date().toISOString(),
    };
    updateBill(updatedBill);
    setBills((prev) => prev.map((bill) => (bill.id === updatedBill.id ? updatedBill : bill)));
    setShowBillingForm(false);
    setSelectedBillingOption(null);
    setEditingBill(null);
  };

  const handleCancelEdit = () => {
    setShowBillingForm(false);
    setSelectedBillingOption(null);
    setEditingBill(null);
  };

  const handleCloseDayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Close day clicked");
    setShowCloseDayModal(true);
  };

  // Handle viewing historical day details
  const handleViewHistoricalDay = (dayData) => {
    setSelectedHistoricalDay(dayData);
  };

  // Handle returning from historical view
  const handleBackFromHistorical = () => {
    setSelectedHistoricalDay(null);
  };

  // Calculation utilities
  const getTotalInitialStock = () => {
    if (!dailySetup) return 0;
    const liveWeight = Number(dailySetup.freshStock || 0) + Number(dailySetup.remainingStock || 0);
    return dailySetup.estimationMethod === "liveRate" ? liveWeight : (liveWeight / MEAT_CONVERSION_FACTOR).toFixed(2);
  };

  const getSoldStock = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        // For bills with weightType "live", convert to meat weight
        if (bill.weightType === "live") {
          // return total + Number(bill.inventoryWeight || 0) / MEAT_CONVERSION_FACTOR;
          return total + Number(bill.meatWeight || 0);
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getRemainingStock = () => {
    const totalStock = getTotalInitialStock();
    const sold = getSoldStock();
    return Math.max(0, Number(totalStock) - Number(sold)).toFixed(2);
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

  const getTotalInitialStockInMeatWeight = () => {
    if (!dailySetup) return 0;
    return (getTotalInitialStock() / MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .reduce((total, bill) => {
        // For bills with weightType "live", convert to meat weight
        if (bill.weightType === "live") {
          // return total + Number(bill.inventoryWeight || 0) / MEAT_CONVERSION_FACTOR;
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

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0);
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
    return bills.filter((bill) => bill.category === "retail").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getWholesaleSales = () => {
    return bills.filter((bill) => bill.category === "wholesale").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const renderTabs = () => (
    <div className="px-4 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        {/* Navigation Bar */}
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-4">
            {dailySetup && !viewingClosedDay && activeTab === "home" && (
              <Button variant="secondary" type="button" onClick={handleCloseDayClick}>
                Close Day
              </Button>
            )}
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        {renderTabs()}
      </div>

      <div className="p-6">
        {/* Day Status Banner */}
        {viewingClosedDay && activeTab === "home" && (
          <div className="bg-amber-50 p-4 mb-6 rounded-lg border border-amber-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-amber-800">Viewing Closed Day: {new Date(closedDayData.date).toLocaleDateString()}</h2>
                <p className="text-sm text-amber-700">This day has been closed. You are viewing historical data.</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowSetup(true)} className="bg-white">
                  Start New Day
                </Button>
                {!viewingClosedDay && closedDayData && (
                  <Button variant="outline" onClick={toggleDayView} className="bg-white">
                    View Closed Day
                  </Button>
                )}
                {viewingClosedDay && getDailySetup() && (
                  <Button variant="outline" onClick={toggleDayView} className="bg-white">
                    View Current Day
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "home" && dailySetup && (
          <div className="space-y-6">
            {/* Dashboard Summary */}
            <Suspense fallback={<div>Loading summary...</div>}>
              {/* <DashboardSummary
                dailySetup={dailySetup}
                bills={bills}
                getTotalInitialStock={getTotalInitialStock}
                getSoldStockLiveWeight={getSoldStock}
                getSoldStockMeatWeight={getSoldStock}
                getRemainingStockLiveWeight={getRemainingStock}
                getRemainingStockMeatWeight={getRemainingStock}
                getTotalInitialStockInMeatWeight={getTotalInitialStock}
                getRemainingBirds={getRemainingBirds}
                getCurrentEarnings={getCurrentEarnings}
                getRetailSales={getRetailSales}
                getWholesaleSales={getWholesaleSales}
              /> */}

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

            {/* Day Management Component */}
            <Suspense fallback={<div>Loading...</div>}>
              <DayManagement
                dailySetup={dailySetup}
                onStartNewDay={handleStartNewDay}
                currentStock={getRemainingStock()}
                remainingBirds={getRemainingBirds()}
                currentEarnings={getCurrentEarnings()}
                estimatedEarnings={dailySetup.estimatedEarnings}
                totalDiscounts={bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0)}
              />
            </Suspense>

            {showBillingForm ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Edit Bill - {selectedBillingOption.name}</h2>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
                <Suspense fallback={<div>Loading...</div>}>
                  <BillingForm
                    rates={dailySetup}
                    billingOption={selectedBillingOption}
                    onBillGenerate={handleBillUpdated}
                    onCancel={handleCancelEdit}
                    editData={editingBill}
                    weightType={dailySetup.estimationMethod === "liveRate" ? "live" : "meat"}
                    currentStock={getRemainingStock()}
                  />
                </Suspense>
              </div>
            ) : (
              <Suspense fallback={<div>Loading...</div>}>
                <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={true} isReadOnly={viewingClosedDay} />
              </Suspense>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <Suspense fallback={<div>Loading history...</div>}>
            {selectedHistoricalDay ? (
              <HistoricalDayDetails dayData={selectedHistoricalDay} onBack={handleBackFromHistorical} />
            ) : (
              <HistoricalDataTable onViewDay={handleViewHistoricalDay} />
            )}
          </Suspense>
        )}

        {activeTab === "prices" && (
          <Suspense fallback={<div>Loading...</div>}>
            <PriceManagement />
          </Suspense>
        )}

        {activeTab === "products" && (
          <Suspense fallback={<div>Loading...</div>}>
            <ProductManagement />
          </Suspense>
        )}

        {activeTab === "users" && (
          <Suspense fallback={<div>Loading...</div>}>
            <UserManagement />
          </Suspense>
        )}

        {activeTab === "stats" && (
          <Suspense fallback={<div>Loading...</div>}>
            <Stats />
          </Suspense>
        )}

        {activeTab === "weight-loss" && (
          <Suspense fallback={<div>Loading...</div>}>
            <WeightLossHistory />
          </Suspense>
        )}

        {activeTab === "customers" && (
          <Suspense fallback={<div>Loading...</div>}>
            <RegularCustomerForm />
          </Suspense>
        )}
      </div>

      {showCloseDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <CloseDayModal
                dailySetup={dailySetup}
                currentStock={getRemainingStock()}
                expectedBirds={getRemainingBirds()}
                currentEarnings={getCurrentEarnings()}
                estimatedEarnings={dailySetup.estimatedEarnings}
                totalDiscounts={bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0)}
                onClose={() => setShowCloseDayModal(false)}
                onConfirm={handleCloseDayConfirmed}
              />
            </Suspense>
          </div>
        </div>
      )}

      {showSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <Suspense fallback={<div>Loading...</div>}>
              <DailySetup onSetupComplete={handleSetupComplete} onCancel={() => setShowSetup(false)} initialDate={startDate} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
