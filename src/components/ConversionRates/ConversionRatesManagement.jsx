import { useState, useEffect, useContext } from "react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { getConversionFactors, getConversionFactorsByCategory, updateConversionFactor, initializeConversionFactors } from "../../utils/storage";
import MigrationHelper from "./MigrationHelper";
import ConversionRatesHistoryChart from "./ConversionRatesHistoryChart";
import ConversionRatesHistoryTable from "./ConversionRatesHistoryTable";
import { AuthContext } from "../../contexts/AuthContext";

// Default factor definitions - used as fallback if data is missing
const DEFAULT_BROILER_FACTORS = [
  {
    id: "broilerMeatConversion",
    name: "Broiler Meat Conversion",
    value: 1.45,
    description: "Live weight to meat weight ratio for broiler chicken",
    category: "broiler",
  },
  {
    id: "broilerWithSkinConversion",
    name: "Broiler With Skin Conversion",
    value: 1.25,
    description: "Live weight to with-skin weight ratio for broiler chicken",
    category: "broiler",
  },
  {
    id: "broilerWithoutSkinConversion",
    name: "Broiler Without Skin Conversion",
    value: 1.35,
    description: "Live weight to without-skin weight ratio for broiler chicken",
    category: "broiler",
  },
];

const DEFAULT_COUNTRY_FACTORS = [
  {
    id: "countryMeatConversion",
    name: "Country Chicken Meat Conversion",
    value: 1.65,
    description: "Live weight to meat weight ratio for country chicken",
    category: "country",
  },
  {
    id: "countryWithSkinConversion",
    name: "Country Chicken With Skin Conversion",
    value: 1.45,
    description: "Live weight to with-skin weight ratio for country chicken",
    category: "country",
  },
  {
    id: "countryWithoutSkinConversion",
    name: "Country Chicken Without Skin Conversion",
    value: 1.55,
    description: "Live weight to without-skin weight ratio for country chicken",
    category: "country",
  },
];

