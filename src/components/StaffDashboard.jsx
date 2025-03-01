import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut, History } from "lucide-react";
import {
  saveDailySetup,
  getDailySetup,
  getBills,
  addBill,
  updateBill,
  isDaySetupValid,
  clearDaySetup,
  MEAT_CONVERSION_FACTOR,
  COUNTRY_MEAT_CONVERSION_FACTOR,
  saveDailyClosing,
  getClosedDay,
  startNewDaySetup,
} from "../utils/storage";
import { Input } from "./ui/input";

const DailySetup = React.lazy(() => import("./DailySetup"));
const BillingForm = React.lazy(() => import("./BillingForm"));
const BillingOptions = React.lazy(() => import("./BillingOptions"));
const BillsTable = React.lazy(() => import("./BillsTable"));
const DayManagement = React.lazy(() => import("./DayManagement"));
const CloseDayModal = React.lazy(() => import("./CloseDayModal"));
const DashboardSummary = React.lazy(() => import("./DashboardSummary"));
const HistoricalDataTable = React.lazy(() => import("./HistoricalDataTable"));
const HistoricalDayDetails = React.lazy(() => import("./HistoricalDayDetails"));

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

  // Setup handlers
  const handleSetupComplete = (setupData) => {
    const savedSetup = saveDailySetup(setupData);
    setDailySetup(savedSetup);
    setShowSetup(false);
    setViewingClosedDay(false);
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
  };

  // Billing option selection handler
  const handleBillingOptionSelect = (option) => {
    if (viewingClosedDay) {
      // Don't allow billing changes when viewing closed day
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
    if (viewingClosedDay) {
      // Don't allow editing when viewing closed day
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

  // Broiler Calculation utilities
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

  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0).toFixed(2);
  };

  const getTotalBirds = () => {
    return bills.filter((bill) => !bill.chickenType || bill.chickenType === "broiler").reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingBirds = () => {
    if (!dailySetup) return 0;
    const totalInitialBirds = Number(dailySetup.freshBirds || 0) + Number(dailySetup.remainingBirds || 0);
    return totalInitialBirds - getTotalBirds();
  };

  const getRetailSales = () => {
    return bills
      .filter((bill) => bill.category === "retail" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0)
      .toFixed(2);
  };

  const getWholesaleSales = () => {
    return bills
      .filter((bill) => bill.category === "wholesale" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0)
      .toFixed(2);
  };

  // Country chicken calculation utilities
  const getTotalCountryInitialStock = () => {
    if (!dailySetup) return 0;
    return Number(dailySetup.countryFreshStock || 0) + Number(dailySetup.countryRemainingStock || 0);
  };

  const getTotalCountryInitialStockInMeatWeight = () => {
    if (!dailySetup) return 0;
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
    if (!dailySetup) return 0;
    const totalInitialCountryBirds = Number(dailySetup.countryFreshBirds || 0) + Number(dailySetup.countryRemainingBirds || 0);
    return totalInitialCountryBirds - getCountryChickenBirdCount();
  };

  const getCountryChickenSales = () => {
    return bills
      .filter((bill) => bill.chickenType === "country")
      .reduce((total, bill) => total + Number(bill.price || 0), 0)
      .toFixed(2);
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

      // Show a flag indicating the day is closed
      setViewingClosedDay(true);
    }
    setShowCloseDayModal(false);
  };

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
            {dailySetup && !viewingClosedDay && (
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
            {viewingClosedDay && (
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

            {/* Dashboard Summary */}
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
                    currentCountryStock={getRemainingCountryStockLiveWeight()}
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
                    currentCountryStock={getRemainingCountryStockLiveWeight()}
                    remainingCountryBirds={getRemainingCountryBirds()}
                    estimatedEarnings={dailySetup.estimatedEarnings}
                    currentEarnings={Number(getCurrentEarnings())}
                    totalDiscounts={bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0)}
                  />
                </Suspense>

                {!viewingClosedDay && (
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
                  <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={false} isReadOnly={viewingClosedDay} />
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
                currentStock={getRemainingStockLiveWeight()}
                expectedBirds={getRemainingBirds()}
                currentCountryStock={getRemainingCountryStockLiveWeight()}
                expectedCountryBirds={getRemainingCountryBirds()}
                currentEarnings={Number(getCurrentEarnings())}
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

export default StaffDashboard;
