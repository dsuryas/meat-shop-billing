import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Plus } from "lucide-react";

// Table header component
const TableHeader = () => (
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Date
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Paper Rate
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Shop Rate
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Live Chicken
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        With Skin
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Chopped
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Country Chicken
      </th>
    </tr>
  </thead>
);

const PriceManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [prices, setPrices] = useState({
    paperRate: "",
    retailRate: "",
    productPrices: {
      liveChicken: "",
      chickenWithSkin: "",
      choppedChicken: "",
      countryChicken: "",
    },
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load price history from localStorage
    const history = localStorage.getItem("meatShop_priceHistory");
    if (history) {
      setPriceHistory(JSON.parse(history));
    }
  }, []);

  const handlePriceChange = (field, value, isProduct = false) => {
    setPrices((prev) => ({
      ...prev,
      ...(isProduct
        ? {
            productPrices: {
              ...prev.productPrices,
              [field]: value,
            },
          }
        : { [field]: value }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create new price record
    const priceRecord = {
      ...prices,
      date: new Date().toISOString(),
    };

    // Update price history
    const updatedHistory = [priceRecord, ...priceHistory];
    localStorage.setItem(
      "meatShop_priceHistory",
      JSON.stringify(updatedHistory)
    );
    setPriceHistory(updatedHistory);

    // Update today's setup
    const todaySetup = localStorage.getItem("meatShop_dailySetup");
    if (todaySetup) {
      const parsed = JSON.parse(todaySetup);
      const updated = {
        ...parsed,
        ...prices,
      };
      localStorage.setItem("meatShop_dailySetup", JSON.stringify(updated));
    }

    setMessage("Prices added successfully!");
    setShowForm(false);
    setPrices({
      paperRate: "",
      retailRate: "",
      productPrices: {
        liveChicken: "",
        chickenWithSkin: "",
        choppedChicken: "",
        countryChicken: "",
      },
    });
    setTimeout(() => setMessage(""), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Price Button and Message */}
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Today's Price
        </Button>
        {message && (
          <Alert className="w-auto">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Price Input Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Today's Prices</CardTitle>
            <CardDescription>Enter new pricing details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Paper Rate (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.paperRate}
                    onChange={(e) =>
                      handlePriceChange("paperRate", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Shop Rate (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.productPrices.choppedChicken}
                    onChange={(e) => {
                      // Update both shop rate and chopped chicken rate
                      const value = e.target.value;
                      setPrices((prev) => ({
                        ...prev,
                        retailRate: value,
                        productPrices: {
                          ...prev.productPrices,
                          choppedChicken: value,
                        },
                      }));
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Live Chicken (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.productPrices.liveChicken}
                    onChange={(e) =>
                      handlePriceChange("liveChicken", e.target.value, true)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Chicken with Skin (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.productPrices.chickenWithSkin}
                    onChange={(e) =>
                      handlePriceChange("chickenWithSkin", e.target.value, true)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Chopped Chicken (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.productPrices.choppedChicken}
                    className="mt-1 bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Country Chicken (₹/kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={prices.productPrices.countryChicken}
                    onChange={(e) =>
                      handlePriceChange("countryChicken", e.target.value, true)
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Save Prices
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Historical Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>
            Historical record of all price changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader />
              <tbody className="bg-white divide-y divide-gray-200">
                {priceHistory.map((record, index) => (
                  <tr key={index} className={index === 0 ? "bg-blue-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.paperRate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.productPrices.choppedChicken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.productPrices.liveChicken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.productPrices.chickenWithSkin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.productPrices.choppedChicken}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{record.productPrices.countryChicken}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceManagement;
