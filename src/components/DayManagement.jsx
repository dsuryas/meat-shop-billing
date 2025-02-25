import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Calendar, PieChart, TrendingUp, Clock } from "lucide-react";
import { getDailyClosings, saveDailyClosing } from "../utils/storage";
const CloseDayModal = React.lazy(() => import("./CloseDayModal"));

const DayManagement = ({
  dailySetup,
  onStartNewDay,
  currentStock,
  remainingBirds,
  currentEarnings,
  estimatedEarnings,
  totalDiscounts,
}) => {
  const [dayReport, setDayReport] = useState(null);
  const [isDayClosed, setIsDayClosed] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);

  useEffect(() => {
    if (!dailySetup?.date) return;

    // Get all daily closings
    const dailyClosings = getDailyClosings();
    if (dailyClosings && dailyClosings.length > 0) {
      // Find report for current setup date
      const setupDate = new Date(dailySetup.date).toDateString();
      const currentDayReport = dailyClosings.find(
        (report) => new Date(report.date).toDateString() === setupDate
      );

      if (currentDayReport) {
        setIsDayClosed(true);
        setDayReport(currentDayReport);
      } else {
        setIsDayClosed(false);
        setDayReport(null);
      }
    }
  }, [dailySetup?.date]);

  const handleCloseDayConfirmed = async (closingData) => {
    const saved = await saveDailyClosing(closingData);
    if (saved) {
      setDayReport(closingData);
      setIsDayClosed(true);
    }
    setShowCloseDayModal(false);
  };

  const handleStartNewDay = (selectedDate) => {
    onStartNewDay(selectedDate);
    setIsDayClosed(false);
    setDayReport(null);
  };

  const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {dayReport ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Report</CardTitle>
              <CardDescription>
                Summary for {new Date(dayReport.date).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Stock Overview */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-blue-700">
                      Stock Overview
                    </h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>
                      Expected Stock:{" "}
                      {Number(dayReport.expectedStock || 0).toFixed(2)} kg
                    </p>
                    <p>
                      Actual Stock:{" "}
                      {Number(dayReport.actualStock || 0).toFixed(2)} kg
                    </p>
                    <p>
                      Weight Loss:{" "}
                      {Number(dayReport.weightLoss || 0).toFixed(2)} kg
                    </p>
                  </div>
                </div>

                {/* Bird Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-green-700">Bird Count</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>Expected Birds: {dayReport.expectedBirds || 0}</p>
                    <p>Actual Birds: {dayReport.actualBirds || 0}</p>
                    <p>
                      Bird Loss:{" "}
                      {(dayReport.expectedBirds || 0) -
                        (dayReport.actualBirds || 0)}
                    </p>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-purple-50 p-4 rounded-lg col-span-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-purple-700">
                      Financial Summary
                    </h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p>
                      Estimated:{" "}
                      {formatCurrency(dayReport.estimatedEarnings || 0)}
                    </p>
                    <p>
                      Actual: {formatCurrency(dayReport.actualEarnings || 0)}
                    </p>
                    <p>
                      Discounts: {formatCurrency(dayReport.totalDiscounts || 0)}
                    </p>
                    <p>Expenses: {formatCurrency(dayReport.expenses || 0)}</p>
                    <div className="border-t border-purple-200 mt-2 pt-2">
                      <p className="font-semibold">
                        Net Earnings:{" "}
                        {formatCurrency(dayReport.netEarnings || 0)}
                      </p>
                    </div>
                  </div>
                  {dayReport.expenseNotes && (
                    <div className="mt-2 text-sm text-purple-600">
                      <p className="font-medium">Expense Notes:</p>
                      <p>{dayReport.expenseNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Start New Day Section */}
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Start New Day</h3>
                <div className="flex gap-4">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => handleStartNewDay(startDate)}>
                    Start New Day
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {showCloseDayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <Suspense fallback={<div>Loading...</div>}>
              <CloseDayModal
                dailySetup={dailySetup}
                currentStock={currentStock}
                expectedBirds={remainingBirds}
                currentEarnings={currentEarnings}
                estimatedEarnings={estimatedEarnings}
                totalDiscounts={totalDiscounts}
                onClose={() => setShowCloseDayModal(false)}
                onConfirm={handleCloseDayConfirmed}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayManagement;
