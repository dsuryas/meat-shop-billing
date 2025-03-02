import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { getAllConversionFactorHistory } from "../../utils/storage";

const ConversionRatesHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [filter, setFilter] = useState("all"); // all, broiler, country

  useEffect(() => {
    // Load conversion rates history from storage
    loadHistory();
  }, []);

  const loadHistory = () => {
    const allHistory = getAllConversionFactorHistory();
    setHistory(allHistory);
    applyFilter(allHistory, filter);
  };

  const applyFilter = (historyData, filterType) => {
    if (filterType === "all") {
      setFilteredHistory(historyData);
    } else if (filterType === "broiler") {
      setFilteredHistory(historyData.filter((item) => item.id === "broilerMeatConversion"));
    } else if (filterType === "country") {
      setFilteredHistory(historyData.filter((item) => item.id === "countryChickenMeatConversion"));
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilter(history, newFilter);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Factors History</CardTitle>
        <CardDescription>Historical record of all changes to conversion factors</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1 text-sm rounded-md ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            All Factors
          </button>
          <button
            onClick={() => handleFilterChange("broiler")}
            className={`px-3 py-1 text-sm rounded-md ${filter === "broiler" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Broiler Only
          </button>
          <button
            onClick={() => handleFilterChange("country")}
            className={`px-3 py-1 text-sm rounded-md ${filter === "country" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            Country Chicken Only
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Modified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record, index) => (
                  <tr key={`${record.id}-${record.timestamp}`} className={record.isCurrent ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(record.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.value}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.isCurrent ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Current</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Historical</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.modifiedBy || "System"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{record.notes || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No history found. Changes to conversion factors will be recorded here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionRatesHistory;
