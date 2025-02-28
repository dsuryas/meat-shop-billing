import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { getDailyClosings } from "../utils/storage";

const WeightLossHistory = () => {
  const closings = getDailyClosings();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate statistics using the appropriate weight loss value based on estimation method
  const getWeightLossStats = () => {
    if (!closings.length) return { average: 0, highest: 0, lowest: 0 };

    const weightLosses = closings.map((c) => Number(c.weightLoss || 0));
    const weightLossPercentages = closings.map((c) => Number(c.weightLossPercentage || 0));
    const birdLosses = closings.map((c) => Number(c.birdLoss || 0));

    return {
      average: {
        weight: weightLosses.reduce((a, b) => a + b, 0) / weightLosses.length,
        percentage: weightLossPercentages.reduce((a, b) => a + b, 0) / weightLossPercentages.length,
        birds: birdLosses.reduce((a, b) => a + b, 0) / birdLosses.length,
      },
      highest: {
        weight: Math.max(...weightLosses),
        percentage: Math.max(...weightLossPercentages),
        birds: Math.max(...birdLosses),
      },
      lowest: {
        weight: Math.min(...weightLosses),
        percentage: Math.min(...weightLossPercentages),
        birds: Math.min(...birdLosses),
      },
    };
  };

  const stats = getWeightLossStats();

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-blue-600 mb-1">Average Weight Loss</div>
            <div className="text-lg font-bold text-blue-700">{stats?.average?.weight?.toFixed(2)}kg</div>
            <div className="text-sm text-blue-600">{stats?.average?.percentage?.toFixed(2)}% of stock</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-amber-600 mb-1">Highest Weight Loss</div>
            <div className="text-lg font-bold text-amber-700">{stats?.highest?.weight?.toFixed(2)}kg</div>
            <div className="text-sm text-amber-600">{stats?.highest?.percentage?.toFixed(2)}% of stock</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-green-600 mb-1">Lowest Weight Loss</div>
            <div className="text-lg font-bold text-green-700">{stats?.lowest?.weight?.toFixed(2)}kg</div>
            <div className="text-sm text-green-600">{stats?.lowest?.percentage?.toFixed(2)}% of stock</div>
          </CardContent>
        </Card>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Overview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Loss</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birds</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {closings.map((closing, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(closing.date)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Expected: {Number(closing.expectedStock).toFixed(2)}kg</div>
                      <div>Actual: {Number(closing.actualStock).toFixed(2)}kg</div>
                      <div className="text-xs text-gray-400 mt-1">{closing.estimationMethod === "liveRate" ? "Live weight" : "Meat weight"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${Number(closing.weightLoss) > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                      >
                        {Number(closing.weightLoss).toFixed(2)}kg
                      </span>
                      <div className="mt-1 text-sm text-gray-500">{Number(closing.weightLossPercentage).toFixed(2)}% of stock</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="grid grid-cols-2 gap-2">
                        <div>Expected: {closing.expectedBirds}</div>
                        <div>Actual: {closing.actualBirds}</div>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${Number(closing.birdLoss) > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                        >
                          Loss: {closing.birdLoss} birds
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                {closings.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No weight loss data recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeightLossHistory;
