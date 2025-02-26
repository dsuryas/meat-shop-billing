import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { getDailySetup, getBills, updateBill, saveDailyClosing, clearDaySetup, MEAT_CONVERSION_FACTOR, isDaySetupValid } from "../utils/storage";

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

const AdminDashboard = ({ logout }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [bills, setBills] = useState([]);
  const [dailySetup, setDailySetup] = useState(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [selectedBillingOption, setSelectedBillingOption] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [showSetup, setShowSetup] = useState(false);

  const TABS = [
    { id: "home", label: "Home" },
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
    const setup = getDailySetup();
    if (setup && isDaySetupValid(new Date())) {
      setDailySetup(setup);
      const savedBills = getBills();
      setBills(Array.isArray(savedBills) ? savedBills : []);
    } else {
      setShowSetup(true);
    }
  };

  const handleSetupComplete = (setupData) => {
    setDailySetup(setupData);
    setShowSetup(false);
    setBills([]);
  };

  const handleStartNewDay = (selectedDate) => {
    clearDaySetup();
    setDailySetup(null);
    setShowSetup(true);
    setBills([]);
  };

  const handleEditBill = (bill) => {
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

  if (!dailySetup) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          {renderTabs()}
        </div>

        <div className="p-6">
          {activeTab === "home" ? (
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
          ) : (
            <>
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
            </>
          )}
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
      <div className="bg-white shadow">
        {/* Navigation Bar */}
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        {renderTabs()}
      </div>

      <div className="p-6">
        {activeTab === "home" && dailySetup && (
          <div className="space-y-6">
            {/* Dashboard Summary - Using the shared DashboardSummary component */}
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

            {/* Day Management Component */}
            <Suspense fallback={<div>Loading...</div>}>
              <DayManagement
                dailySetup={dailySetup}
                onStartNewDay={handleStartNewDay}
                currentStock={getRemainingStockLiveWeight()}
                remainingBirds={getRemainingBirds()}
                currentEarnings={Number(getCurrentEarnings())}
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
                    currentStock={getRemainingStockLiveWeight()}
                  />
                </Suspense>
              </div>
            ) : (
              <Suspense fallback={<div>Loading...</div>}>
                <BillsTable bills={bills} onEditBill={handleEditBill} isAdmin={true} />
              </Suspense>
            )}
          </div>
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
    </div>
  );
};

export default AdminDashboard;