const ConversionRatesManagement = () => {
  const [conversionFactors, setConversionFactors] = useState([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("broiler");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get current user info from auth context
  const { currentUser } = useContext(AuthContext) || { currentUser: null };

  useEffect(() => {
    // Initialize factors if needed
    try {
      initializeConversionFactors();

      // Load factors from storage
      loadFactors();
    } catch (error) {
      console.error("Error initializing conversion factors:", error);
      setHasError(true);
      setIsLoading(false);

      // Set defaults if error occurs
      if (activeTab === "broiler") {
        setConversionFactors(DEFAULT_BROILER_FACTORS);
      } else {
        setConversionFactors(DEFAULT_COUNTRY_FACTORS);
      }
    }
  }, []);

  useEffect(() => {
    // Reload factors when active tab changes
    try {
      loadFactorsByCategory(activeTab);
    } catch (error) {
      console.error(`Error loading ${activeTab} factors:`, error);

      // Set defaults based on current tab
      if (activeTab === "broiler") {
        setConversionFactors(DEFAULT_BROILER_FACTORS);
      } else {
        setConversionFactors(DEFAULT_COUNTRY_FACTORS);
      }
    }
  }, [activeTab]);

  const loadFactors = () => {
    setIsLoading(true);
    try {
      const factors = getConversionFactors();
      if (!factors || factors.length === 0) {
        // If no factors found, use defaults
        setConversionFactors(DEFAULT_BROILER_FACTORS);
      } else {
        // Filter factors based on active tab
        const filteredFactors = factors.filter((f) => f.category === activeTab);
        if (filteredFactors.length > 0) {
          setConversionFactors(filteredFactors);
        } else {
          // If no factors found for this category, use defaults
          setConversionFactors(activeTab === "broiler" ? DEFAULT_BROILER_FACTORS : DEFAULT_COUNTRY_FACTORS);
        }
      }
      setHasError(false);
    } catch (error) {
      console.error("Error loading conversion factors:", error);
      setHasError(true);

      // Use defaults if error occurs
      setConversionFactors(activeTab === "broiler" ? DEFAULT_BROILER_FACTORS : DEFAULT_COUNTRY_FACTORS);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFactorsByCategory = (category) => {
    setIsLoading(true);
    try {
      const factors = getConversionFactorsByCategory(category);
      if (!factors || factors.length === 0) {
        // If no factors found, use defaults
        setConversionFactors(category === "broiler" ? DEFAULT_BROILER_FACTORS : DEFAULT_COUNTRY_FACTORS);
      } else {
        setConversionFactors(factors);
      }
      setHasError(false);
    } catch (error) {
      console.error(`Error loading ${category} factors:`, error);
      setHasError(true);

      // Use defaults if error occurs
      setConversionFactors(category === "broiler" ? DEFAULT_BROILER_FACTORS : DEFAULT_COUNTRY_FACTORS);
    } finally {
      setIsLoading(false);
    }
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

    if (isLoading) {
      setMessage("Please wait for factors to load before saving");
      setIsSuccess(false);
      return;
    }

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

    try {
      // Save each factor
      for (const factor of conversionFactors) {
        const updated = updateConversionFactor(factor.id, factor.value, username, notes.trim() || `Updated ${factor.name} conversion factor`);

        if (updated) {
          updatesApplied = true;
        }
      }

      if (updatesApplied) {
        setMessage("Conversion factors updated successfully!");
        setIsSuccess(true);
        setNotes(""); // Clear notes after successful update

        // Reload factors to get updated timestamps
        loadFactorsByCategory(activeTab);
      } else {
        setMessage("No changes were detected in the conversion factors.");
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Error saving conversion factors:", error);
      setMessage("Error saving conversion factors: " + error.message);
      setIsSuccess(false);
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
      const factorDate = new Date(factor.updatedAt || 0);
      return factorDate > latest ? factorDate : latest;
    }, new Date(0));

    // Return null if no real update time exists
    if (latestUpdate.getTime() === 0) return null;

    return latestUpdate;
  };

  const renderFactorForm = (category) => {
    if (isLoading) {
      return <div className="py-8 text-center text-gray-500">Loading conversion factors...</div>;
    }

    if (hasError) {
      return (
        <div className="py-8">
          <Alert className="bg-red-50">
            <AlertDescription>Error loading conversion factors. Using default values.</AlertDescription>
          </Alert>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">{conversionFactors.map((factor) => renderFactorInput(factor, category))}</div>
        </div>
      );
    }

    return (
      <>
        {conversionFactors.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No conversion factors found. Please reinitialize the system.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{conversionFactors.map((factor) => renderFactorInput(factor, category))}</div>
        )}
      </>
    );
  };

  const renderFactorInput = (factor, category) => {
    const colorClass = category === "broiler" ? "text-blue-700" : "text-green-700";

    return (
      <div key={factor.id} className="bg-white p-4 rounded-lg border">
        <div className="space-y-4">
          <div className="flex justify-between">
            <h3 className={`font-medium ${colorClass}`}>{factor.name}</h3>
            {factor.updatedAt && <span className="text-xs text-gray-500">Last updated: {new Date(factor.updatedAt).toLocaleString()}</span>}
          </div>

          <div className="space-y-2">
            <Input type="number" step="0.01" min="0.1" value={factor.value} onChange={(e) => handleInputChange(factor.id, e.target.value)} className="mt-1" />
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
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Conversion Factors Management</CardTitle>
          <CardDescription>Configure the conversion factors used throughout the application</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="broiler">Broiler Chicken</TabsTrigger>
              <TabsTrigger value="country">Country Chicken</TabsTrigger>
            </TabsList>

            <TabsContent value="broiler">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* Render broiler factors */}
                  {renderFactorForm("broiler")}

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
                  <Button type="submit" className="px-6" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Save Broiler Conversion Factors"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="country">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {/* Render country chicken factors */}
                  {renderFactorForm("country")}

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
                  <Button type="submit" className="px-6" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Save Country Chicken Conversion Factors"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2 mt-6">
            <h3 className="font-semibold text-blue-800">How Conversion Works</h3>
            <div className="text-sm text-blue-700">
              <p>
                <strong>Example:</strong> If conversion factor is 1.45 and live weight is 1.45kg, meat weight will be 1kg
              </p>
              <p className="mt-1">
                <strong>Formula:</strong> Processed Weight = Live Weight ÷ Conversion Factor
              </p>
              <p className="mt-2">
                <strong>Different conversion factors allow for:</strong>
              </p>
              <ul className="list-disc pl-5 mt-1">
                <li>More accurate pricing for different product types</li>
                <li>Accounting for different yields between broiler and country chicken</li>
                <li>Proper inventory management for each product type</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart and History */}
      <div className="mt-6 grid grid-cols-1 gap-6">
        <ConversionRatesHistoryChart />
        <ConversionRatesHistoryTable />
      </div>

      {/* Migration Helper */}
      <div className="mt-6">
        <MigrationHelper />
      </div>
    </>
  );
};

export default ConversionRatesManagement;
