import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { getDailyClosings } from "../utils/storage";

const WeightLossHistory = () => {
  const closings = getDailyClosings();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate statistics using the appropriate weight loss value based on estimation method
  const getWeightLossStats = () => {
    if (!closings.length) return { average: 0, highest: 0, lowest: 0 };

    const weightLosses = closings.map((c) => Number(c.weightLoss));
    return {
      average: weightLosses.reduce((a, b) => a + b, 0) / weightLosses.length,
      highest: Math.max(...weightLosses),
      lowest: Math.min(...weightLosses),
    };
  };

  const stats = getWeightLossStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weight Loss History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Birds
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Birds
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {closings.map((closing, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(closing.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(closing.expectedStock).toFixed(2)}kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(closing.actualStock).toFixed(2)}kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                        ${
                          Number(closing.weightLoss) > 0
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {Number(closing.weightLoss).toFixed(2)}kg
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {closing.estimationMethod === "liveRate"
                        ? "Live weight"
                        : "Meat weight"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {closing.expectedBirds}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {closing.actualBirds}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {closings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">
                  No closing records found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-600 mb-1">Average Weight Loss</div>
            <div className="text-xl font-bold text-red-700">
              {stats.average.toFixed(2)}kg
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-sm text-amber-600 mb-1">
              Highest Weight Loss
            </div>
            <div className="text-xl font-bold text-amber-700">
              {stats.highest.toFixed(2)}kg
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="text-sm text-green-600 mb-1">
              Lowest Weight Loss
            </div>
            <div className="text-xl font-bold text-green-700">
              {stats.lowest.toFixed(2)}kg
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeightLossHistory;
