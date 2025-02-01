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
      const meatLossPercent =
        (Number(c.weightLoss) /
          (Number(c.expectedStock) * MEAT_CONVERSION_FACTOR)) *
        100;
      return sum + meatLossPercent;
    }, 0);

    const totalLiveLossPercent = closings.reduce((sum, c) => {
      const liveLossPercent =
        (Number(c.weightLoss) / Number(c.expectedStock)) * 100;
      return sum + liveLossPercent;
    }, 0);

    return {
      meatLossPercent: totalMeatLossPercent / closings.length,
      liveLossPercent: totalLiveLossPercent / closings.length,
    };
  };

  const getExtremes = () => {
    if (closings.length === 0) return null;

    const lossPercentages = closings.map((c) => ({
      meatLoss:
        (Number(c.weightLoss) /
          (Number(c.expectedStock) * MEAT_CONVERSION_FACTOR)) *
        100,
      liveLoss: (Number(c.weightLoss) / Number(c.expectedStock)) * 100,
    }));

    return {
      highest: {
        meatLoss: Math.max(...lossPercentages.map((l) => l.meatLoss)),
        liveLoss: Math.max(...lossPercentages.map((l) => l.liveLoss)),
      },
      lowest: {
        meatLoss: Math.min(...lossPercentages.map((l) => l.meatLoss)),
        liveLoss: Math.min(...lossPercentages.map((l) => l.liveLoss)),
      },
    };
  };

  const averages = calculateAverages();
  const extremes = getExtremes();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Operations Statistics</CardTitle>
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
                    Weight Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loss (Meat/Live)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loss % (Meat/Live)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Birds Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {closings.map((closing, index) => {
                  const meatLoss =
                    Number(closing.weightLoss) / MEAT_CONVERSION_FACTOR;
                  const liveLoss = Number(closing.weightLoss);
                  const meatLossPercent =
                    (meatLoss / Number(closing.expectedStock)) * 100;
                  const liveLossPercent =
                    (liveLoss /
                      (Number(closing.expectedStock) *
                        MEAT_CONVERSION_FACTOR)) *
                    100;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(closing.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {closing.estimationMethod === "liveRate"
                          ? "Live"
                          : "Meat"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Number(closing.expectedStock).toFixed(2)}kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Number(closing.actualStock).toFixed(2)}kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{closing.meatWeightLoss}kg meat</div>
                        <div>{closing.liveWeightLoss}kg live</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{closing.meatWeightLossPercentage}% meat</div>
                        <div>{closing.liveWeightLossPercentage}% live</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Actual: {closing.actualBirds}</div>
                        <div>
                          Loss: {closing.birdLoss} ({closing.birdLossPercentage}
                          %)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          Est: ₹{Number(closing.estimatedEarnings).toFixed(2)}
                        </div>
                        <div>
                          Act: ₹{Number(closing.actualEarnings).toFixed(2)}
                        </div>
                        <div>
                          Disc: ₹{Number(closing.totalDiscounts).toFixed(2)}
                        </div>
                        <div>Exp: ₹{Number(closing.expenses).toFixed(2)}</div>
                        <div className="text-green-600 font-medium">
                          Net: ₹{Number(closing.netEarnings).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-600 mb-1">Average Loss</div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-blue-700">
                {averages?.meatLossPercent.toFixed(2)}% meat
              </div>
              <div className="text-lg font-bold text-blue-700">
                {averages?.liveLossPercent.toFixed(2)}% live
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-sm text-amber-600 mb-1">Highest Loss</div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-amber-700">
                {extremes?.highest.meatLoss.toFixed(2)}% meat
              </div>
              <div className="text-lg font-bold text-amber-700">
                {extremes?.highest.liveLoss.toFixed(2)}% live
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="text-sm text-green-600 mb-1">Lowest Loss</div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-green-700">
                {extremes?.lowest.meatLoss.toFixed(2)}% meat
              </div>
              <div className="text-lg font-bold text-green-700">
                {extremes?.lowest.liveLoss.toFixed(2)}% live
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
