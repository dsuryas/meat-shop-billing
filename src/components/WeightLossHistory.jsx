import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { getDailyClosings } from "../utils/storage";

// Simple stat card component for consistent styling
const StatCard = ({ title, value, subValue, colorScheme = "blue" }) => (
  <Card className={`bg-${colorScheme}-50`}>
    <CardContent className="pt-4 pb-4">
      <div className={`text-sm text-${colorScheme}-600 mb-1`}>{title}</div>
      <div className={`text-lg font-bold text-${colorScheme}-700`}>{value}</div>
      {subValue && <div className={`text-sm text-${colorScheme}-600`}>{subValue}</div>}
    </CardContent>
  </Card>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  subValue: PropTypes.node,
  colorScheme: PropTypes.string,
};

const WeightLossHistory = () => {
  // State for loading and data
  const [data, setData] = useState({
    closings: [],
    isLoading: true,
    error: null,
  });

  // Simple safe number conversion
  const safeNum = (value, defaultValue = 0) => (value === null || value === undefined || value === "" || isNaN(Number(value)) ? defaultValue : Number(value));

  // Format date consistently
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await Promise.resolve(getDailyClosings());
        setData({
          closings: Array.isArray(result) ? result : [],
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error loading weight loss history:", error);
        setData({
          closings: [],
          isLoading: false,
          error: "Failed to load weight loss history",
        });
      }
    };

    fetchData();
  }, []);

  // Calculate statistics safely
  const getWeightLossStats = () => {
    const { closings } = data;
    if (!closings || !closings.length) return { average: {}, highest: {}, lowest: {} };

    try {
      // Helper functions
      const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
      const max = (arr) => (arr.length ? Math.max(...arr) : 0);
      const min = (arr) => (arr.length ? Math.min(...arr) : 0);

      // Extract arrays of values
      const weightLosses = closings.map((c) => safeNum(c.weightLoss));
      const weightLossPercentages = closings.map((c) => safeNum(c.weightLossPercentage));
      const birdLosses = closings.map((c) => safeNum(c.birdLoss));

      return {
        average: {
          weight: avg(weightLosses),
          percentage: avg(weightLossPercentages),
          birds: avg(birdLosses),
        },
        highest: {
          weight: max(weightLosses),
          percentage: max(weightLossPercentages),
          birds: max(birdLosses),
        },
        lowest: {
          weight: min(weightLosses),
          percentage: min(weightLossPercentages),
          birds: min(birdLosses),
        },
      };
    } catch (error) {
      console.error("Error calculating weight loss statistics:", error);
      return { average: {}, highest: {}, lowest: {} };
    }
  };

  // Get calculated stats
  const stats = getWeightLossStats();
  const { closings, isLoading, error } = data;

  // Loading state
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading weight loss history...</div>;
  }

  // Error state
  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg text-red-600">{error}</div>;
  }

  // Empty state
  if (!closings || closings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No weight loss data recorded yet.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Average Weight Loss"
          value={`${stats.average.weight.toFixed(2)}kg`}
          subValue={`${stats.average.percentage.toFixed(2)}% of stock`}
          colorScheme="blue"
        />

        <StatCard
          title="Highest Weight Loss"
          value={`${stats.highest.weight.toFixed(2)}kg`}
          subValue={`${stats.highest.percentage.toFixed(2)}% of stock`}
          colorScheme="amber"
        />

        <StatCard
          title="Lowest Weight Loss"
          value={`${stats.lowest.weight.toFixed(2)}kg`}
          subValue={`${stats.lowest.percentage.toFixed(2)}% of stock`}
          colorScheme="green"
        />
      </div>

      {/* Main History Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Loss History</CardTitle>
          <CardDescription>Historical record of weight loss during daily operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Overview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight Loss</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birds</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {closings.map((closing, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(closing.date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Expected: {safeNum(closing.expectedStock).toFixed(2)}kg</div>
                      <div>Actual: {safeNum(closing.actualStock).toFixed(2)}kg</div>
                      <div className="text-xs text-gray-400 mt-1">{closing.estimationMethod === "liveRate" ? "Live weight" : "Meat weight"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${safeNum(closing.weightLoss) > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {safeNum(closing.weightLoss).toFixed(2)}kg
                      </span>
                      <div className="mt-1 text-sm text-gray-500">{safeNum(closing.weightLossPercentage).toFixed(2)}% of stock</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Expected: {safeNum(closing.expectedBirds)}</div>
                        <div>Actual: {safeNum(closing.actualBirds)}</div>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${safeNum(closing.birdLoss) > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                        >
                          Loss: {safeNum(closing.birdLoss)} birds
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightLossHistory;
