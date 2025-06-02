// storage-updated.js - Modified to use IndexedDB instead of localStorage
import { dbService } from "./db/index";

// Database initialization status
let isDbInitialized = false;
let dbInitializationPromise = null;

// Storage keys mapping (for reference to original localStorage keys)
const STORAGE_KEYS = {
  DAILY_SETUP: "meatShop_dailySetup",
  BILLS: "meatShop_bills",
  PRODUCTS: "meatShop_products",
  USERS: "meatShop_users",
  DAILY_CLOSINGS: "meatShop_dailyClosings",
  CLOSED_DAY: "meatShop_closedDay",
  CONVERSION_RATES: "meatShop_conversionRates",
  CONVERSION_FACTORS: "meatShop_conversionFactors",
  EXPENSE_CATEGORIES: "meatShop_expenseCategories",
  EXPENSES: "meatShop_expenses",
  REGULAR_CUSTOMERS: "meatShop_regularCustomers",
  PRICE_HISTORY: "meatShop_priceHistory",
};

// Cached values for conversion factors (to avoid repeated async calls)
let cachedConversionFactors = {
  broilerMeat: null,
  countryChickenMeat: null,
  broilerWithSkin: null,
  broilerWithoutSkin: null,
  countryWithSkin: null,
  countryWithoutSkin: null,
  lastUpdated: null,
};

// Initialize the database and ensure proper setup
export const initializeDatabase = async () => {
  // If already initialized or initialization is in progress, return the promise
  if (isDbInitialized) {
    return true;
  }

  if (dbInitializationPromise) {
    return dbInitializationPromise;
  }

  dbInitializationPromise = (async () => {
    try {
      console.log("Initializing database...");

      // Initialize the database
      const result = await dbService.initDatabase();

      if (!result) {
        throw new Error("Database initialization failed");
      }

      // Mark as initialized
      isDbInitialized = true;
      console.log("Database initialized successfully");

      // Initialize the cache after database is ready
      await initializeCache();

      return true;
    } catch (error) {
      console.error("Error initializing database:", error);
      // Reset promise to allow retry
      dbInitializationPromise = null;
      throw error;
    }
  })();

  return dbInitializationPromise;
};

// Initialize the conversion factors cache safely
const initializeCache = async () => {
  try {
    // Ensure database is initialized first
    if (!isDbInitialized) {
      await initializeDatabase();
    }

    console.log("Initializing conversion factor cache...");

    // Use a timeout to prevent hanging
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Cache initialization timeout")), 10000));

    const initialization = Promise.race([
      (async () => {
        try {
          cachedConversionFactors.broilerMeat = await dbService.getBroilerMeatConversionFactor();
          cachedConversionFactors.countryChickenMeat = await dbService.getCountryChickenMeatConversionFactor();
          cachedConversionFactors.broilerWithSkin = await getBroilerWithSkinConversionFactorInternal();
          cachedConversionFactors.broilerWithoutSkin = await getBroilerWithoutSkinConversionFactorInternal();
          cachedConversionFactors.countryWithSkin = await getCountryWithSkinConversionFactorInternal();
          cachedConversionFactors.countryWithoutSkin = await getCountryWithoutSkinConversionFactorInternal();
          cachedConversionFactors.lastUpdated = Date.now();

          console.log("Conversion factor cache initialized successfully");
        } catch (error) {
          console.warn("Error loading some conversion factors, using defaults:", error);
          // Set default values on error
          setDefaultCacheValues();
        }
      })(),
      timeout,
    ]);

    await initialization;
  } catch (error) {
    console.error("Error initializing conversion factor cache:", error);
    // Set default values on error
    setDefaultCacheValues();
  }
};

// Helper function to set default cache values
const setDefaultCacheValues = () => {
  cachedConversionFactors.broilerMeat = 1.45;
  cachedConversionFactors.countryChickenMeat = 1.65;
  cachedConversionFactors.broilerWithSkin = 1.25;
  cachedConversionFactors.broilerWithoutSkin = 1.35;
  cachedConversionFactors.countryWithSkin = 1.45;
  cachedConversionFactors.countryWithoutSkin = 1.55;
  cachedConversionFactors.lastUpdated = Date.now();
};

// Reset the cache after a certain time
const resetCacheIfNeeded = async () => {
  const cacheLifetime = 5 * 60 * 1000; // 5 minutes
  if (!cachedConversionFactors.lastUpdated || Date.now() - cachedConversionFactors.lastUpdated > cacheLifetime) {
    await initializeCache();
  }
};

// Internal helper functions for getting conversion factors
const getBroilerWithSkinConversionFactorInternal = async () => {
  try {
    const factor = await getConversionFactorValue("broilerWithSkinConversion");
    return factor;
  } catch (error) {
    console.warn("Error getting broiler with skin conversion factor:", error);
    return 1.25; // Default value
  }
};

