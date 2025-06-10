import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronRight } from "lucide-react";

const BillingOptions = ({ onSelectOption }) => {
  const [additionalProducts, setAdditionalProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdditionalProducts();
  }, []);

  const loadAdditionalProducts = async () => {
    try {
      setIsLoading(true);

      // Check if we're using IndexedDB or localStorage
      // Try IndexedDB first, fallback to localStorage
      let products = [];

      try {
        // Try to get from IndexedDB if available
        if (window.indexedDB) {
          // This would need to be updated to use the dbService if products are stored in IndexedDB
          // For now, fallback to localStorage
          const localProducts = localStorage.getItem("meatShop_products");
          if (localProducts) {
            const allProducts = JSON.parse(localProducts);
            products = allProducts.filter((p) => p.isActive);
          }
        } else {
          // Fallback to localStorage
          const localProducts = localStorage.getItem("meatShop_products");
          if (localProducts) {
            const allProducts = JSON.parse(localProducts);
            products = allProducts.filter((p) => p.isActive);
          }
        }
      } catch (error) {
        console.error("Error loading additional products:", error);
        products = [];
      }

      setAdditionalProducts(products);
    } catch (error) {
      console.error("Error in loadAdditionalProducts:", error);
      setAdditionalProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const baseOptions = [
    {
      id: "retail",
      name: "Retail Broiler",
      description: "Regular retail chicken sales",
      type: "base",
    },
    {
      id: "wholesale",
      name: "Wholesale Broiler",
      description: "Bulk broiler orders and wholesale rates",
      type: "base",
    },
    {
      id: "countryChicken",
      name: "Country Chicken",
      description: "Naatu Kozhi sales (live, with skin, and meat)",
      type: "base",
    },
  ];

  const handleOptionSelect = (option) => {
    if (typeof onSelectOption === "function") {
      onSelectOption(option);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Broiler Options with blue color scheme */}
        <Card
          className="hover:border-blue-500 cursor-pointer transition-colors border-blue-200 hover:shadow-md"
          onClick={() => handleOptionSelect(baseOptions[0])}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[0].name}
              <ChevronRight className="h-5 w-5 text-blue-500" />
            </CardTitle>
            <CardDescription>{baseOptions[0].description}</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="hover:border-blue-500 cursor-pointer transition-colors border-blue-200 hover:shadow-md"
          onClick={() => handleOptionSelect(baseOptions[1])}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[1].name}
              <ChevronRight className="h-5 w-5 text-blue-500" />
            </CardTitle>
            <CardDescription>{baseOptions[1].description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Country Chicken Option with green color scheme */}
        <Card
          className="hover:border-green-500 cursor-pointer transition-colors border-green-200 hover:shadow-md"
          onClick={() => handleOptionSelect(baseOptions[2])}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[2].name}
              <ChevronRight className="h-5 w-5 text-green-500" />
            </CardTitle>
            <CardDescription>{baseOptions[2].description}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Additional Product Options */}
      {additionalProducts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Additional Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:border-purple-500 cursor-pointer transition-colors border-purple-200 hover:shadow-md"
                onClick={() =>
                  handleOptionSelect({
                    type: "additional",
                    ...product,
                    description: "Additional Product",
                  })
                }
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {product.name}
                    <ChevronRight className="h-5 w-5 text-purple-500" />
                  </CardTitle>
                  <CardDescription>
                    Additional Product
                    {product.retailPrice && <span className="block text-sm text-purple-600 mt-1">Retail: ₹{Number(product.retailPrice).toFixed(2)}/kg</span>}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">How to use:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • <strong>Retail Broiler:</strong> For individual customer sales at retail prices
          </li>
          <li>
            • <strong>Wholesale Broiler:</strong> For bulk orders and wholesale pricing
          </li>
          <li>
            • <strong>Country Chicken:</strong> For traditional country chicken (Naatu Kozhi) sales
          </li>
          {additionalProducts.length > 0 && (
            <li>
              • <strong>Additional Products:</strong> For specialty items and custom products
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default BillingOptions;
