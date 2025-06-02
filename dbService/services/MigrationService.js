// MigrationService.js - Service for migrating data from localStorage to IndexedDB

import { STORES } from "../config";

/**
 * Service for migrating data from localStorage to IndexedDB
 */
export class MigrationService {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   */
  constructor(dataAccess) {
    this.dataAccess = dataAccess;
  }

  /**
   * Migrate data from localStorage to IndexedDB
   * @param {Function|null} progressCallback - Callback for migration progress updates
   * @returns {Promise<boolean>} Success state
   */
  async migrateFromLocalStorage(progressCallback = null) {
    try {
      if (progressCallback) progressCallback("Starting migration from localStorage", 0);

      // Check for localStorage data
      const hasLocalData = Object.keys(localStorage).some((key) => key.startsWith("meatShop_"));
      if (!hasLocalData) {
        if (progressCallback) progressCallback("No data to migrate", 100);
        return true;
      }

      const migrationSteps = [
        { name: "conversion factors", key: "meatShop_conversionFactors", store: STORES.CONVERSION_FACTORS, progress: 10 },
        { name: "daily setup", key: "meatShop_dailySetup", store: STORES.DAILY_SETUP, progress: 20 },
        { name: "bills", key: "meatShop_bills", store: STORES.BILLS, progress: 30 },
        { name: "daily closings", key: "meatShop_dailyClosings", store: STORES.DAILY_CLOSINGS, progress: 40 },
        { name: "closed day", key: "meatShop_closedDay", store: STORES.CLOSED_DAY, progress: 50 },
        { name: "users", key: "meatShop_users", store: STORES.USERS, progress: 60 },
        { name: "products", key: "meatShop_products", store: STORES.PRODUCTS, progress: 70 },
        { name: "price history", key: "meatShop_priceHistory", store: STORES.PRICE_HISTORY, progress: 75 },
        { name: "regular customers", key: "meatShop_regularCustomers", store: STORES.REGULAR_CUSTOMERS, progress: 80 },
        { name: "expense categories", key: "meatShop_expenseCategories", store: STORES.EXPENSE_CATEGORIES, progress: 90 },
        { name: "expenses", key: "meatShop_expenses", store: STORES.EXPENSES, progress: 95 },
      ];

      // Process each step
      for (const step of migrationSteps) {
        if (progressCallback) progressCallback(`Migrating ${step.name}`, step.progress);

        const localData = localStorage.getItem(step.key);
        if (localData) {
          const data = JSON.parse(localData);

          // Handle array data
          if (Array.isArray(data)) {
            for (const item of data) {
              await this.dataAccess.addItem(step.store, item);
            }
          }
          // Handle object data
          else {
            await this.dataAccess.updateItem(step.store, data);
          }
        }
      }

      if (progressCallback) progressCallback("Migration complete", 100);
      return true;
    } catch (error) {
      console.error("Error during migration:", error);
      if (progressCallback) progressCallback(`Migration failed: ${error.message}`, -1);
      return false;
    }
  }
}
