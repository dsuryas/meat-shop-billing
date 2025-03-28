import React from "react";
import PropTypes from "prop-types";
import { Input } from "../ui/input";

/**
 * PricingSection component handles the pricing part of the billing form
 * including weight, number of birds, discount, and price calculations
 */
const PricingSection = ({
  weight,
  numberOfBirds,
  discountPerKg,
  price,
  handleInputChange,
  calculateDiscountFromPrice,
  billingOption,
  saleType,
  currentBasePrice,
  customerSellingPrice,
  CONVERSION_FACTOR,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">
            Live weight (kg) *<span className="text-xs text-gray-500 ml-2">(Meat weight: {(Number(weight || 0) / CONVERSION_FACTOR).toFixed(2)} kg)</span>
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="Enter weight"
            value={weight}
            onChange={(e) => handleInputChange("weight", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Number of Birds *</label>
          <Input
            type="number"
            placeholder="Enter count"
            value={numberOfBirds}
            onChange={(e) => handleInputChange("numberOfBirds", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Discount (₹/kg)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="Enter discount"
            value={discountPerKg}
            onChange={(e) => handleInputChange("discountPerKg", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Price (₹)</label>
          <Input
            type="number"
            step="0.01"
            placeholder="Enter price"
            value={price}
            onChange={(e) => {
              const newPrice = e.target.value;
              const weightValue = Number(weight);

              // Calculate discount per kg based on entered price
              if (weightValue > 0) {
                const newDiscountPerKg = calculateDiscountFromPrice(newPrice, weightValue, billingOption, saleType, currentBasePrice, customerSellingPrice);
                handleInputChange("discountPerKg", newDiscountPerKg);
              }

              handleInputChange("price", newPrice);
            }}
            className="mt-1"
          />
        </div>
        {discountPerKg && weight && (
          <div className="col-span-4 text-sm text-gray-500">
            Rate after discount: ₹{(Number(currentBasePrice) + Number(customerSellingPrice || 0) - Number(discountPerKg || 0)).toFixed(2)}
            /kg
          </div>
        )}
      </div>

      {/* Display current conversion factor */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm flex justify-between items-center">
          <span className="font-medium">Current Conversion Factor: {CONVERSION_FACTOR}</span>
          <span className="text-xs text-gray-500">
            ({weight ? `${Number(weight).toFixed(2)}kg live → ${(Number(weight) / CONVERSION_FACTOR).toFixed(2)}kg meat` : "Live to Meat Weight"})
          </span>
        </div>
      </div>
    </div>
  );
};

PricingSection.propTypes = {
  weight: PropTypes.string.isRequired,
  numberOfBirds: PropTypes.string.isRequired,
  discountPerKg: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  calculateDiscountFromPrice: PropTypes.func.isRequired,
  billingOption: PropTypes.object.isRequired,
  saleType: PropTypes.string.isRequired,
  currentBasePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  customerSellingPrice: PropTypes.string.isRequired,
  CONVERSION_FACTOR: PropTypes.number.isRequired,
};

export default PricingSection;
