import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

const DatabaseDiagnostic = ({ dbService, onRecoveryComplete }) => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Running database diagnostics...");

      // Get database info
      const dbInfo = await dbService.getDatabaseInfo();
      console.log("Database info:", dbInfo);

      // Test basic operations
      const tests = {
        canAccessUsers: false,
        canAccessConversionFactors: false,
        canAccessBills: false,
        canAccessDailySetup: false,
        userCount: 0,
        conversionFactorCount: 0,
        hasLocalStorageData: false,
      };

      // Check for localStorage data
      const hasLocalData = Object.keys(localStorage).some((key) => key.startsWith("meatShop_"));
      tests.hasLocalStorageData = hasLocalData;

      // Test users access
      try {
        const users = await dbService.users.getAll();
        tests.canAccessUsers = true;
        tests.userCount = users.length;
        console.log("Users test passed:", users.length, "users found");
      } catch (error) {
        console.error("Users test failed:", error);
        tests.canAccessUsers = false;
      }

      // Test conversion factors access
      try {
        const factors = await dbService.conversionFactors.getAll();
        tests.canAccessConversionFactors = true;
        tests.conversionFactorCount = factors.length;
        console.log("Conversion factors test passed:", factors.length, "factors found");
      } catch (error) {
        console.error("Conversion factors test failed:", error);
        tests.canAccessConversionFactors = false;
      }

      // Test bills access
      try {
        const bills = await dbService.bills.getAll();
        tests.canAccessBills = true;
        console.log("Bills test passed:", bills.length, "bills found");
      } catch (error) {
        console.error("Bills test failed:", error);
        tests.canAccessBills = false;
      }

      // Test daily setup access
      try {
        const setup = await dbService.dailySetup.getCurrent();
        tests.canAccessDailySetup = true;
        console.log("Daily setup test passed:", setup ? "Setup found" : "No setup");
      } catch (error) {
        console.error("Daily setup test failed:", error);
        tests.canAccessDailySetup = false;
      }

      setDiagnostics({
        dbInfo,
        tests,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Diagnostics failed:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverDatabase = async () => {
    setIsRecovering(true);
    setRecoveryMessage("Starting database recovery...");

    try {
      // First, try to migrate from localStorage if available
      if (diagnostics?.tests?.hasLocalStorageData) {
        setRecoveryMessage("Migrating data from localStorage...");
        await dbService.migration.migrateFromLocalStorage((message, progress) => {
          setRecoveryMessage(`Migration: ${message} (${progress}%)`);
        });
      }

      setRecoveryMessage("Recovering database structure...");
      await dbService.recoverDatabase();

      setRecoveryMessage("Testing recovered database...");
      await runDiagnostics();

      setRecoveryMessage("Database recovery completed successfully!");

      // Notify parent component
      if (onRecoveryComplete) {
        onRecoveryComplete();
      }
    } catch (error) {
      console.error("Recovery failed:", error);
      setError(`Recovery failed: ${error.message}`);
      setRecoveryMessage("Database recovery failed");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleClearAndReset = async () => {
    if (!window.confirm("This will completely reset the database and lose all data. Are you sure?")) {
      return;
    }

    setIsRecovering(true);
    setRecoveryMessage("Clearing database...");

    try {
      await dbService.operations.clearAllData();
      setRecoveryMessage("Reinitializing database...");
      await dbService.recoverDatabase();

      setRecoveryMessage("Testing reset database...");
      await runDiagnostics();

      setRecoveryMessage("Database reset completed successfully!");

      if (onRecoveryComplete) {
        onRecoveryComplete();
      }
    } catch (error) {
      console.error("Reset failed:", error);
      setError(`Reset failed: ${error.message}`);
      setRecoveryMessage("Database reset failed");
    } finally {
      setIsRecovering(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Running database diagnostics...</p>
        </CardContent>
      </Card>
    );
  }

  const allTestsPassed =
    diagnostics?.tests &&
    diagnostics.tests.canAccessUsers &&
    diagnostics.tests.canAccessConversionFactors &&
    diagnostics.tests.canAccessBills &&
    diagnostics.tests.canAccessDailySetup;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {recoveryMessage && (
            <Alert className="mb-4 bg-blue-50">
              <AlertDescription className="text-blue-800">{recoveryMessage}</AlertDescription>
            </Alert>
          )}

          {diagnostics && (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg ${allTestsPassed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <h3 className={`font-medium ${allTestsPassed ? "text-green-800" : "text-red-800"}`}>
                  Database Status: {allTestsPassed ? "Healthy" : "Issues Detected"}
                </h3>
                <p className={`text-sm mt-1 ${allTestsPassed ? "text-green-700" : "text-red-700"}`}>
                  {allTestsPassed ? "All database operations are working correctly." : "Some database operations are failing and may need recovery."}
                </p>
              </div>

              {/* Database Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Database Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span> {diagnostics.dbInfo.name || "Unknown"}
                  </div>
                  <div>
                    <span className="text-gray-600">Version:</span> {diagnostics.dbInfo.version || "Unknown"}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Object Stores:</span>
                    <div className="mt-1">
                      {diagnostics.dbInfo.objectStoreNames?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {diagnostics.dbInfo.objectStoreNames.map((store) => (
                            <span key={store} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {store}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-600">No object stores found</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-800">Operation Tests</h3>

                <div className={`flex items-center justify-between p-3 rounded ${diagnostics.tests.canAccessUsers ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm">Users Access</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{diagnostics.tests.canAccessUsers ? `${diagnostics.tests.userCount} users` : "Failed"}</span>
                    <span className={`w-3 h-3 rounded-full ${diagnostics.tests.canAccessUsers ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded ${diagnostics.tests.canAccessConversionFactors ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm">Conversion Factors Access</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">
                      {diagnostics.tests.canAccessConversionFactors ? `${diagnostics.tests.conversionFactorCount} factors` : "Failed"}
                    </span>
                    <span className={`w-3 h-3 rounded-full ${diagnostics.tests.canAccessConversionFactors ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded ${diagnostics.tests.canAccessBills ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm">Bills Access</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{diagnostics.tests.canAccessBills ? "Working" : "Failed"}</span>
                    <span className={`w-3 h-3 rounded-full ${diagnostics.tests.canAccessBills ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>

                <div className={`flex items-center justify-between p-3 rounded ${diagnostics.tests.canAccessDailySetup ? "bg-green-50" : "bg-red-50"}`}>
                  <span className="text-sm">Daily Setup Access</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">{diagnostics.tests.canAccessDailySetup ? "Working" : "Failed"}</span>
                    <span className={`w-3 h-3 rounded-full ${diagnostics.tests.canAccessDailySetup ? "bg-green-500" : "bg-red-500"}`}></span>
                  </div>
                </div>

                {diagnostics.tests.hasLocalStorageData && (
                  <div className="flex items-center justify-between p-3 rounded bg-yellow-50">
                    <span className="text-sm">LocalStorage Data Detected</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-700">Available for migration</span>
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={runDiagnostics} variant="outline" disabled={isRecovering}>
                  Rerun Diagnostics
                </Button>

                {!allTestsPassed && (
                  <Button onClick={handleRecoverDatabase} disabled={isRecovering} className="bg-blue-600 hover:bg-blue-700">
                    {isRecovering ? "Recovering..." : "Recover Database"}
                  </Button>
                )}

                <Button onClick={handleClearAndReset} disabled={isRecovering} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                  {isRecovering ? "Resetting..." : "Clear & Reset"}
                </Button>
              </div>

              <div className="text-xs text-gray-500 pt-2">Last check: {new Date(diagnostics.timestamp).toLocaleString()}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseDiagnostic;
