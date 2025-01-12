import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

const PriceManagement = () => {
  const [prices, setPrices] = useState({
    retail: {
      liveChicken: "",
      chickenWithSkin: "",
      choppedChicken: "",
      countryChicken: "",
    },
    wholesale: {
      liveChicken: "",
      chickenWithSkin: "",
      choppedChicken: "",
      countryChicken: "",
    },
  });
  const [message, setMessage] = useState("");

  const handlePriceChange = (type, item, value) => {
    setPrices((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [item]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically save to a backend
    setMessage("Prices updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Management</CardTitle>
        <CardDescription>
          Set retail and wholesale prices for different products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Retail Prices */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Retail Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Live Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.retail.liveChicken}
                  onChange={(e) =>
                    handlePriceChange("retail", "liveChicken", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Chicken with Skin (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.retail.chickenWithSkin}
                  onChange={(e) =>
                    handlePriceChange(
                      "retail",
                      "chickenWithSkin",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Chopped Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.retail.choppedChicken}
                  onChange={(e) =>
                    handlePriceChange(
                      "retail",
                      "choppedChicken",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Country Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.retail.countryChicken}
                  onChange={(e) =>
                    handlePriceChange(
                      "retail",
                      "countryChicken",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Wholesale Prices */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Wholesale Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Live Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.wholesale.liveChicken}
                  onChange={(e) =>
                    handlePriceChange(
                      "wholesale",
                      "liveChicken",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Chicken with Skin (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.wholesale.chickenWithSkin}
                  onChange={(e) =>
                    handlePriceChange(
                      "wholesale",
                      "chickenWithSkin",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Chopped Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.wholesale.choppedChicken}
                  onChange={(e) =>
                    handlePriceChange(
                      "wholesale",
                      "choppedChicken",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm">Country Chicken (per kg)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={prices.wholesale.countryChicken}
                  onChange={(e) =>
                    handlePriceChange(
                      "wholesale",
                      "countryChicken",
                      e.target.value
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full">
            Update Prices
          </Button>
        </form>

        {message && (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceManagement;