const getBroilerWithoutSkinConversionFactorInternal = async () => {
  try {
    const factor = await getConversionFactorValue("broilerWithoutSkinConversion");
    return factor;
  } catch (error) {
    console.warn("Error getting broiler without skin conversion factor:", error);
    return 1.35; // Default value
  }
};

const getCountryWithSkinConversionFactorInternal = async () => {
  try {
    const factor = await getConversionFactorValue("countryWithSkinConversion");
    return factor;
  } catch (error) {
    console.warn("Error getting country with skin conversion factor:", error);
    return 1.45; // Default value
  }
};

const getCountryWithoutSkinConversionFactorInternal = async () => {
  try {
    const factor = await getConversionFactorValue("countryWithoutSkinConversion");
    return factor;
  } catch (error) {
    console.warn("Error getting country without skin conversion factor:", error);
    return 1.55; // Default value
  }
};

// Function to get all conversion factors
export const getConversionFactors = async () => {
  return await dbService.getConversionFactors();
};

// Function to get conversion factors by category
export const getConversionFactorsByCategory = async (category) => {
  return await dbService.getConversionFactorsByCategory(category);
};

// Function to get a specific conversion factor by ID
export const getConversionFactorById = async (id) => {
  return await dbService.getConversionFactorById(id);
};

// Function to get conversion factor value by ID
export const getConversionFactorValue = async (id) => {
  try {
    // Ensure database is initialized
    await initializeDatabase();

    const factor = await dbService.getConversionFactorById(id);

    // Default values if factor not found
    const defaults = {
      broilerMeatConversion: 1.45,
      broilerWithSkinConversion: 1.25,
      broilerWithoutSkinConversion: 1.35,
      countryMeatConversion: 1.65,
      countryWithSkinConversion: 1.45,
      countryWithoutSkinConversion: 1.55,
    };

    return factor ? factor.value : defaults[id] || 1.0;
  } catch (error) {
    console.error(`Error getting conversion factor ${id}:`, error);
    // Return default values
    const defaults = {
      broilerMeatConversion: 1.45,
      broilerWithSkinConversion: 1.25,
      broilerWithoutSkinConversion: 1.35,
      countryMeatConversion: 1.65,
      countryWithSkinConversion: 1.45,
      countryWithoutSkinConversion: 1.55,
    };
    return defaults[id] || 1.0;
  }
};

// Update a specific conversion factor
export const updateConversionFactor = async (id, newValue, modifiedBy = null, notes = null) => {
  const result = await dbService.updateConversionFactor(id, newValue, modifiedBy, notes);
  // Clear cache after updates
  cachedConversionFactors.lastUpdated = null;
  return result;
};

// Update multiple conversion factors at once
export const updateConversionFactors = async (updates, modifiedBy = null, notes = null) => {
  try {
    let anyUpdated = false;

    // Process each update
    for (const [id, newValue] of Object.entries(updates)) {
      const updated = await updateConversionFactor(id, newValue, modifiedBy, notes);
      if (updated) {
        anyUpdated = true;
      }
    }

    return anyUpdated;
  } catch (error) {
    console.error("Error updating conversion factors:", error);
    return false;
  }
};

// Get all conversion factor history (for reporting)
export const getAllConversionFactorHistory = async () => {
  return await dbService.getAllConversionFactorHistory();
};

// Modified public helper functions for each conversion factor
export const getBroilerMeatConversionFactor = async () => {
  try {
    // Ensure database is initialized
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.broilerMeat;
  } catch (error) {
    console.error("Error getting broiler meat conversion factor:", error);
    return 1.45; // Default fallback
  }
};

export const getBroilerWithSkinConversionFactor = async () => {
  try {
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.broilerWithSkin;
  } catch (error) {
    console.error("Error getting broiler with skin conversion factor:", error);
    return 1.25; // Default fallback
  }
};

export const getBroilerWithoutSkinConversionFactor = async () => {
  try {
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.broilerWithoutSkin;
  } catch (error) {
    console.error("Error getting broiler without skin conversion factor:", error);
    return 1.35; // Default fallback
  }
};

export const getCountryChickenMeatConversionFactor = async () => {
  try {
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.countryChickenMeat;
  } catch (error) {
    console.error("Error getting country chicken conversion factor:", error);
    return 1.65; // Default fallback
  }
};

export const getCountryWithSkinConversionFactor = async () => {
  try {
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.countryWithSkin;
  } catch (error) {
    console.error("Error getting country with skin conversion factor:", error);
    return 1.45; // Default fallback
  }
};

