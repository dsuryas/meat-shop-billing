import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { MEAT_CONVERSION_FACTOR, COUNTRY_MEAT_CONVERSION_FACTOR, getExpenseCategories } from "../utils/storage";
import PropTypes from "prop-types";

const CloseDayModal = ({
  dailySetup,
  currentStock,
  expectedBirds,
  currentCountryStock,
  expectedCountryBirds,
  currentEarnings,
  estimatedEarnings,
  totalDiscounts,
  onClose,
  onConfirm,
}) => {
  const [actualStock, setActualStock] = useState("");
  const [actualBirds, setActualBirds] = useState("");
  const [actualCountryStock, setActualCountryStock] = useState("");
  const [actualCountryBirds, setActualCountryBirds] = useState("");
  const [expenseItems, setExpenseItems] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [message, setMessage] = useState("");

  // Load expense categories
  useEffect(() => {
    const categories = getExpenseCategories();
    setExpenseCategories(categories);

    // Initialize expense items with one empty item for each category
    if (categories.length > 0) {
      const initialItems = categories.map((category) => ({
        categoryId: category.id,
        categoryName: category.name,
        amount: "",
      }));
      setExpenseItems(initialItems);
    } else {
      // If no categories, create a single generic expense item
      setExpenseItems([{ categoryId: "generic", categoryName: "General Expense", amount: "" }]);
    }
  }, []);

  // Calculate total expenses whenever expense items change
  useEffect(() => {
    const total = expenseItems.reduce((sum, item) => {
      return sum + (Number(item.amount) || 0);
    }, 0);
    setTotalExpenses(total);
  }, [expenseItems]);

  // Handle expense amount change
  const handleExpenseChange = (index, amount) => {
    const updatedItems = [...expenseItems];
    updatedItems[index] = { ...updatedItems[index], amount };
    setExpenseItems(updatedItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation for broiler stock
    if (!actualStock || !actualBirds) {
      setMessage("Please enter both remaining broiler stock and birds");
      return;
    }

    // Basic validation for country chicken stock
    if (!actualCountryStock || !actualCountryBirds) {
      setMessage("Please enter both remaining country chicken stock and birds");
      return;
    }

    if (Number(actualStock) < 0 || Number(actualBirds) < 0 || Number(actualCountryStock) < 0 || Number(actualCountryBirds) < 0) {
      setMessage("Stock and birds cannot be negative");
      return;
    }

    // Validate expenses
    for (const item of expenseItems) {
      if (item.amount && Number(item.amount) < 0) {
        setMessage(`Expense amount for ${item.categoryName} cannot be negative`);
        return;
      }
    }

    // Calculate weight loss for broilers based on estimation method
    const expectedBroilerStock = Number(currentStock);
    const remainingBroilerStock = Number(actualStock);
    let broilerWeightLoss = expectedBroilerStock - remainingBroilerStock;
    let broilerWeightLossPercentage = expectedBroilerStock > 0 ? (broilerWeightLoss / expectedBroilerStock) * 100 : 0;

    // Calculate weight loss for country chicken
    const expectedCountryStock = Number(currentCountryStock);
    const remainingCountryStock = Number(actualCountryStock);
    let countryWeightLoss = expectedCountryStock - remainingCountryStock;
    let countryWeightLossPercentage = expectedCountryStock > 0 ? (countryWeightLoss / expectedCountryStock) * 100 : 0;

    // Only convert between meat and live weight for broilers if needed
    let convertedBroilerWeightLoss = broilerWeightLoss;
    if (dailySetup.estimationMethod === "liveRate") {
      // If using live rate, store both but use live weight as primary
      convertedBroilerWeightLoss = broilerWeightLoss / MEAT_CONVERSION_FACTOR;
    } else {
      // If using meat weight (skinOutRate), convert to live weight
      convertedBroilerWeightLoss = broilerWeightLoss * MEAT_CONVERSION_FACTOR;
    }

    // Convert country chicken weight loss
    let convertedCountryWeightLoss = countryWeightLoss / COUNTRY_MEAT_CONVERSION_FACTOR;

    // Filter out expense items with no amount
    const validExpenseItems = expenseItems.filter((item) => Number(item.amount) > 0);

    const closingData = {
      date: new Date().toISOString(),

      // Broiler stock metrics
      expectedStock: expectedBroilerStock,
      actualStock: remainingBroilerStock,
      weightLoss: broilerWeightLoss.toFixed(2),
      weightLossPercentage: broilerWeightLossPercentage.toFixed(2),
      estimationMethod: dailySetup.estimationMethod,

      // Store both weight measurements for broilers
      liveWeightLoss: dailySetup.estimationMethod === "liveRate" ? broilerWeightLoss.toFixed(2) : convertedBroilerWeightLoss.toFixed(2),
      meatWeightLoss: dailySetup.estimationMethod === "liveRate" ? convertedBroilerWeightLoss.toFixed(2) : broilerWeightLoss.toFixed(2),

      // Country chicken stock metrics
      expectedCountryStock: expectedCountryStock,
      actualCountryStock: remainingCountryStock,
      countryWeightLoss: countryWeightLoss.toFixed(2),
      countryWeightLossPercentage: countryWeightLossPercentage.toFixed(2),
      countryMeatWeightLoss: convertedCountryWeightLoss.toFixed(2),

      // Broiler bird metrics
      expectedBirds: expectedBirds,
      actualBirds: Number(actualBirds),
      birdLoss: expectedBirds - Number(actualBirds),
      birdLossPercentage: expectedBirds > 0 ? (((expectedBirds - Number(actualBirds)) / expectedBirds) * 100).toFixed(2) : "0.00",

      // Country chicken bird metrics
      expectedCountryBirds: expectedCountryBirds,
      actualCountryBirds: Number(actualCountryBirds),
      countryBirdLoss: expectedCountryBirds - Number(actualCountryBirds),
      countryBirdLossPercentage:
        expectedCountryBirds > 0 ? (((expectedCountryBirds - Number(actualCountryBirds)) / expectedCountryBirds) * 100).toFixed(2) : "0.00",

      // System info
      dailySetupId: dailySetup.id || Date.now(),

      // Financial data
      estimatedEarnings,
      actualEarnings: currentEarnings,
      totalDiscounts,
      expenses: totalExpenses,
      expenseItems: validExpenseItems,
      expenseNotes: expenseNotes.trim(),
      netEarnings: currentEarnings - totalExpenses,
    };

    onConfirm(closingData);
  };

  const getWeightLabel = () => {
    return dailySetup.estimationMethod === "liveRate" ? "Live weight" : "Meat weight";
  };

  return (
    <Card className="max-h-[90vh] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Close Day</CardTitle>
        <CardDescription>Enter final stock details for today</CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto pb-0">
        <form className="space-y-4">
          {/* Broiler Expected Stock Display */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-blue-800">Expected Remaining Broiler Stock</h3>
            <div className="text-lg font-bold text-blue-700">
              {currentStock}kg <span className="text-sm">({getWeightLabel()})</span>
            </div>
            <div className="text-sm text-blue-600">Expected Birds: {expectedBirds}</div>
          </div>

          {/* Broiler Actual Stock Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Actual Remaining Broiler Stock ({getWeightLabel()}) *</label>
              <Input
                type="number"
                step="0.01"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                className="mt-1"
                placeholder="Enter actual remaining broiler stock"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Remaining Broiler Birds *</label>
              <Input
                type="number"
                value={actualBirds}
                onChange={(e) => setActualBirds(e.target.value)}
                className="mt-1"
                placeholder="Enter number of remaining broiler birds"
              />
            </div>
          </div>

          {/* Country Chicken Expected Stock Display */}
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-green-800">Expected Remaining Country Chicken Stock</h3>
            <div className="text-lg font-bold text-green-700">
              {currentCountryStock}kg <span className="text-sm">(Live weight)</span>
            </div>
            <div className="text-sm text-green-600">Expected Birds: {expectedCountryBirds}</div>
          </div>

          {/* Country Chicken Actual Stock Input */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Actual Remaining Country Chicken Stock (Live weight) *</label>
              <Input
                type="number"
                step="0.01"
                value={actualCountryStock}
                onChange={(e) => setActualCountryStock(e.target.value)}
                className="mt-1"
                placeholder="Enter actual remaining country chicken stock"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Remaining Country Chicken Birds *</label>
              <Input
                type="number"
                value={actualCountryBirds}
                onChange={(e) => setActualCountryBirds(e.target.value)}
                className="mt-1"
                placeholder="Enter number of remaining country chicken birds"
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
            <h3 className="font-semibold text-gray-800">Daily Expenses</h3>

            {expenseCategories.length === 0 ? (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700">No expense categories configured. Please add categories in the Expenses tab of the Admin Dashboard.</p>
                <div className="mt-4">
                  <label className="text-sm font-medium">General Expenses (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expenseItems[0]?.amount || ""}
                    onChange={(e) => handleExpenseChange(0, e.target.value)}
                    className="mt-1"
                    placeholder="Enter total expenses for the day"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {expenseItems.map((item, index) => (
                  <div key={item.categoryId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-medium">{item.categoryName} (₹)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleExpenseChange(index, e.target.value)}
                        className="mt-1"
                        placeholder={`Enter ${item.categoryName.toLowerCase()} expenses`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
              <span className="font-medium">Total Expenses:</span>
              <span className="font-bold">₹{totalExpenses.toFixed(2)}</span>
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

          {totalExpenses > 0 && (
            <div className="bg-rose-50 p-4 rounded-lg">
              <h3 className="font-semibold text-rose-800">Net Earnings</h3>
              <div className="text-lg font-bold text-rose-700">₹{(currentEarnings - totalExpenses).toFixed(2)}</div>
            </div>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4 flex-shrink-0 mt-4 border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Confirm & Close Day</Button>
      </CardFooter>
    </Card>
  );
};

CloseDayModal.propTypes = {
  dailySetup: PropTypes.object.isRequired,
  currentStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  expectedBirds: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentCountryStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  expectedCountryBirds: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentEarnings: PropTypes.number.isRequired,
  estimatedEarnings: PropTypes.number.isRequired,
  totalDiscounts: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default CloseDayModal;
