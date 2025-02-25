import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { MEAT_CONVERSION_FACTOR } from "../utils/storage";

const CloseDayModal = ({
  dailySetup,
  currentStock,
  expectedBirds,
  currentEarnings,
  estimatedEarnings,
  totalDiscounts,
  onClose,
  onConfirm,
}) => {
  const [actualStock, setActualStock] = useState("");
  const [actualBirds, setActualBirds] = useState("");
  const [expenses, setExpenses] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!actualStock || !actualBirds) {
      setMessage("Please enter both remaining stock and birds");
      return;
    }

    if (Number(actualStock) < 0 || Number(actualBirds) < 0) {
      setMessage("Stock and birds cannot be negative");
      return;
    }

    if (expenses && Number(expenses) < 0) {
      setMessage("Expenses cannot be negative");
      return;
    }

    // Calculate weight loss based on estimation method
    const expectedStock = Number(currentStock);
    const remainingStock = Number(actualStock);
    let weightLoss = expectedStock - remainingStock;
    let weightLossPercentage = (weightLoss / expectedStock) * 100;

    // Only convert between meat and live weight if needed
    let convertedWeightLoss = weightLoss;
    if (dailySetup.estimationMethod === "liveRate") {
      // If using live rate, store both but use live weight as primary
      convertedWeightLoss = weightLoss / MEAT_CONVERSION_FACTOR;
    } else {
      // If using meat weight (skinOutRate), convert to live weight
      convertedWeightLoss = weightLoss * MEAT_CONVERSION_FACTOR;
    }

    const closingData = {
      date: new Date().toISOString(),

      // Stock metrics
      expectedStock: expectedStock,
      actualStock: remainingStock,
      weightLoss: weightLoss.toFixed(2),
      weightLossPercentage: weightLossPercentage.toFixed(2),
      estimationMethod: dailySetup.estimationMethod,

      // Store both weight measurements for reference
      liveWeightLoss:
        dailySetup.estimationMethod === "liveRate"
          ? weightLoss.toFixed(2)
          : convertedWeightLoss.toFixed(2),
      meatWeightLoss:
        dailySetup.estimationMethod === "liveRate"
          ? convertedWeightLoss.toFixed(2)
          : weightLoss.toFixed(2),

      // Bird metrics
      expectedBirds: expectedBirds,
      actualBirds: Number(actualBirds),
      birdLoss: expectedBirds - Number(actualBirds),
      birdLossPercentage: (
        ((expectedBirds - Number(actualBirds)) / expectedBirds) *
        100
      ).toFixed(2),

      // System info
      dailySetupId: dailySetup.id || Date.now(),

      // Financial data
      estimatedEarnings,
      actualEarnings: currentEarnings,
      totalDiscounts,
      expenses: Number(expenses) || 0,
      expenseNotes: expenseNotes.trim(),
      netEarnings: currentEarnings - (Number(expenses) || 0),
    };

    onConfirm(closingData);
  };

  const getWeightLabel = () => {
    return dailySetup.estimationMethod === "liveRate"
      ? "Live weight"
      : "Meat weight";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Close Day</CardTitle>
        <CardDescription>Enter final stock details for today</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expected Stock Display */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-blue-800">
              Expected Remaining Stock
            </h3>
            <div className="text-lg font-bold text-blue-700">
              {currentStock}kg{" "}
              <span className="text-sm">({getWeightLabel()})</span>
            </div>
            <div className="text-sm text-blue-600">
              Expected Birds: {expectedBirds}
            </div>
          </div>

          {/* Actual Stock Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Actual Remaining Stock ({getWeightLabel()}) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                className="mt-1"
                placeholder="Enter actual remaining stock"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Remaining Birds *</label>
              <Input
                type="number"
                value={actualBirds}
                onChange={(e) => setActualBirds(e.target.value)}
                className="mt-1"
                placeholder="Enter number of remaining birds"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-purple-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-purple-800">Financial Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
              <div>Estimated Earnings: ₹{estimatedEarnings.toFixed(2)}</div>
              <div>Actual Earnings: ₹{currentEarnings.toFixed(2)}</div>
              <div>Total Discounts: ₹{totalDiscounts.toFixed(2)}</div>
            </div>
          </div>

          {/* Expenses Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Daily Expenses (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="mt-1"
                placeholder="Enter total expenses for the day"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expense Notes</label>
              <textarea
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md h-20"
                placeholder="Enter details of expenses (optional)"
              />
            </div>
          </div>

          {expenses && (
            <div className="bg-rose-50 p-4 rounded-lg">
              <h3 className="font-semibold text-rose-800">Net Earnings</h3>
              <div className="text-lg font-bold text-rose-700">
                ₹{(currentEarnings - Number(expenses)).toFixed(2)}
              </div>
            </div>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Confirm & Close Day</Button>
      </CardFooter>
    </Card>
  );
};

export default CloseDayModal;