export const getCountryWithoutSkinConversionFactor = async () => {
  try {
    await initializeDatabase();
    await resetCacheIfNeeded();
    return cachedConversionFactors.countryWithoutSkin;
  } catch (error) {
    console.error("Error getting country without skin conversion factor:", error);
    return 1.55; // Default fallback
  }
};

// For backwards compatibility - sync versions that use cached values
// These should be used carefully and only in places where async calls
// would be too cumbersome to implement
export const getBroilerMeatConversionFactorSync = () => {
  return cachedConversionFactors.broilerMeat || 1.45;
};

export const getCountryChickenMeatConversionFactorSync = () => {
  return cachedConversionFactors.countryChickenMeat || 1.65;
};

export const getBroilerWithSkinConversionFactorSync = () => {
  return cachedConversionFactors.broilerWithSkin || 1.25;
};

export const getBroilerWithoutSkinConversionFactorSync = () => {
  return cachedConversionFactors.broilerWithoutSkin || 1.35;
};

export const getCountryWithSkinConversionFactorSync = () => {
  return cachedConversionFactors.countryWithSkin || 1.45;
};

export const getCountryWithoutSkinConversionFactorSync = () => {
  return cachedConversionFactors.countryWithoutSkin || 1.55;
};

// For backwards compatibility
export const getConversionRates = async () => {
  const broilerFactor = await getBroilerMeatConversionFactor();
  const countryFactor = await getCountryChickenMeatConversionFactor();

  return {
    broilerMeatConversion: broilerFactor,
    countryChickenMeatConversion: countryFactor,
  };
};

// For backwards compatibility
export const saveConversionRates = async (rates, modifiedBy = null, notes = null) => {
  return await updateConversionFactors(rates, modifiedBy, notes);
};

// For backwards compatibility
export const getConversionRatesHistory = async () => {
  return await getAllConversionFactorHistory();
};

// Initialize the conversion factors
export const initializeConversionFactors = async () => {
  return await dbService.initializeConversionFactors();
};

// For backwards compatibility
export const MEAT_CONVERSION_FACTOR = 1.45; // Default value
export const COUNTRY_MEAT_CONVERSION_FACTOR = 1.65; // Default value

// Daily Setup Functions
export const saveDailySetup = async (setupData) => {
  return await dbService.saveDailySetup(setupData);
};

export const getDailySetup = async () => {
  return await dbService.getDailySetup();
};

export const isDaySetupValid = async (currentDate) => {
  return await dbService.isDaySetupValid(currentDate);
};

// Bills Functions
export const getBills = async () => {
  return await dbService.getBills();
};

export const getBillsForCurrentDay = async () => {
  return await dbService.getBillsForCurrentDay();
};

export const saveBills = async (bills) => {
  try {
    // Clear existing bills and save new ones
    await dbService.clearStore(dbService.STORES.BILLS);

    for (const bill of bills) {
      await dbService.addItem(dbService.STORES.BILLS, bill);
    }

    return bills;
  } catch (error) {
    console.error("Error saving bills:", error);
    return [];
  }
};

export const addBill = async (billData) => {
  return await dbService.addBill(billData);
};

export const updateBill = async (updatedBill) => {
  return await dbService.updateBill(updatedBill);
};

export const deleteBill = async (billId) => {
  return await dbService.deleteBill(billId);
};

// Products Functions
export const getProducts = async () => {
  return await dbService.getProducts();
};

export const saveProducts = async (products) => {
  try {
    await dbService.clearStore(dbService.STORES.PRODUCTS);

    for (const product of products) {
      await dbService.addItem(dbService.STORES.PRODUCTS, product);
    }

    return products;
  } catch (error) {
    console.error("Error saving products:", error);
    return [];
  }
};

export const addProduct = async (productData) => {
  return await dbService.addProduct(productData);
};

export const updateProduct = async (updatedProduct) => {
  return await dbService.updateProduct(updatedProduct);
};

// Users Functions
export const getUsers = async () => {
  return await dbService.getUsers();
};

export const saveUsers = async (users) => {
  try {
    await dbService.clearStore(dbService.STORES.USERS);

    for (const user of users) {
      await dbService.addItem(dbService.STORES.USERS, user);
    }

    return users;
  } catch (error) {
    console.error("Error saving users:", error);
    return [];
  }
};

export const addUser = async (userData) => {
  return await dbService.addUser(userData);
};

export const getUserByUsername = async (username) => {
  return await dbService.getUserByUsername(username);
};

// Daily Closing Functions
export const saveClosedDay = async (dayData) => {
  // Legacy function - now handled internally by saveDailyClosing
  return await saveDailyClosing(dayData);
};

export const getClosedDay = async () => {
  return await dbService.getClosedDay();
};

