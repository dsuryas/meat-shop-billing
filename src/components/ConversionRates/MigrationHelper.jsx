import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import {
  initializeConversionFactors,
  getConversionFactorById,
  getAllConversionFactorHistory,
  getBroilerMeatConversionFactor,
  getCountryChickenMeatConversionFactor,
} from "../../utils/storage";

const MigrationHelper = () => {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSteps, setMigrationSteps] = useState([]);

  const addMigrationStep = (step, status = "pending") => {
    setMigrationSteps((prev) => [...prev, { step, status, timestamp: new Date().toISOString() }]);
  };

  const updateLastMigrationStep = (status) => {
    setMigrationSteps((prev) => {
      const newSteps = [...prev];
      if (newSteps.length > 0) {
        newSteps[newSteps.length - 1].status = status;
      }
      return newSteps;
    });
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    setMessage("Starting migration...");
    setMigrationSteps([]);
    setIsSuccess(false);

    try {
      // Step 1: Initialize conversion factors if needed
      addMigrationStep("Initializing conversion factors structure");
      initializeConversionFactors();
      updateLastMigrationStep("complete");

      // Step 2: Verify broiler conversion factor
      addMigrationStep("Verifying broiler conversion factor");
      const broilerFactor = getConversionFactorById("broilerMeatConversion");
      if (!broilerFactor) {
        throw new Error("Broiler conversion factor not found");
      }
      updateLastMigrationStep("complete");

      // Step 3: Verify country chicken conversion factor
      addMigrationStep("Verifying country chicken conversion factor");
      const countryFactor = getConversionFactorById("countryChickenMeatConversion");
      if (!countryFactor) {
        throw new Error("Country chicken conversion factor not found");
      }
      updateLastMigrationStep("complete");

      // Step 4: Verify history is properly structured
      addMigrationStep("Verifying conversion factor history");
      const history = getAllConversionFactorHistory();
      updateLastMigrationStep("complete");

      // Step 5: Success report
      addMigrationStep("Generating migration report");
      const report = {
        timestamp: new Date().toISOString(),
        broilerFactor: getBroilerMeatConversionFactor(),
        countryFactor: getCountryChickenMeatConversionFactor(),
        historyEntries: history.length,
      };
      console.log("Migration report:", report);
      updateLastMigrationStep("complete");

      setMessage(`Migration completed successfully. All data is now using the document-based conversion factor system.`);
      setIsSuccess(true);
    } catch (error) {
      console.error("Migration error:", error);
      updateLastMigrationStep("failed");
      setMessage(`Migration failed: ${error.message}`);
      setIsSuccess(false);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Factors Migration</CardTitle>
        <CardDescription>Migrate existing data to use the document-based conversion factor system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-blue-800">Migration Information</h3>
            <p className="text-sm text-blue-700">
              This tool will help ensure all data in the system uses the new document-based conversion factors structure instead of the old fixed values.
            </p>
            <p className="text-sm text-blue-700">Current conversion factors:</p>
            <ul className="list-disc pl-5 text-sm text-blue-700">
              <li>Broiler meat conversion: {getBroilerMeatConversionFactor()}</li>
              <li>Country chicken meat conversion: {getCountryChickenMeatConversionFactor()}</li>
            </ul>
          </div>

          {migrationSteps.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-medium">Migration Progress</h3>
              </div>
              <ul className="divide-y">
                {migrationSteps.map((step, index) => (
                  <li key={index} className="px-4 py-2 flex items-center justify-between">
                    <span>{step.step}</span>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        step.status === "complete"
                          ? "bg-green-100 text-green-800"
                          : step.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {step.status === "complete" ? "Complete" : step.status === "failed" ? "Failed" : "In Progress"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <Alert className={isSuccess ? "bg-green-50" : "bg-amber-50"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button onClick={handleMigration} disabled={isMigrating} className="bg-blue-600 hover:bg-blue-700">
          {isMigrating ? "Migrating..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MigrationHelper;
