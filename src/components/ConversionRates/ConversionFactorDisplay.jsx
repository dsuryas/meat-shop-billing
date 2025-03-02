import React, { useState, useEffect } from "react";
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor } from "../../utils/storage";

// A simple component to display current conversion factors
const ConversionFactorDisplay = ({ compact = false, className = "" }) => {
  const [factors, setFactors] = useState({
    broiler: getBroilerMeatConversionFactor(),
    countryChicken: getCountryChickenMeatConversionFactor(),
  });

  // Refresh when mounted
  useEffect(() => {
    setFactors({
      broiler: getBroilerMeatConversionFactor(),
      countryChicken: getCountryChickenMeatConversionFactor(),
    });
  }, []);

  if (compact) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        Conv: B {factors.broiler}, CC {factors.countryChicken}
      </div>
    );
  }

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <div>Broiler Conversion: {factors.broiler}</div>
      <div>Country Chicken Conversion: {factors.countryChicken}</div>
    </div>
  );
};

export default ConversionFactorDisplay;
