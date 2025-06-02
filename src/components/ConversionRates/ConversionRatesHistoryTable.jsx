import { useEffect, useState } from "react";
import { getAllConversionFactorHistory } from "../../utils/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

/**
 * ConversionRatesHistory component displays a table of historical conversion factor changes
 */
const ConversionRatesHistoryTable = () => {
  const [historyData, setHistoryData] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all"); // all, broiler, country
  const [typeFilter, setTypeFilter] = useState("all"); // all, meat, withSkin, withoutSkin

  useEffect(() => {
    // Load history data
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    const allHistory = await getAllConversionFactorHistory();
    setHistoryData(allHistory);
  };

  const handleCategoryFilterChange = (newFilter) => {
    setCategoryFilter(newFilter);
  };

  const handleTypeFilterChange = (newFilter) => {
    setTypeFilter(newFilter);
  };

  // Filter history data based on selected filters
  const filteredHistory = historyData?.filter((entry) => {
    // Apply category filter
    if (categoryFilter !== "all") {
      if (categoryFilter === "broiler" && !entry.id.startsWith("broiler")) return false;
      if (categoryFilter === "country" && !entry.id.startsWith("country")) return false;
    }

    // Apply type filter
    if (typeFilter !== "all") {
      if (typeFilter === "meat" && !entry.id.includes("Meat")) return false;
      if (typeFilter === "withSkin" && !entry.id.includes("WithSkin")) return false;
      if (typeFilter === "withoutSkin" && !entry.id.includes("WithoutSkin")) return false;
    }

    return true;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Conversion Factor History</CardTitle>
        <CardDescription>Historical record of all conversion factor changes</CardDescription>
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

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Factor</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Value</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Changed By</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry, index) => (
                  <tr key={`${entry.id}-${entry.timestamp}-${index}`} className={`border-b ${entry.isCurrent ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-xs text-gray-500">{entry.id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.value}</td>
                    <td className="px-4 py-3 text-sm">{entry.modifiedBy || "System"}</td>
                    <td className="px-4 py-3 text-sm">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{entry.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No history data available matching the selected filters.</div>
        )}

        {historyData?.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p>
              Showing {filteredHistory.length} of {historyData.length} history entries
              {categoryFilter !== "all" && ` (filtered by ${categoryFilter})`}
              {typeFilter !== "all" && ` (filtered by ${typeFilter})`}
            </p>
            <p className="mt-1 italic">Current values are highlighted in blue</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionRatesHistoryTable;
