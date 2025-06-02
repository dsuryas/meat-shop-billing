import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Calendar, DollarSign, ShoppingBag } from "lucide-react";
import { getDailyClosings } from "../utils/storage";

const HistoricalDataTable = ({ onViewDay }) => {
  const [closings, setClosings] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    loadClosings();
  }, []);

  const loadClosings = async () => {
    const allClosings = await getDailyClosings();
    setClosings(allClosings || []);
    setTotalPages(Math.ceil((allClosings?.length || 0) / itemsPerPage));
  };

  const goToPage = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const getCurrentPageData = () => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return closings.slice(start, end);
  };

  const displayAmount = (amount) => {
    return `₹${Number(amount).toFixed(2)}`;
  };

  if (closings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">No historical data available yet. Close a day to see records here.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Historical Data</span>
          <div className="flex items-center space-x-2 text-sm">
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-gray-700">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Information</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Loss</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getCurrentPageData().map((dayData, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                      <div className="text-sm font-medium text-gray-900">{new Date(dayData.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(dayData.date).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ShoppingBag className="mr-2 h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-900">Initial: {Number(dayData.expectedStock).toFixed(2)}kg</div>
                        <div className="text-sm text-gray-900">Final: {Number(dayData.actualStock).toFixed(2)}kg</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Birds: {dayData.expectedBirds} → {dayData.actualBirds}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="mr-2 h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-900">Est: {displayAmount(dayData.estimatedEarnings)}</div>
                        <div className="text-sm text-gray-900">Act: {displayAmount(dayData.actualEarnings)}</div>
                        <div className="text-sm font-medium text-green-600 mt-1">Net: {displayAmount(dayData.netEarnings)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{Number(dayData.weightLoss).toFixed(2)}kg</div>
                      <div className="text-sm text-gray-500">({Number(dayData.weightLossPercentage).toFixed(2)}%)</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => onViewDay(dayData)}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {Math.min(closings.length, currentPage * itemsPerPage + 1)} to {Math.min(closings.length, (currentPage + 1) * itemsPerPage)} of{" "}
            {closings.length} entries
          </div>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => goToPage(0)} disabled={currentPage === 0}>
              First
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages - 1}>
              Next
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToPage(totalPages - 1)} disabled={currentPage === totalPages - 1}>
              Last
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricalDataTable;
