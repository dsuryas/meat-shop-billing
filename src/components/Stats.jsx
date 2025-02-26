import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { getDailyClosings, MEAT_CONVERSION_FACTOR } from "../utils/storage";

const Stats = () => {
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

  const calculateAverages = () => {
    if (closings.length === 0) return null;

    const totalMeatLossPercent = closings.reduce((sum, c) => {
      return sum + Number(c.weightLossPercentage || 0);
    }, 0);

    const totalBirdLossPercent = closings.reduce((sum, c) => {
      return sum + Number(c.birdLossPercentage || 0);
    }, 0);

    const totalEarnings = closings.reduce((sum, c) => sum + Number(c.netEarnings || 0), 0);
    const totalWeightLoss = closings.reduce((sum, c) => sum + Number(c.weightLoss || 0), 0);

    return {
      weightLossPercent: totalMeatLossPercent / closings.length,
      birdLossPercent: totalBirdLossPercent / closings.length,
      avgEarnings: totalEarnings / closings.length,
      avgWeightLoss: totalWeightLoss / closings.length,
    };
  };

  const getExtremes = () => {
    if (closings.length === 0) return null;

    const lossPercentages = closings.map((c) => Number(c.weightLossPercentage || 0));
    const weightLosses = closings.map((c) => Number(c.weightLoss || 0));
    const earnings = closings.map((c) => Number(c.netEarnings || 0));

    return {
      highest: {
        lossPercent: Math.max(...lossPercentages),
        weightLoss: Math.max(...weightLosses),
        earnings: Math.max(...earnings),
      },
      lowest: {
        lossPercent: Math.min(...lossPercentages),
        weightLoss: Math.min(...weightLosses),
        earnings: Math.min(...earnings),
      },
    };
  };

  const averages = calculateAverages();
  const extremes = getExtremes();

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-blue-600 mb-1">Average Weight Loss</div>
            <div className="text-lg font-bold text-blue-700">
              {averages?.avgWeightLoss.toFixed(2)}kg ({averages?.weightLossPercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-amber-600 mb-1">Highest Weight Loss</div>
            <div className="text-lg font-bold text-amber-700">
              {extremes?.highest.weightLoss.toFixed(2)}kg ({extremes?.highest.lossPercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-green-600 mb-1">Lowest Weight Loss</div>
            <div className="text-lg font-bold text-green-700">
              {extremes?.lowest.weightLoss.toFixed(2)}kg ({extremes?.lowest.lossPercent.toFixed(2)}%)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm text-purple-600 mb-1">Average Earnings</div>
            <div className="text-lg font-bold text-purple-700">₹{averages?.avgEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Loss</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birds</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial</th>
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
                      <div className="text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${Number(closing.weightLoss) > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                        >
                          {Number(closing.weightLoss).toFixed(2)}kg
                        </span>
                        <span className="ml-2">({Number(closing.weightLossPercentage).toFixed(2)}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Expected: {closing.expectedBirds}</div>
                      <div>Actual: {closing.actualBirds}</div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${Number(closing.birdLoss) > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}`}
                        >
                          Loss: {closing.birdLoss} ({closing.birdLossPercentage}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="grid grid-cols-2 gap-x-4 text-sm">
                        <div>Est: ₹{Number(closing.estimatedEarnings).toFixed(2)}</div>
                        <div>Act: ₹{Number(closing.actualEarnings).toFixed(2)}</div>
                        <div>Disc: ₹{Number(closing.totalDiscounts).toFixed(2)}</div>
                        <div>Exp: ₹{Number(closing.expenses).toFixed(2)}</div>
                      </div>
                      <div className="mt-1 text-green-600 font-medium border-t border-green-200 pt-1">Net: ₹{Number(closing.netEarnings).toFixed(2)}</div>
                    </td>
                  </tr>
                ))}
                {closings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No data available
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

export default Stats;
