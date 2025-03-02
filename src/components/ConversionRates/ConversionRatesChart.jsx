import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { getAllConversionFactorHistory } from "../../utils/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

const ConversionRatesChart = () => {
  const [chartData, setChartData] = useState([]);
  const [selectedFactor, setSelectedFactor] = useState("all"); // all, broilerMeatConversion, countryChickenMeatConversion

  useEffect(() => {
    // Process history data for the chart
    processHistoryData();
  }, []);

  const processHistoryData = () => {
    const allHistory = getAllConversionFactorHistory();

    // Group by timestamp for the chart
    const groupedByDate = {};

    // Add all current values first to ensure we have the latest data
    const currentValues = allHistory.filter((entry) => entry.isCurrent);
    for (const entry of currentValues) {
      const dateKey = formatDate(entry.timestamp);
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          timestamp: entry.timestamp,
        };
      }

      // Store value with the factor ID as the key
      groupedByDate[dateKey][entry.id] = entry.value;
    }

    // Add historical values
    const historicalValues = allHistory.filter((entry) => !entry.isCurrent);
    for (const entry of historicalValues) {
      const dateKey = formatDate(entry.timestamp);
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          timestamp: entry.timestamp,
        };
      }

      // Only set if not already set (current values take precedence)
      if (groupedByDate[dateKey][entry.id] === undefined) {
        groupedByDate[dateKey][entry.id] = entry.value;
      }
    }

    // Convert to array and sort chronologically
    let chartData = Object.values(groupedByDate).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Fill in missing values (carry forward)
    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].broilerMeatConversion === undefined && chartData[i - 1].broilerMeatConversion !== undefined) {
        chartData[i].broilerMeatConversion = chartData[i - 1].broilerMeatConversion;
      }

      if (chartData[i].countryChickenMeatConversion === undefined && chartData[i - 1].countryChickenMeatConversion !== undefined) {
        chartData[i].countryChickenMeatConversion = chartData[i - 1].countryChickenMeatConversion;
      }
    }

    setChartData(chartData);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleFactorFilterChange = (factorId) => {
    setSelectedFactor(factorId);
  };

  // Create a custom tooltip function
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md text-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conversion Factors Over Time</CardTitle>
        <CardDescription>Visual history of changes to conversion factors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => handleFactorFilterChange("all")}
            className={`px-3 py-1 text-sm rounded-md ${selectedFactor === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Both Factors
          </button>
          <button
            onClick={() => handleFactorFilterChange("broilerMeatConversion")}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedFactor === "broilerMeatConversion" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Broiler Only
          </button>
          <button
            onClick={() => handleFactorFilterChange("countryChickenMeatConversion")}
            className={`px-3 py-1 text-sm rounded-md ${
              selectedFactor === "countryChickenMeatConversion" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Country Chicken Only
          </button>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                {(selectedFactor === "all" || selectedFactor === "broilerMeatConversion") && (
                  <Line type="monotone" dataKey="broilerMeatConversion" name="Broiler Conversion" stroke="#8884d8" activeDot={{ r: 8 }} connectNulls />
                )}

                {(selectedFactor === "all" || selectedFactor === "countryChickenMeatConversion") && (
                  <Line
                    type="monotone"
                    dataKey="countryChickenMeatConversion"
                    name="Country Chicken Conversion"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No history data available for chart visualization.</div>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p className="italic">Tip: Click on the legend items to toggle visibility of factors</p>
            <p className="mt-1">
              Showing data from {chartData[0]?.date || "N/A"} to {chartData[chartData.length - 1]?.date || "N/A"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionRatesChart;
