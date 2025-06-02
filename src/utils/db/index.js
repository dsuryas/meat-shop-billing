// index.js - Enhanced database module with error handling and recovery

import { STORES } from "../../../dbService/config";
import { DatabaseManager } from "../../../dbService/DatabaseManager";
import { DataAccess } from "../../../dbService/DataAccess";

// Import repositories
import { ConversionFactorsRepository } from "../../../dbService/repositories/ConversionFactorsRepository";
import { DailySetupRepository } from "../../../dbService/repositories/DailySetupRepository";
import { BillsRepository } from "../../../dbService/repositories/BillsRepository";
import { UsersRepository } from "../../../dbService/repositories/UsersRepository";
import { ProductsRepository } from "../../../dbService/repositories/ProductsRepository";
import { RegularCustomersRepository } from "../../../dbService/repositories/RegularCustomersRepository";
import { PriceHistoryRepository } from "../../../dbService/repositories/PriceHistoryRepository";
import { ExpenseCategoryRepository } from "../../../dbService/repositories/ExpenseCategoryRepository";
import { ExpenseRepository } from "../../../dbService/repositories/ExpenseRepository";
import { ClosedDayRepository } from "../../../dbService/repositories/ClosedDayRepository";
import { DailyClosingRepository } from "../../../dbService/repositories/DailyClosingRepository";

// Import services
import { MigrationService } from "../../../dbService/services/MigrationService";
import { OperationsService } from "../../../dbService/services/OperationsService";

// Create singleton instances
const dbManager = new DatabaseManager();
const dataAccess = new DataAccess(dbManager);

// Create repositories
const conversionFactorsRepo = new ConversionFactorsRepository(dataAccess);
const dailySetupRepo = new DailySetupRepository(dataAccess);
const billsRepo = new BillsRepository(dataAccess);
const usersRepo = new UsersRepository(dataAccess);
const productsRepo = new ProductsRepository(dataAccess);
const regularCustomersRepo = new RegularCustomersRepository(dataAccess);
const priceHistoryRepo = new PriceHistoryRepository(dataAccess);
const expenseCategoryRepo = new ExpenseCategoryRepository(dataAccess);
const expenseRepo = new ExpenseRepository(dataAccess);
const closedDayRepo = new ClosedDayRepository(dataAccess);
const dailyClosingRepo = new DailyClosingRepository(dataAccess);

// Create repository collection
const repositories = {
  conversionFactors: conversionFactorsRepo,
  dailySetup: dailySetupRepo,
  bills: billsRepo,
  users: usersRepo,
  products: productsRepo,
  regularCustomers: regularCustomersRepo,
  priceHistory: priceHistoryRepo,
  expenseCategories: expenseCategoryRepo,
  expenses: expenseRepo,
  closedDay: closedDayRepo,
  dailyClosings: dailyClosingRepo,
};

// Create services
const migrationService = new MigrationService(dataAccess);
const operationsService = new OperationsService(repositories);

// Enhanced error handling wrapper function
const withErrorHandling = (operation, operationName) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      console.error(`Error in ${operationName}:`, error);

      // Check if it's a "not found" error related to object stores
      if (error.message && error.message.includes("not a known object store name")) {
        console.log("Attempting database recovery due to missing object stores");

        try {
          // Try to reinitialize the database
          await dbManager.reinitialize();

          // Try the operation again after reinitialization
          return await operation(...args);
        } catch (recoveryError) {
          console.error("Recovery failed:", recoveryError);

          // If recovery fails, try to delete and recreate the database
          try {
            await dbManager.deleteDatabase();
            await dbManager.reinitialize();

            // Initialize default data after recreation
            await conversionFactorsRepo.initialize();
            await usersRepo.initializeDefaultUser();

            // Try the operation one more time
            return await operation(...args);
          } catch (finalError) {
            console.error("Final recovery attempt failed:", finalError);
            throw new Error(`Database operation failed even after recovery attempts: ${finalError.message}`);
          }
        }
      }

      // For other errors, provide appropriate fallbacks
      if (operationName.includes("getAll") || operationName.includes("getUsers") || operationName.includes("getBills")) {
        console.warn(`Returning empty array for failed ${operationName}`);
        return [];
      }

      if (operationName.includes("get") && !operationName.includes("getAll")) {
        console.warn(`Returning null for failed ${operationName}`);
        return null;
      }

      // For write operations, return false to indicate failure
      if (operationName.includes("add") || operationName.includes("update") || operationName.includes("delete") || operationName.includes("save")) {
        console.warn(`Returning false for failed ${operationName}`);
        return false;
      }

      // For other operations, just rethrow
      throw error;
    }
  };
};

