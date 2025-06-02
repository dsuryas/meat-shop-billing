import { useEffect, useState } from "react";
import { getAllConversionFactorHistory } from "../../utils/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";

const ConversionRatesHistoryChart = () => {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load history data from IndexedDB
    const loadHistoryData = async () => {
      try {
        setIsLoading(true);
        const data = await getAllConversionFactorHistory();
        setHistoryData(data);
        setError(null);
      } catch (err) {
        console.error("Error loading conversion factor history:", err);
        setError("Failed to load conversion factor history");
        setHistoryData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Factor History</CardTitle>
          <CardDescription>Loading history data...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading conversion factor history...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Factor History</CardTitle>
          <CardDescription>Error loading history</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Factor History</CardTitle>
        <CardDescription>Track changes to conversion factors over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyData.map((entry) => (
                <tr key={`${entry.id}-${entry.timestamp}`} className={entry.isCurrent ? "bg-blue-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{entry.name}</span>
                      <span className={`text-xs ${entry.category === "broiler" ? "text-blue-600" : "text-green-600"}`}>
                        {entry.category === "broiler" ? "Broiler" : "Country Chicken"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {entry.value}
                    {entry.isCurrent && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.modifiedBy || "System"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{entry.notes || "-"}</td>
                </tr>
              ))}

              {historyData.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No history data available.
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

export default ConversionRatesHistoryChart;
