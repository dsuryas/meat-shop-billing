import React, { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { getConversionFactors, updateConversionFactor, initializeConversionFactors } from "../../utils/storage";
import MigrationHelper from "./MigrationHelper";
import ConversionRatesHistory from "./ConversionRatesHistory";
import ConversionRatesChart from "./ConversionRatesChart";
import { AuthContext } from "../../contexts/AuthContext";

const ConversionRatesManagement = () => {
  const [conversionFactors, setConversionFactors] = useState([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Get current user info from auth context
  const { currentUser } = useContext(AuthContext) || { currentUser: null };

  useEffect(() => {
    // Initialize factors if needed
    initializeConversionFactors();

    // Load factors from storage
    loadFactors();
  }, []);

  const loadFactors = () => {
    const factors = getConversionFactors();
    setConversionFactors(factors);
  };

  const handleInputChange = (id, value) => {
    // Validate input is a positive number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      return;
    }

    // Update only the value in the state
    setConversionFactors((prev) => prev.map((factor) => (factor.id === id ? { ...factor, value: numValue } : factor)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all values
    for (const factor of conversionFactors) {
      if (isNaN(parseFloat(factor.value)) || parseFloat(factor.value) <= 0) {
        setMessage(`Invalid value for ${factor.name}. Please enter a positive number.`);
        setIsSuccess(false);
        return;
      }
    }

    // Get username for history tracking
    const username = currentUser?.username || "Admin";

    // Track if any updates were made
    let updatesApplied = false;

    // Save each factor
    for (const factor of conversionFactors) {
      const updated = updateConversionFactor(factor.id, factor.value, username, notes.trim() || "Updated conversion factor");

      if (updated) {
        updatesApplied = true;
      }
    }

    if (updatesApplied) {
      setMessage("Conversion factors updated successfully!");
      setIsSuccess(true);
      setNotes(""); // Clear notes after successful update

      // Reload factors to get updated timestamps
      loadFactors();
    } else {
      setMessage("No changes were detected in the conversion factors.");
      setIsSuccess(true);
    }

    // Clear success message after a few seconds
    setTimeout(() => {
      if (isSuccess) {
        setMessage("");
      }
    }, 3000);
  };

  // Get most recent update time for any factor
  const getLastUpdateTime = () => {
    if (!conversionFactors || conversionFactors.length === 0) return null;

    // Find latest updatedAt timestamp
    const latestUpdate = conversionFactors.reduce((latest, factor) => {
      const factorDate = new Date(factor.updatedAt);
      return factorDate > latest ? factorDate : latest;
    }, new Date(0));

    return latestUpdate;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Conversion Factors Management</CardTitle>
          <CardDescription>Configure the conversion factors used throughout the application</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {/* Render each conversion factor */}
              {conversionFactors.map((factor) => (
                <div key={factor.id} className="bg-white p-4 rounded-lg border">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-blue-700">{factor.name}</h3>
                      {factor.updatedAt && <span className="text-xs text-gray-500">Last updated: {new Date(factor.updatedAt).toLocaleString()}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        value={factor.value}
                        onChange={(e) => handleInputChange(factor.id, e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500">{factor.description}</p>
                    </div>

                    {factor.history && factor.history.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Previous value: {factor.history[0].value}
                        (changed {new Date(factor.history[0].timestamp).toLocaleDateString()})
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Notes for change tracking */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Change Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for changing conversion factors"
                  className="w-full px-3 py-2 border rounded-md h-24"
                />
                <p className="text-xs text-gray-500">This will be recorded in the history for reference.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-blue-800">How Conversion Works</h3>
                <div className="text-sm text-blue-700">
                  <p>
                    <strong>Example:</strong> If conversion factor is 1.45 and live weight is 1.45kg, meat weight will be 1kg
                  </p>
                  <p className="mt-1">
                    <strong>Formula:</strong> Meat Weight = Live Weight ÷ Conversion Factor
                  </p>
                  <p className="mt-1">
                    <strong>Current factors:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {conversionFactors.map((factor) => (
                        <li key={factor.id}>
                          {factor.name}: {factor.value}
                        </li>
                      ))}
                    </ul>
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <Alert className={isSuccess ? "bg-green-50" : "bg-red-50"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-4">
              <div className="flex-1 text-xs text-gray-500 my-auto">
                {getLastUpdateTime() && <span>Last updated: {getLastUpdateTime().toLocaleString()}</span>}
              </div>
              <Button type="submit" className="px-6">
                Save Conversion Factors
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Chart and History */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConversionRatesChart />
        <ConversionRatesHistory />
      </div>

      {/* Migration Helper */}
      <div className="mt-6">
        <MigrationHelper />
      </div>
    </>
  );
};

export default ConversionRatesManagement;
