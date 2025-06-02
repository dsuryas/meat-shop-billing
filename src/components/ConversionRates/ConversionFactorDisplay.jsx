import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { getBroilerMeatConversionFactor, getCountryChickenMeatConversionFactor } from "../../utils/storage";

/**
 * A component to display current conversion factors with async function handling
 */
const ConversionFactorDisplay = ({ compact = false, className = "" }) => {
  // Initialize with safe default values
  const [factors, setFactors] = useState({
    broiler: "1.45", // Default value
    countryChicken: "1.65", // Default value
    isLoading: true,
    error: null,
  });

  // Safely fetch conversion factors when component mounts
  useEffect(() => {
    let isMounted = true; // For avoiding state updates after unmount

    const fetchConversionFactors = async () => {
      try {
        // Start with loading state
        if (isMounted) {
          setFactors((prev) => ({ ...prev, isLoading: true, error: null }));
        }

        // Fetch broiler factor
        let broilerFactor;
        try {
          const broilerResult = await Promise.resolve(getBroilerMeatConversionFactor());
          broilerFactor = isValidNumber(broilerResult) ? broilerResult : "1.45";
        } catch (error) {
          console.error("Error fetching broiler conversion factor:", error);
          broilerFactor = "1.45"; // Fallback to default
        }

        // Fetch country chicken factor
        let countryFactor;
        try {
          const countryResult = await Promise.resolve(getCountryChickenMeatConversionFactor());
          countryFactor = isValidNumber(countryResult) ? countryResult : "1.65";
        } catch (error) {
          console.error("Error fetching country chicken conversion factor:", error);
          countryFactor = "1.65"; // Fallback to default
        }

        // Update state if component is still mounted
        if (isMounted) {
          setFactors({
            broiler: broilerFactor,
            countryChicken: countryFactor,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Error fetching conversion factors:", error);
        if (isMounted) {
          setFactors((prev) => ({
            ...prev,
            isLoading: false,
            error: "Failed to load conversion factors",
          }));
        }
      }
    };

    fetchConversionFactors();

    // Cleanup function to prevent updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper function to validate numbers
  const isValidNumber = (value) => {
    return value !== null && value !== undefined && !isNaN(value) && typeof value !== "boolean" && value !== "";
  };

  // Handle loading state
  if (factors.isLoading) {
    return <div className={`text-xs text-gray-400 ${className}`}>{compact ? "Loading..." : "Loading conversion factors..."}</div>;
  }

  // Handle error state
  if (factors.error) {
    return <div className={`text-xs text-red-500 ${className}`}>{compact ? "Error" : factors.error}</div>;
  }

  // Compact display for small spaces
  if (compact) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        Conv: B {factors.broiler}, CC {factors.countryChicken}
      </div>
    );
  }

  // Full display
  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      <div>Broiler Conversion: {factors.broiler}</div>
      <div>Country Chicken Conversion: {factors.countryChicken}</div>
    </div>
  );
};

// PropTypes validation
ConversionFactorDisplay.propTypes = {
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default ConversionFactorDisplay;