// Database service facade with enhanced error handling
export const dbService = {
  // Enhanced database initialization with recovery
  initDatabase: withErrorHandling(async () => {
    console.log("Initializing database...");

    try {
      await dbManager.getConnection();
      await conversionFactorsRepo.initialize();
      await usersRepo.initializeDefaultUser();

      console.log("Database initialization completed successfully");
      return true;
    } catch (error) {
      console.error("Database initialization failed:", error);

      // Try to recover by deleting and recreating
      try {
        console.log("Attempting database recovery...");
        await dbManager.deleteDatabase();
        await dbManager.getConnection();
        await conversionFactorsRepo.initialize();
        await usersRepo.initializeDefaultUser();

        console.log("Database recovery completed successfully");
        return true;
      } catch (recoveryError) {
        console.error("Database recovery failed:", recoveryError);
        return false;
      }
    }
  }, "initDatabase"),

  // Database management functions
  getDatabaseInfo: withErrorHandling(async () => {
    try {
      const db = await dbManager.getConnection();
      return {
        name: db.name,
        version: db.version,
        objectStoreNames: Array.from(db.objectStoreNames),
        isInitialized: dbManager.isInitialized || false,
      };
    } catch (error) {
      return {
        error: error.message,
        isInitialized: false,
      };
    }
  }, "getDatabaseInfo"),

  // Manual recovery functions
  recoverDatabase: withErrorHandling(async () => {
    console.log("Manual database recovery initiated");
    await dbManager.deleteDatabase();
    await dbManager.getConnection();
    await conversionFactorsRepo.initialize();
    await usersRepo.initializeDefaultUser();
    return true;
  }, "recoverDatabase"),

  // Repository APIs with error handling - organized by entity
  conversionFactors: {
    getAll: withErrorHandling(() => conversionFactorsRepo.getAll(), "conversionFactors.getAll"),
    getById: withErrorHandling((id) => conversionFactorsRepo.getById(id), "conversionFactors.getById"),
    getByCategory: withErrorHandling((category) => conversionFactorsRepo.getByCategory(category), "conversionFactors.getByCategory"),
    update: withErrorHandling(
      (id, newValue, modifiedBy, notes) => conversionFactorsRepo.updateFactor(id, newValue, modifiedBy, notes),
      "conversionFactors.update"
    ),
    getAllHistory: withErrorHandling(() => conversionFactorsRepo.getAllHistory(), "conversionFactors.getAllHistory"),
    getBroilerMeatFactor: withErrorHandling(() => conversionFactorsRepo.getBroilerMeatFactor(), "conversionFactors.getBroilerMeatFactor"),
    getCountryChickenMeatFactor: withErrorHandling(() => conversionFactorsRepo.getCountryChickenMeatFactor(), "conversionFactors.getCountryChickenMeatFactor"),
    initialize: withErrorHandling(() => conversionFactorsRepo.initialize(), "conversionFactors.initialize"),
  },

  dailySetup: {
    getCurrent: withErrorHandling(() => dailySetupRepo.getCurrent(), "dailySetup.getCurrent"),
    isValid: withErrorHandling((date) => dailySetupRepo.isValid(date), "dailySetup.isValid"),
    save: withErrorHandling((setupData) => dailySetupRepo.save(setupData), "dailySetup.save"),
    clear: withErrorHandling(() => dailySetupRepo.clear(), "dailySetup.clear"),
  },

  bills: {
    getAll: withErrorHandling(() => billsRepo.getAll(), "bills.getAll"),
    getCurrentDay: withErrorHandling(() => billsRepo.getCurrentDayBills(dailySetupRepo), "bills.getCurrentDay"),
    getForDay: withErrorHandling((date) => billsRepo.getForDay(date), "bills.getForDay"),
    add: withErrorHandling((billData) => billsRepo.addBill(billData), "bills.add"),
    update: withErrorHandling((bill) => billsRepo.update(bill), "bills.update"),
    delete: withErrorHandling((id) => billsRepo.delete(id), "bills.delete"),
  },

  users: {
    getAll: withErrorHandling(() => usersRepo.getAll(), "users.getAll"),
    getByUsername: withErrorHandling((username) => usersRepo.getByUsername(username), "users.getByUsername"),
    add: withErrorHandling((userData) => usersRepo.add(userData), "users.add"),
    update: withErrorHandling((user) => usersRepo.update(user), "users.update"),
    delete: withErrorHandling((username) => usersRepo.delete(username), "users.delete"),
    initializeDefaultUser: withErrorHandling(() => usersRepo.initializeDefaultUser(), "users.initializeDefaultUser"),
  },

  products: {
    getAll: withErrorHandling(() => productsRepo.getAll(), "products.getAll"),
    getById: withErrorHandling((id) => productsRepo.getById(id), "products.getById"),
    getActive: withErrorHandling(() => productsRepo.getActiveProducts(), "products.getActive"),
    add: withErrorHandling((product) => productsRepo.add(product), "products.add"),
    update: withErrorHandling((product) => productsRepo.update(product), "products.update"),
    delete: withErrorHandling((id) => productsRepo.delete(id), "products.delete"),
  },

  regularCustomers: {
    getAll: withErrorHandling(() => regularCustomersRepo.getAll(), "regularCustomers.getAll"),
    getById: withErrorHandling((id) => regularCustomersRepo.getById(id), "regularCustomers.getById"),
    getByPhone: withErrorHandling((phone) => regularCustomersRepo.getByPhone(phone), "regularCustomers.getByPhone"),
    add: withErrorHandling((customer) => regularCustomersRepo.add(customer), "regularCustomers.add"),
    update: withErrorHandling((customer) => regularCustomersRepo.update(customer), "regularCustomers.update"),
    delete: withErrorHandling((id) => regularCustomersRepo.delete(id), "regularCustomers.delete"),
  },

  priceHistory: {
    getAll: withErrorHandling(() => priceHistoryRepo.getAll(), "priceHistory.getAll"),
    getLatest: withErrorHandling(() => priceHistoryRepo.getLatestPrices(), "priceHistory.getLatest"),
    add: withErrorHandling((history) => priceHistoryRepo.add(history), "priceHistory.add"),
    update: withErrorHandling((history) => priceHistoryRepo.update(history), "priceHistory.update"),
  },

  expenseCategories: {
    getAll: withErrorHandling(() => expenseCategoryRepo.getAll(), "expenseCategories.getAll"),
    getById: withErrorHandling((id) => expenseCategoryRepo.getById(id), "expenseCategories.getById"),
    add: withErrorHandling((category) => expenseCategoryRepo.add(category), "expenseCategories.add"),
    update: withErrorHandling((category) => expenseCategoryRepo.update(category), "expenseCategories.update"),
    delete: withErrorHandling((id) => expenseCategoryRepo.delete(id), "expenseCategories.delete"),
  },

  expenses: {
    getAll: withErrorHandling(() => expenseRepo.getAll(), "expenses.getAll"),
    getById: withErrorHandling((id) => expenseRepo.getById(id), "expenses.getById"),
    getForDay: withErrorHandling((date) => expenseRepo.getForDay(date), "expenses.getForDay"),
    add: withErrorHandling((expense) => expenseRepo.add(expense), "expenses.add"),
    update: withErrorHandling((expense) => expenseRepo.update(expense), "expenses.update"),
    delete: withErrorHandling((id) => expenseRepo.delete(id), "expenses.delete"),
  },

  closedDay: {
    getAll: withErrorHandling(() => closedDayRepo.getAll(), "closedDay.getAll"),
    getMostRecent: withErrorHandling(() => closedDayRepo.getMostRecent(), "closedDay.getMostRecent"),
    add: withErrorHandling((data) => closedDayRepo.add(data), "closedDay.add"),
    update: withErrorHandling((data) => closedDayRepo.update(data), "closedDay.update"),
    clear: withErrorHandling(() => closedDayRepo.clear(), "closedDay.clear"),
  },

  dailyClosings: {
    getAll: withErrorHandling(() => dailyClosingRepo.getAll(), "dailyClosings.getAll"),
    getById: withErrorHandling((id) => dailyClosingRepo.getById(id), "dailyClosings.getById"),
    add: withErrorHandling((closing) => dailyClosingRepo.add(closing), "dailyClosings.add"),
    update: withErrorHandling((closing) => dailyClosingRepo.update(closing), "dailyClosings.update"),
  },

  // Low-level data access with error handling
  dataAccess: {
    addItem: withErrorHandling((...args) => dataAccess.addItem(...args), "dataAccess.addItem"),
    updateItem: withErrorHandling((...args) => dataAccess.updateItem(...args), "dataAccess.updateItem"),
    getAllItems: withErrorHandling((...args) => dataAccess.getAllItems(...args), "dataAccess.getAllItems"),
    getItemByKey: withErrorHandling((...args) => dataAccess.getItemByKey(...args), "dataAccess.getItemByKey"),
    deleteItemByKey: withErrorHandling((...args) => dataAccess.deleteItemByKey(...args), "dataAccess.deleteItemByKey"),
    clearStore: withErrorHandling((...args) => dataAccess.clearStore(...args), "dataAccess.clearStore"),
    getItemsByIndex: withErrorHandling((...args) => dataAccess.getItemsByIndex(...args), "dataAccess.getItemsByIndex"),
  },

  // Composite operations with error handling
  operations: {
    saveDailyClosing: withErrorHandling((closingData) => operationsService.saveDailyClosing(closingData), "operations.saveDailyClosing"),
    startNewDaySetup: withErrorHandling(() => operationsService.startNewDaySetup(), "operations.startNewDaySetup"),
    clearAllData: withErrorHandling(() => operationsService.clearAllData(), "operations.clearAllData"),
  },

  // Migration with error handling
  migration: {
    migrateFromLocalStorage: withErrorHandling(
      (progressCallback) => migrationService.migrateFromLocalStorage(progressCallback),
      "migration.migrateFromLocalStorage"
    ),
  },

  // Backwards compatibility methods with error handling
  getConversionFactors: withErrorHandling(() => conversionFactorsRepo.getAll(), "getConversionFactors"),
  getConversionFactorsByCategory: withErrorHandling((category) => conversionFactorsRepo.getByCategory(category), "getConversionFactorsByCategory"),
  getConversionFactorById: withErrorHandling((id) => conversionFactorsRepo.getById(id), "getConversionFactorById"),
  updateConversionFactor: withErrorHandling(
    (id, newValue, modifiedBy, notes) => conversionFactorsRepo.updateFactor(id, newValue, modifiedBy, notes),
    "updateConversionFactor"
  ),
  getAllConversionFactorHistory: withErrorHandling(() => conversionFactorsRepo.getAllHistory(), "getAllConversionFactorHistory"),
  getBroilerMeatConversionFactor: withErrorHandling(() => conversionFactorsRepo.getBroilerMeatFactor(), "getBroilerMeatConversionFactor"),
  getCountryChickenMeatConversionFactor: withErrorHandling(() => conversionFactorsRepo.getCountryChickenMeatFactor(), "getCountryChickenMeatConversionFactor"),

  getDailySetup: withErrorHandling(() => dailySetupRepo.getCurrent(), "getDailySetup"),
  saveDailySetup: withErrorHandling((setupData) => dailySetupRepo.save(setupData), "saveDailySetup"),
  isDaySetupValid: withErrorHandling((currentDate) => dailySetupRepo.isValid(currentDate), "isDaySetupValid"),
  clearDaySetup: withErrorHandling(() => dailySetupRepo.clear(), "clearDaySetup"),

  getBills: withErrorHandling(() => billsRepo.getAll(), "getBills"),
  getBillsForCurrentDay: withErrorHandling(() => billsRepo.getCurrentDayBills(dailySetupRepo), "getBillsForCurrentDay"),
  addBill: withErrorHandling((billData) => billsRepo.addBill(billData), "addBill"),
  updateBill: withErrorHandling((updatedBill) => billsRepo.update(updatedBill), "updateBill"),
  deleteBill: withErrorHandling((billId) => billsRepo.delete(billId), "deleteBill"),

  getUsers: withErrorHandling(() => usersRepo.getAll(), "getUsers"),
  addUser: withErrorHandling((userData) => usersRepo.add(userData), "addUser"),
  getUserByUsername: withErrorHandling((username) => usersRepo.getByUsername(username), "getUserByUsername"),

  getProducts: withErrorHandling(() => productsRepo.getAll(), "getProducts"),
  addProduct: withErrorHandling((product) => productsRepo.add(product), "addProduct"),
  updateProduct: withErrorHandling((product) => productsRepo.update(product), "updateProduct"),

  getRegularCustomers: withErrorHandling(() => regularCustomersRepo.getAll(), "getRegularCustomers"),
  addRegularCustomer: withErrorHandling((customer) => regularCustomersRepo.add(customer), "addRegularCustomer"),
  updateRegularCustomer: withErrorHandling((customer) => regularCustomersRepo.update(customer), "updateRegularCustomer"),
  deleteRegularCustomer: withErrorHandling((id) => regularCustomersRepo.delete(id), "deleteRegularCustomer"),

  getPriceHistory: withErrorHandling(() => priceHistoryRepo.getAll(), "getPriceHistory"),
  savePriceHistory: withErrorHandling((history) => priceHistoryRepo.update(history), "savePriceHistory"),

  getExpenseCategories: withErrorHandling(() => expenseCategoryRepo.getAll(), "getExpenseCategories"),
  getExpenses: withErrorHandling(() => expenseRepo.getAll(), "getExpenses"),

  getClosedDay: withErrorHandling(() => closedDayRepo.getMostRecent(), "getClosedDay"),
  saveDailyClosing: withErrorHandling((closingData) => operationsService.saveDailyClosing(closingData), "saveDailyClosing"),
  getDailyClosings: withErrorHandling(() => dailyClosingRepo.getAll(), "getDailyClosings"),

  initializeConversionFactors: withErrorHandling(() => conversionFactorsRepo.initialize(), "initializeConversionFactors"),
  startNewDaySetup: withErrorHandling(() => operationsService.startNewDaySetup(), "startNewDaySetup"),
  clearAllData: withErrorHandling(() => operationsService.clearAllData(), "clearAllData"),
  migrateFromLocalStorage: withErrorHandling((progressCallback) => migrationService.migrateFromLocalStorage(progressCallback), "migrateFromLocalStorage"),

  // Store references
  STORES,
};

// Export store names for use in other modules
export { STORES };
