import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { getDailyClosings } from "../utils/storage";

// Simple, reusable StatsCard component
const StatsCard = ({ title, value, colorScheme = "blue" }) => (
  <Card className={`bg-${colorScheme}-50`}>
    <CardContent className="pt-4 pb-4">
      <div className={`text-sm text-${colorScheme}-600 mb-1`}>{title}</div>
      <div className={`text-lg font-bold text-${colorScheme}-700`}>{value}</div>
    </CardContent>
  </Card>
);

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  colorScheme: PropTypes.string,
};

const Stats = () => {
  const [data, setData] = useState({ closings: [], isLoading: true, error: null });

  // Safe conversion to number
  const safeNum = (value, defaultValue = 0) => (value === null || value === undefined || value === "" || isNaN(Number(value)) ? defaultValue : Number(value));

  // Format date consistently
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

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
        console.error("Error loading stats data:", error);
        setData((prev) => ({ ...prev, isLoading: false, error: "Failed to load statistics" }));
      }
    };

    fetchData();
  }, []);

  // Calculate statistics from the data
  const calculateStats = () => {
    const { closings } = data;
    if (!closings || closings.length === 0) return { averages: null, extremes: null };

    try {
      // Calculate averages
      const sum = (arr, fn) => arr.reduce((total, item) => total + fn(item), 0);
      const avg = (arr, fn) => sum(arr, fn) / arr.length;

      const averages = {
        weightLossPercent: avg(closings, (c) => safeNum(c.weightLossPercentage)),
        avgWeightLoss: avg(closings, (c) => safeNum(c.weightLoss)),
        avgEarnings: avg(closings, (c) => safeNum(c.netEarnings)),
      };

      // Safe min/max calculation
      const findExtreme = (arr, fn, method) => {
        if (!arr.length) return 0;
        return Math[method](...arr.map((item) => fn(item)));
      };

      // Calculate extremes
      const extremes = {
        highest: {
          lossPercent: findExtreme(closings, (c) => safeNum(c.weightLossPercentage), "max"),
          weightLoss: findExtreme(closings, (c) => safeNum(c.weightLoss), "max"),
          earnings: findExtreme(closings, (c) => safeNum(c.netEarnings), "max"),
        },
        lowest: {
          lossPercent: findExtreme(closings, (c) => safeNum(c.weightLossPercentage), "min"),
          weightLoss: findExtreme(closings, (c) => safeNum(c.weightLoss), "min"),
          earnings: findExtreme(closings, (c) => safeNum(c.netEarnings), "min"),
        },
      };

      return { averages, extremes };
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return { averages: null, extremes: null };
    }
  };

  // Get calculated stats
  const { averages, extremes } = calculateStats();
  const { closings, isLoading, error } = data;

  // Loading state
  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading statistics...</div>;
  }

  // Error state
  if (error) {
    return <div className="bg-red-50 p-4 rounded-lg text-red-600">{error}</div>;
  }

  // Empty state
  if (!closings || closings.length === 0) {
    return <div className="text-center py-8 text-gray-500">No historical data available yet.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Average Weight Loss"
          value={`${averages?.avgWeightLoss.toFixed(2)}kg (${averages?.weightLossPercent.toFixed(2)}%)`}
          colorScheme="blue"
        />

        <StatsCard
          title="Highest Weight Loss"
          value={`${extremes?.highest.weightLoss.toFixed(2)}kg (${extremes?.highest.lossPercent.toFixed(2)}%)`}
          colorScheme="amber"
        />

        <StatsCard
          title="Lowest Weight Loss"
          value={`${extremes?.lowest.weightLoss.toFixed(2)}kg (${extremes?.lowest.lossPercent.toFixed(2)}%)`}
          colorScheme="green"
        />

        <StatsCard title="Average Earnings" value={`₹${averages?.avgEarnings.toFixed(2)}`} colorScheme="purple" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Operations Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight Loss</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Birds</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financial</th>
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
                      <div className="text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${safeNum(closing.weightLoss) > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                        >
                          {safeNum(closing.weightLoss).toFixed(2)}kg
                        </span>
                        <span className="ml-2">({safeNum(closing.weightLossPercentage).toFixed(2)}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Expected: {safeNum(closing.expectedBirds)}</div>
                      <div>Actual: {safeNum(closing.actualBirds)}</div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${safeNum(closing.birdLoss) > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                        >
                          Loss: {safeNum(closing.birdLoss)} ({safeNum(closing.birdLossPercentage).toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="grid grid-cols-2 gap-x-4 text-sm">
                        <div>Est: ₹{safeNum(closing.estimatedEarnings).toFixed(2)}</div>
                        <div>Act: ₹{safeNum(closing.actualEarnings).toFixed(2)}</div>
                        <div>Disc: ₹{safeNum(closing.totalDiscounts).toFixed(2)}</div>
                        <div>Exp: ₹{safeNum(closing.expenses).toFixed(2)}</div>
                      </div>
                      <div className="mt-1 text-green-600 font-medium border-t border-green-200 pt-1">Net: ₹{safeNum(closing.netEarnings).toFixed(2)}</div>
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

export default Stats;