export const clearClosedDay = async () => {
  return await dbService.clearClosedDay();
};

export const saveDailyClosing = async (closingData) => {
  return await dbService.saveDailyClosing(closingData);
};

export const getDailyClosings = async () => {
  return await dbService.getDailyClosings();
};

// Clear Functions
export const clearDaySetup = async () => {
  return await dbService.clearDaySetup();
};

export const clearAllData = async () => {
  return await dbService.clearAllData();
};

// Function to start a new day setup while preserving reference to previous data
export const startNewDaySetup = async () => {
  return await dbService.startNewDaySetup();
};

// Regular Customers Functions
export const getRegularCustomers = async () => {
  return await dbService.getRegularCustomers();
};

export const addRegularCustomer = async (customerData) => {
  return await dbService.addRegularCustomer(customerData);
};

export const updateRegularCustomer = async (updatedCustomer) => {
  return await dbService.updateRegularCustomer(updatedCustomer);
};

export const deleteRegularCustomer = async (customerId) => {
  return await dbService.deleteRegularCustomer(customerId);
};

// Price History Functions
export const savePriceHistory = async (priceRecord) => {
  return await dbService.savePriceHistory(priceRecord);
};

export const getPriceHistory = async () => {
  return await dbService.getPriceHistory();
};

// Expense Categories Functions
export const getExpenseCategories = async () => {
  try {
    return await dbService.getAllItems(dbService.STORES.EXPENSE_CATEGORIES);
  } catch (error) {
    console.error("Error getting expense categories:", error);
    return [];
  }
};

export const saveExpenseCategories = async (categories) => {
  try {
    await dbService.clearStore(dbService.STORES.EXPENSE_CATEGORIES);

    for (const category of categories) {
      await dbService.addItem(dbService.STORES.EXPENSE_CATEGORIES, category);
    }

    return true;
  } catch (error) {
    console.error("Error saving expense categories:", error);
    return false;
  }
};

export const getExpenseCategoryById = async (categoryId) => {
  try {
    return await dbService.getItemByKey(dbService.STORES.EXPENSE_CATEGORIES, categoryId);
  } catch (error) {
    console.error("Error getting expense category:", error);
    return null;
  }
};

// Expenses Functions
export const getExpenses = async () => {
  try {
    return await dbService.getAllItems(dbService.STORES.EXPENSES);
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
};

export const saveExpenses = async (expenses) => {
  try {
    await dbService.clearStore(dbService.STORES.EXPENSES);

    for (const expense of expenses) {
      await dbService.addItem(dbService.STORES.EXPENSES, expense);
    }

    return true;
  } catch (error) {
    console.error("Error saving expenses:", error);
    return false;
  }
};

export const addExpense = async (expenseData) => {
  try {
    const newExpense = {
      ...expenseData,
      id: expenseData.id || Date.now(),
      timestamp: expenseData.timestamp || new Date().toISOString(),
    };

    await dbService.addItem(dbService.STORES.EXPENSES, newExpense);
    return newExpense;
  } catch (error) {
    console.error("Error adding expense:", error);
    return null;
  }
};

export const getExpensesForDay = async (date) => {
  try {
    const expenses = await getExpenses();
    const targetDate = new Date(date).toISOString().split("T")[0];

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp).toISOString().split("T")[0];
      return expenseDate === targetDate;
    });
  } catch (error) {
    console.error("Error filtering expenses for day:", error);
    return [];
  }
};

export const getExpensesForCurrentDay = async () => {
  try {
    const setup = await getDailySetup();
    if (!setup) return [];

    return await getExpensesForDay(setup.date);
  } catch (error) {
    console.error("Error getting expenses for current day:", error);
    return [];
  }
};

// Date Utility Functions
export const isDifferentDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() !== d2.getDate() || d1.getMonth() !== d2.getMonth() || d1.getFullYear() !== d2.getFullYear();
};

export const checkNeedsDailySetup = async () => {
  const setup = await getDailySetup();
  if (!setup) return true;

  // If closed day exists and it's not a new day, don't need setup
  const closedDay = await getClosedDay();
  if (closedDay && !isDifferentDay(closedDay.date, new Date())) {
    return false;
  }

  // Check if it's a new day
  return isDifferentDay(setup.date, new Date());
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Country Chicken Utility Functions
export const getBroilerBills = async () => {
  const bills = await getBills();
  return bills.filter((bill) => !bill.chickenType || bill.chickenType === "broiler");
};

export const getCountryChickenBills = async () => {
  const bills = await getBills();
  return bills.filter((bill) => bill.chickenType === "country");
};

// Add this function to be called when the app starts
export const ensureStorageInitialized = async () => {
  try {
    await initializeDatabase();
    return true;
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    return false;
  }
};
