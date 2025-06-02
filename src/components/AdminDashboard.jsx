import React, { useState, useEffect, Suspense } from "react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import {
  getDailySetup,
  getBills,
  getBillsForCurrentDay,
  updateBill,
  saveDailyClosing,
  clearDaySetup,
  isDaySetupValid,
  getClosedDay,
  startNewDaySetup,
  saveDailySetup,
} from "../utils/storage";
import { calculateStock, calculateSales, isDayClosed } from "../utils/DashboardUtils";

// Lazy load components
const PriceManagement = React.lazy(() => import("./PriceManagement"));
const UserManagement = React.lazy(() => import("./UserManagement"));
const ProductManagement = React.lazy(() => import("./ProductManagement"));
const Stats = React.lazy(() => import("./Stats"));
const WeightLossHistory = React.lazy(() => import("./WeightLossHistory"));
const BillingForm = React.lazy(() => import("./Billing/BillingForm"));
const BillsTable = React.lazy(() => import("./Billing/BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));
const DailySetup = React.lazy(() => import("./DailySetup"));
const RegularCustomerForm = React.lazy(() => import("./RegularCustomerForm"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));
const HistoricalDataTable = React.lazy(() => import("./HistoricalDataTable"));
const HistoricalDayDetails = React.lazy(() => import("./HistoricalDayDetails"));
const CloseDayModal = React.lazy(() => import("./CloseDayModal"));
const DayStatusBanner = React.lazy(() => import("./DayStatusBanner"));
const ConversionRatesManagement = React.lazy(() => import("./ConversionRates/ConversionRatesManagement"));
const ExpenseCategoryManagement = React.lazy(() => import("./ExpenseCategoryManagement"));

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
  const [dayIsClosed, setDayIsClosed] = useState(false);

  const TABS = [
    { id: "home", label: "Home" },
    { id: "history", label: "History" },
    { id: "prices", label: "Prices" },
    { id: "products", label: "Products" },
    { id: "users", label: "Staff" },
    { id: "customers", label: "Customers" },
    { id: "expenses", label: "Expenses" },
    { id: "stats", label: "Stats" },
    { id: "weight-loss", label: "Weight Loss" },
    { id: "conversion-rates", label: "Conversion Rates" },
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
    const savedBills = getBillsForCurrentDay();
    setBills(Array.isArray(savedBills) ? savedBills : []);

    // Get the daily setup
    const setup = getDailySetup();

    // Check if we have a valid setup for today
    if (setup && isDaySetupValid(new Date())) {
      setDailySetup(setup);
      setViewingClosedDay(false);
      setDayIsClosed(isDayClosed(setup));
    } else if (closedDay) {
      // If no current setup but we have closed day data, we can view that
      setViewingClosedDay(true);
      setDailySetup(closedDay.setup);
      setBills(closedDay.bills || []);
      setDayIsClosed(true);
    } else {
      setShowSetup(true);
      setBills([]);
      setViewingClosedDay(false);
      setDayIsClosed(false);
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
        const currentBills = getBillsForCurrentDay();
        setBills(Array.isArray(currentBills) ? currentBills : []);
        setDayIsClosed(isDayClosed(setup));
      }
    } else if (closedDayData) {
      // Switch to closed day view
      setViewingClosedDay(true);
      setDailySetup(closedDayData.setup);
      setBills(closedDayData.bills || []);
      setDayIsClosed(true);
    }
  };

  const handleSetupComplete = (setupData) => {
    const savedSetup = saveDailySetup(setupData);
    setDailySetup(savedSetup);
    setShowSetup(false);
    setViewingClosedDay(false);
    setDayIsClosed(false);
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
    setDayIsClosed(false);
  };

  const handleEditBill = (bill) => {
    if (viewingClosedDay || dayIsClosed) {
      // Don't allow editing when viewing closed day or day is closed
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
    setShowCloseDayModal(true);
  };

  // Handle viewing historical day details
  const handleViewHistoricalDay = (dayData) => {
    setSelectedHistoricalDay(dayData);
    setActiveTab("history");
  };

  // Handle returning from historical view
  const handleBackFromHistorical = () => {
    setSelectedHistoricalDay(null);
  };

  // Get stock calculations
  const stockCalculations = dailySetup ? calculateStock(dailySetup, bills) : {};

  // Get sales calculations
  const salesCalculations = calculateSales(bills);

  // Handle closing the day
  const handleCloseDayConfirmed = async (closingData) => {
    const saved = await saveDailyClosing(closingData);
    if (saved) {
      // Update the closed day data
      setClosedDayData({
        date: closingData.date,
        setup: dailySetup,
        bills: bills,
        closingData: closingData,
      });

      // Update daily setup to mark as closed
      const updatedSetup = { ...dailySetup, hasClosedDay: true };
      saveDailySetup(updatedSetup);
      setDailySetup(updatedSetup);

      // Set the day as closed
      setDayIsClosed(true);
    }
    setShowCloseDayModal(false);
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
            {dailySetup && !viewingClosedDay && !dayIsClosed && activeTab === "home" && (
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
        <Suspense fallback={<div>Loading banner...</div>}>
          <DayStatusBanner
            viewingClosedDay={viewingClosedDay}
            closedDayData={closedDayData}
            onStartNewDay={handleStartNewDay}
            onToggleDayView={toggleDayView}
          />
        </Suspense>

        {/* Show a notice if day is closed but not viewing closed day */}
        {!viewingClosedDay && dayIsClosed && activeTab === "home" && (
          <div className="bg-blue-50 p-4 mb-6 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-blue-800">Day is Closed</h2>
                <p className="text-sm text-blue-700">This day has been closed. You can view data but cannot make changes.</p>
              </div>
              <Button variant="outline" onClick={() => setShowSetup(true)} className="bg-white">
                Start New Day
              </Button>
            </div>
          </div>
        )}

        {activeTab === "home" && dailySetup && (
          <div className="space-y-6">
            {/* Dashboard Summary */}
            <Suspense fallback={<div>Loading summary...</div>}>
              <DashboardSummary
                dailySetup={dailySetup}
                bills={bills}
                getTotalInitialStock={stockCalculations.getTotalInitialStock}
                getSoldStockLiveWeight={stockCalculations.getSoldStockLiveWeight}
                getSoldStockMeatWeight={stockCalculations.getSoldStockMeatWeight}
                getRemainingStockLiveWeight={stockCalculations.getRemainingStockLiveWeight}
                getRemainingStockMeatWeight={stockCalculations.getRemainingStockMeatWeight}
                getTotalInitialStockInMeatWeight={stockCalculations.getTotalInitialStockInMeatWeight}
                getRemainingBirds={stockCalculations.getRemainingBirds}
                getCurrentEarnings={salesCalculations.getCurrentEarnings}
                getRetailSales={salesCalculations.getRetailSales}
                getWholesaleSales={salesCalculations.getWholesaleSales}
                getTotalCountryInitialStock={stockCalculations.getTotalCountryInitialStock}
                getSoldCountryStockLiveWeight={stockCalculations.getSoldCountryStockLiveWeight}
                getSoldCountryStockMeatWeight={stockCalculations.getSoldCountryStockMeatWeight}
                getRemainingCountryStockLiveWeight={stockCalculations.getRemainingCountryStockLiveWeight}
                getRemainingCountryStockMeatWeight={stockCalculations.getRemainingCountryStockMeatWeight}
                getRemainingCountryBirds={stockCalculations.getRemainingCountryBirds}
                getCountryChickenSales={salesCalculations.getCountryChickenSales}
              />
            </Suspense>

            {/* Day Management Component */}
            <Suspense fallback={<div>Loading...</div>}>
              <DayManagement
                dailySetup={dailySetup}
                onStartNewDay={handleStartNewDay}
                currentStock={stockCalculations.getRemainingStockLiveWeight()}
                remainingBirds={stockCalculations.getRemainingBirds()}
                currentCountryStock={stockCalculations.getRemainingCountryStockLiveWeight()}
                remainingCountryBirds={stockCalculations.getRemainingCountryBirds()}
                currentEarnings={salesCalculations.getCurrentEarnings()}
                estimatedEarnings={dailySetup.estimatedEarnings}
                totalDiscounts={salesCalculations.getTotalDiscounts()}
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
                    currentStock={stockCalculations.getRemainingStockLiveWeight()}
                    currentCountryStock={stockCalculations.getRemainingCountryStockLiveWeight()}
                  />
                </Suspense>
              </div>
            ) : (
              <Suspense fallback={<div>Loading...</div>}>
                <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={true} isReadOnly={viewingClosedDay || dayIsClosed} />
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

        {activeTab === "conversion-rates" && (
          <Suspense fallback={<div>Loading...</div>}>
            <ConversionRatesManagement />
          </Suspense>
        )}

        {activeTab === "expenses" && (
          <Suspense fallback={<div>Loading...</div>}>
            <ExpenseCategoryManagement />
          </Suspense>
        )}
      </div>

      {showCloseDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <CloseDayModal
                dailySetup={dailySetup}
                currentStock={stockCalculations.getRemainingStockLiveWeight()}
                expectedBirds={stockCalculations.getRemainingBirds()}
                currentCountryStock={stockCalculations.getRemainingCountryStockLiveWeight()}
                expectedCountryBirds={stockCalculations.getRemainingCountryBirds()}
                currentEarnings={salesCalculations.getCurrentEarnings()}
                estimatedEarnings={dailySetup?.estimatedEarnings || 0}
                totalDiscounts={salesCalculations.getTotalDiscounts()}
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
