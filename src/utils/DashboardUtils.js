// Utility functions shared between dashboards
import { MEAT_CONVERSION_FACTOR, COUNTRY_MEAT_CONVERSION_FACTOR } from "./storage";

// Stock calculation utilities
export const calculateStock = (dailySetup, bills) => {
  // Broiler calculation utilities
  const getTotalInitialStock = () => {
    if (!dailySetup) return 0;
    return Number(dailySetup.freshStock || 0) + Number(dailySetup.remainingStock || 0);
  };

  const getTotalInitialStockInMeatWeight = () => {
    if (!dailySetup) return 0;
    return (getTotalInitialStock() / MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => !bill.chickenType || bill.chickenType === "broiler")
      .reduce((total, bill) => {
        return total + Number(bill.rawWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getSoldStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => !bill.chickenType || bill.chickenType === "broiler")
      .reduce((total, bill) => {
        if (bill.weightType === "live") {
          return total + Number(bill.meatWeight || 0);
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getRemainingStockLiveWeight = () => {
    const totalLive = getTotalInitialStock();
    const soldLive = getSoldStockLiveWeight();
    return Math.max(0, Number(totalLive) - Number(soldLive)).toFixed(3);
  };

  const getRemainingStockMeatWeight = () => {
    const totalMeat = getTotalInitialStockInMeatWeight();
    const soldMeat = getSoldStockMeatWeight();
    return Math.max(0, Number(totalMeat) - Number(soldMeat)).toFixed(2);
  };

  const getTotalBirds = () => {
    return bills.filter((bill) => !bill.chickenType || bill.chickenType === "broiler").reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingBirds = () => {
    if (!dailySetup) return 0;
    const totalInitialBirds = Number(dailySetup.freshBirds || 0) + Number(dailySetup.remainingBirds || 0);
    return totalInitialBirds - getTotalBirds();
  };

  // Country chicken calculation utilities
  const getTotalCountryInitialStock = () => {
    if (!dailySetup) return 0;
    return Number(dailySetup.countryFreshStock || 0) + Number(dailySetup.countryRemainingStock || 0);
  };

  const getTotalCountryInitialStockInMeatWeight = () => {
    if (!dailySetup) return 0;
    return (getTotalCountryInitialStock() / COUNTRY_MEAT_CONVERSION_FACTOR).toFixed(3);
  };

  const getSoldCountryStockLiveWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => bill.chickenType === "country")
      .reduce((total, bill) => {
        return total + Number(bill.rawWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getSoldCountryStockMeatWeight = () => {
    if (!Array.isArray(bills)) return 0;

    return bills
      .filter((bill) => bill.chickenType === "country")
      .reduce((total, bill) => {
        if (bill.weightType === "live") {
          return total + Number(bill.meatWeight || 0);
        }
        return total + Number(bill.inventoryWeight || 0);
      }, 0)
      .toFixed(3);
  };

  const getRemainingCountryStockLiveWeight = () => {
    const totalCountryLive = getTotalCountryInitialStock();
    const soldCountryLive = getSoldCountryStockLiveWeight();
    return Math.max(0, Number(totalCountryLive) - Number(soldCountryLive)).toFixed(3);
  };

  const getRemainingCountryStockMeatWeight = () => {
    const totalCountryMeat = getTotalCountryInitialStockInMeatWeight();
    const soldCountryMeat = getSoldCountryStockMeatWeight();
    return Math.max(0, Number(totalCountryMeat) - Number(soldCountryMeat)).toFixed(2);
  };

  const getCountryChickenBirdCount = () => {
    return bills.filter((bill) => bill.chickenType === "country").reduce((total, bill) => total + Number(bill?.numberOfBirds || 0), 0);
  };

  const getRemainingCountryBirds = () => {
    if (!dailySetup) return 0;
    const totalInitialCountryBirds = Number(dailySetup.countryFreshBirds || 0) + Number(dailySetup.countryRemainingBirds || 0);
    return totalInitialCountryBirds - getCountryChickenBirdCount();
  };

  return {
    getTotalInitialStock,
    getTotalInitialStockInMeatWeight,
    getSoldStockLiveWeight,
    getSoldStockMeatWeight,
    getRemainingStockLiveWeight,
    getRemainingStockMeatWeight,
    getTotalBirds,
    getRemainingBirds,
    getTotalCountryInitialStock,
    getTotalCountryInitialStockInMeatWeight,
    getSoldCountryStockLiveWeight,
    getSoldCountryStockMeatWeight,
    getRemainingCountryStockLiveWeight,
    getRemainingCountryStockMeatWeight,
    getCountryChickenBirdCount,
    getRemainingCountryBirds,
  };
};

// Sales calculation utilities
export const calculateSales = (bills) => {
  const getCurrentEarnings = () => {
    return bills.reduce((total, bill) => total + Number(bill?.price || 0), 0);
  };

  const getRetailSales = () => {
    return bills
      .filter((bill) => bill.category === "retail" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getWholesaleSales = () => {
    return bills
      .filter((bill) => bill.category === "wholesale" && (!bill.chickenType || bill.chickenType === "broiler"))
      .reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getCountryChickenSales = () => {
    return bills.filter((bill) => bill.chickenType === "country").reduce((total, bill) => total + Number(bill.price || 0), 0);
  };

  const getTotalDiscounts = () => {
    return bills.reduce((total, bill) => total + Number(bill.discountPerKg || 0) * Number(bill.weight || 0), 0);
  };

  return {
    getCurrentEarnings,
    getRetailSales,
    getWholesaleSales,
    getCountryChickenSales,
    getTotalDiscounts,
  };
};

// Check if the day is closed
export const isDayClosed = (dailySetup) => {
  if (!dailySetup) return false;
  return !!dailySetup.hasClosedDay;
};

// Format date with specified options
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format currency with ₹ symbol
export const formatCurrency = (amount) => {
  return `₹${Number(amount).toFixed(2)}`;
};
