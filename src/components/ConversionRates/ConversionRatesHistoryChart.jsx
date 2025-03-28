import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { getAllConversionFactorHistory } from "../../utils/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

const ConversionRatesHistoryChart = () => {
  const [chartData, setChartData] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all"); // all, broiler, country
  const [typeFilter, setTypeFilter] = useState("all"); // all, meat, withSkin, withoutSkin

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
      // Broiler factors
      if (chartData[i].broilerMeatConversion === undefined && chartData[i - 1].broilerMeatConversion !== undefined) {
        chartData[i].broilerMeatConversion = chartData[i - 1].broilerMeatConversion;
      }
      if (chartData[i].broilerWithSkinConversion === undefined && chartData[i - 1].broilerWithSkinConversion !== undefined) {
        chartData[i].broilerWithSkinConversion = chartData[i - 1].broilerWithSkinConversion;
      }
      if (chartData[i].broilerWithoutSkinConversion === undefined && chartData[i - 1].broilerWithoutSkinConversion !== undefined) {
        chartData[i].broilerWithoutSkinConversion = chartData[i - 1].broilerWithoutSkinConversion;
      }

      // Country chicken factors
      if (chartData[i].countryMeatConversion === undefined && chartData[i - 1].countryMeatConversion !== undefined) {
        chartData[i].countryMeatConversion = chartData[i - 1].countryMeatConversion;
      }
      if (chartData[i].countryWithSkinConversion === undefined && chartData[i - 1].countryWithSkinConversion !== undefined) {
        chartData[i].countryWithSkinConversion = chartData[i - 1].countryWithSkinConversion;
      }
      if (chartData[i].countryWithoutSkinConversion === undefined && chartData[i - 1].countryWithoutSkinConversion !== undefined) {
        chartData[i].countryWithoutSkinConversion = chartData[i - 1].countryWithoutSkinConversion;
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

  const handleCategoryFilterChange = (newFilter) => {
    setCategoryFilter(newFilter);
  };

  const handleTypeFilterChange = (newFilter) => {
    setTypeFilter(newFilter);
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

  // Helper to determine if a line should be displayed based on filters
  const shouldShowLine = (factorId) => {
    const isBroiler = factorId.startsWith("broiler");
    const isCountry = factorId.startsWith("country");
    const isMeat = factorId.includes("Meat");
    const isWithSkin = factorId.includes("WithSkin");
    const isWithoutSkin = factorId.includes("WithoutSkin");

    // Apply category filter
    if (categoryFilter === "broiler" && !isBroiler) return false;
    if (categoryFilter === "country" && !isCountry) return false;

    // Apply type filter
    if (typeFilter === "meat" && !isMeat) return false;
    if (typeFilter === "withSkin" && !isWithSkin) return false;
    if (typeFilter === "withoutSkin" && !isWithoutSkin) return false;

    return true;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conversion Factors Over Time</CardTitle>
        <CardDescription>Visual history of changes to conversion factors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Chicken Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCategoryFilterChange("all")}
                className={`px-3 py-1 text-xs rounded-md ${
                  categoryFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => handleCategoryFilterChange("broiler")}
                className={`px-3 py-1 text-xs rounded-md ${
                  categoryFilter === "broiler" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Broiler Only
              </button>
              <button
                onClick={() => handleCategoryFilterChange("country")}
                className={`px-3 py-1 text-xs rounded-md ${
                  categoryFilter === "country" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Country Only
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Product Type</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleTypeFilterChange("all")}
                className={`px-3 py-1 text-xs rounded-md ${typeFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                All Products
              </button>
              <button
                onClick={() => handleTypeFilterChange("meat")}
                className={`px-3 py-1 text-xs rounded-md ${typeFilter === "meat" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Meat Only
              </button>
              <button
                onClick={() => handleTypeFilterChange("withSkin")}
                className={`px-3 py-1 text-xs rounded-md ${
                  typeFilter === "withSkin" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                With Skin Only
              </button>
              <button
                onClick={() => handleTypeFilterChange("withoutSkin")}
                className={`px-3 py-1 text-xs rounded-md ${
                  typeFilter === "withoutSkin" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Without Skin Only
              </button>
            </div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-80 mt-4">
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

                {/* Broiler Chicken Lines */}
                {shouldShowLine("broilerMeatConversion") && (
                  <Line type="monotone" dataKey="broilerMeatConversion" name="Broiler Meat" stroke="#8884d8" activeDot={{ r: 8 }} connectNulls />
                )}

                {shouldShowLine("broilerWithSkinConversion") && (
                  <Line type="monotone" dataKey="broilerWithSkinConversion" name="Broiler With Skin" stroke="#82ca9d" activeDot={{ r: 8 }} connectNulls />
                )}

                {shouldShowLine("broilerWithoutSkinConversion") && (
                  <Line type="monotone" dataKey="broilerWithoutSkinConversion" name="Broiler Without Skin" stroke="#ffc658" activeDot={{ r: 8 }} connectNulls />
                )}

                {/* Country Chicken Lines */}
                {shouldShowLine("countryMeatConversion") && (
                  <Line type="monotone" dataKey="countryMeatConversion" name="Country Meat" stroke="#ff8042" activeDot={{ r: 8 }} connectNulls />
                )}

                {shouldShowLine("countryWithSkinConversion") && (
                  <Line type="monotone" dataKey="countryWithSkinConversion" name="Country With Skin" stroke="#0088fe" activeDot={{ r: 8 }} connectNulls />
                )}

                {shouldShowLine("countryWithoutSkinConversion") && (
                  <Line type="monotone" dataKey="countryWithoutSkinConversion" name="Country Without Skin" stroke="#00C49F" activeDot={{ r: 8 }} connectNulls />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No history data available for chart visualization.</div>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p className="italic">Tip: Click on the legend items to toggle visibility of specific factors</p>
            <p className="mt-1">
              Showing data from {chartData[0]?.date || "N/A"} to {chartData[chartData.length - 1]?.date || "N/A"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionRatesHistoryChart;
