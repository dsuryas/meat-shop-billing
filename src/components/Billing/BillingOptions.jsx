import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";

const BillingOptions = ({ onSelectOption }) => {
  const [additionalProducts, setAdditionalProducts] = useState([]);

  useEffect(() => {
    // Load additional products from localStorage
    const products = localStorage.getItem("meatShop_products");
    if (products) {
      const activeProducts = JSON.parse(products).filter((p) => p.isActive);
      setAdditionalProducts(activeProducts);
    }
  }, []);

  const baseOptions = [
    {
      id: "retail",
      name: "Retail Broiler",
      description: "Regular retail chicken sales",
    },
    {
      id: "wholesale",
      name: "Wholesale Broiler",
      description: "Bulk broiler orders and wholesale rates",
    },
    {
      id: "countryChicken",
      name: "Country Chicken",
      description: "Naatu Kozhi sales (retail and wholesale)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Broiler Options with blue color scheme */}
        <Card
          className="hover:border-blue-500 cursor-pointer transition-colors border-blue-200"
          onClick={() => onSelectOption({ type: "base", ...baseOptions[0] })}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[0].name}
              <ChevronRight className="h-5 w-5" />
            </CardTitle>
            <CardDescription>{baseOptions[0].description}</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="hover:border-blue-500 cursor-pointer transition-colors border-blue-200"
          onClick={() => onSelectOption({ type: "base", ...baseOptions[1] })}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[1].name}
              <ChevronRight className="h-5 w-5" />
            </CardTitle>
            <CardDescription>{baseOptions[1].description}</CardDescription>
          </CardHeader>
        </Card>

        {/* Country Chicken Option with green color scheme */}
        <Card
          className="hover:border-green-500 cursor-pointer transition-colors border-green-200"
          onClick={() => onSelectOption({ type: "base", ...baseOptions[2] })}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {baseOptions[2].name}
              <ChevronRight className="h-5 w-5 " />
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
                className="hover:border-purple-500 cursor-pointer transition-colors"
                onClick={() => onSelectOption({ type: "additional", ...product })}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {product.name}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </CardTitle>
                  <CardDescription>Additional Product</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingOptions;
