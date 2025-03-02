import React from "react";
import { Button } from "./ui/button";
import { getDailySetup } from "../utils/storage";
import { formatDate } from "../utils/DashboardUtils";

const DayStatusBanner = ({ viewingClosedDay, closedDayData, onStartNewDay, onToggleDayView }) => {
  // Don't show banner if not viewing closed day
  if (!viewingClosedDay) return null;

  return (
    <div className="bg-amber-50 p-4 mb-6 rounded-lg border border-amber-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-amber-800">Viewing Closed Day: {closedDayData ? formatDate(closedDayData.date) : "Unknown Date"}</h2>
          <p className="text-sm text-amber-700">This day has been closed. You are viewing historical data.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => onStartNewDay(new Date().toISOString().split("T")[0])} className="bg-white">
            Start New Day
          </Button>

          {getDailySetup() && (
            <Button variant="outline" onClick={onToggleDayView} className="bg-white">
              View Current Day
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayStatusBanner;
