import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, History } from "lucide-react";
import {
  saveDailySetup,
  getDailySetup,
  getBills,
  getBillsForCurrentDay,
  addBill,
  updateBill,
  isDaySetupValid,
  clearDaySetup,
  saveDailyClosing,
  getClosedDay,
  startNewDaySetup,
} from "../utils/storage";
import { Input } from "./ui/input";
import { calculateStock, calculateSales, isDayClosed } from "../utils/DashboardUtils";

// Lazy load components
const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./Billing/BillingForm"));
const BillingOptions = React.lazy(() => import("./Billing/BillingOptions"));
const BillsTable = React.lazy(() => import("./Billing/BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));
const CloseDayModal = React.lazy(() => import("./CloseDayModal"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));
const HistoricalDataTable = React.lazy(() => import("./HistoricalDataTable"));
const HistoricalDayDetails = React.lazy(() => import("./HistoricalDayDetails"));
const DayStatusBanner = React.lazy(() => import("./DayStatusBanner"));

const StaffDashboard = ({ logout }) => {
  const [dailySetup, setDailySetup] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedBillingOption, setSelectedBillingOption] = useState(null);
  const [bills, setBills] = useState([]);
  const [editingBill, setEditingBill] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [closedDayData, setClosedDayData] = useState(null);
  const [viewingClosedDay, setViewingClosedDay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoricalDay, setSelectedHistoricalDay] = useState(null);
  const [dayIsClosed, setDayIsClosed] = useState(false);

  // Handler functions
  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof logout === "function") {
      logout();
    }
  };

  const handleCloseDayClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCloseDayModal(true);
  };

  const handleHistoryClick = () => {
    setShowHistory(true);
    setSelectedHistoricalDay(null);
  };

  // Load initial data
  useEffect(() => {
    loadDailyData();
  }, []);

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

  // Setup handlers
  const handleSetupComplete = (setupData) => {
    const savedSetup = saveDailySetup(setupData);
    setDailySetup(savedSetup);
    setShowSetup(false);
    setViewingClosedDay(false);
    setDayIsClosed(false);
  };

  // Handle starting a new day
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

  // Billing option selection handler
  const handleBillingOptionSelect = (option) => {
    if (viewingClosedDay || dayIsClosed) {
      // Don't allow billing changes when viewing closed day or day is closed
      return;
    }
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
    if (viewingClosedDay || dayIsClosed) {
      // Don't allow editing when viewing closed day or day is closed
      return;
    }

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

  // Handle viewing historical day details
  const handleViewHistoricalDay = (dayData) => {
    setSelectedHistoricalDay(dayData);
  };

  // Handle returning from historical view
  const handleBackFromHistorical = () => {
    setSelectedHistoricalDay(null);
  };

  // Handle closing the day
  const handleCloseDayConfirmed = async (closingData) => {
    const saved = await saveDailyClosing(closingData);
    if (saved) {
      // Update the closed day data without clearing current setup
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

  // Get stock calculations
  const stockCalculations = dailySetup ? calculateStock(dailySetup, bills) : {};

  // Get sales calculations
  const salesCalculations = calculateSales(bills);

  // Early return for dashboard with Start Day button when no setup exists
  if (!dailySetup) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Staff Dashboard</h1>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleHistoryClick}>
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {showHistory ? (
            selectedHistoricalDay ? (
              <Suspense fallback={<div>Loading historical day details...</div>}>
                <HistoricalDayDetails dayData={selectedHistoricalDay} onBack={handleBackFromHistorical} />
              </Suspense>
            ) : (
              <Suspense fallback={<div>Loading history...</div>}>
                <HistoricalDataTable onViewDay={handleViewHistoricalDay} />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setShowHistory(false)}>Back to Dashboard</Button>
                </div>
              </Suspense>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Start New Day</CardTitle>
                <CardDescription>Initialize daily operations by setting up today's rates and stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-gray-500 mb-4">No active daily setup found. Start a new day to begin operations.</p>
                  <div className="flex gap-4 justify-center">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-48" />
                    <Button onClick={() => setShowSetup(true)}>Start Day</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={handleHistoryClick}>
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
            {dailySetup && !viewingClosedDay && !dayIsClosed && (
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
        {showHistory ? (
          selectedHistoricalDay ? (
            <Suspense fallback={<div>Loading historical day details...</div>}>
              <HistoricalDayDetails dayData={selectedHistoricalDay} onBack={handleBackFromHistorical} />
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading history...</div>}>
              <HistoricalDataTable onViewDay={handleViewHistoricalDay} />
              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowHistory(false)}>Back to Dashboard</Button>
              </div>
            </Suspense>
          )
        ) : (
          <>
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
            {!viewingClosedDay && dayIsClosed && (
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
                    currentStock={stockCalculations.getRemainingStockLiveWeight()}
                    currentCountryStock={stockCalculations.getRemainingCountryStockLiveWeight()}
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
                    currentStock={stockCalculations.getRemainingStockLiveWeight()}
                    remainingBirds={stockCalculations.getRemainingBirds()}
                    currentCountryStock={stockCalculations.getRemainingCountryStockLiveWeight()}
                    remainingCountryBirds={stockCalculations.getRemainingCountryBirds()}
                    estimatedEarnings={dailySetup.estimatedEarnings}
                    currentEarnings={salesCalculations.getCurrentEarnings()}
                    totalDiscounts={salesCalculations.getTotalDiscounts()}
                  />
                </Suspense>

                {!viewingClosedDay && !dayIsClosed && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold">Generate Bill</h2>
                    </div>

                    <Suspense fallback={<div>Loading...</div>}>
                      <BillingOptions onSelectOption={handleBillingOptionSelect} />
                    </Suspense>
                  </>
                )}

                <Suspense fallback={<div>Loading...</div>}>
                  <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={false} isReadOnly={viewingClosedDay || dayIsClosed} />
                </Suspense>
              </div>
            )}
          </>
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
                estimatedEarnings={dailySetup.estimatedEarnings}
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

export default StaffDashboard;
