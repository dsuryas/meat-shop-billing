import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";

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
      name: "Wholesale",
      description: "Bulk orders and wholesale rates",
    },
    {
      id: "countryChicken",
      name: "Country Chicken",
      description: "Naatu Kozhi sales",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Base Options */}
      {baseOptions.map((option) => (
        <Card
          key={option.id}
          className="hover:border-blue-500 cursor-pointer transition-colors"
          onClick={() => onSelectOption({ type: "base", ...option })}
        >
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              {option.name}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </CardTitle>
            <CardDescription>{option.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}

      {/* Additional Product Options */}
      {additionalProducts.map((product) => (
        <Card
          key={product.id}
          className="hover:border-blue-500 cursor-pointer transition-colors"
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
  );
};

export default BillingOptions;
