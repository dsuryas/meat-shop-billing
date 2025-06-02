// DatabaseManager.js - Enhanced Database connection management with better error handling

import { DB_NAME, DB_VERSION, STORES } from "./config";

/**
 * Manages database connections and schema with enhanced error handling
 */
export class DatabaseManager {
  constructor() {
    this.dbPromise = null;
    this.isInitialized = false;
  }

  /**
   * Check if IndexedDB is supported by the browser
   * @returns {boolean} Whether IndexedDB is supported
   */
  isSupported() {
    return "indexedDB" in window;
  }

  /**
   * Delete the entire database (for recovery purposes)
   * @returns {Promise<boolean>} Success state
   */
  deleteDatabase() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("IndexedDB is not supported in this browser"));
        return;
      }

      console.log("Deleting database for recovery...");
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

      deleteRequest.onsuccess = () => {
        console.log("Database deleted successfully");
        this.dbPromise = null;
        this.isInitialized = false;
        resolve(true);
      };

      deleteRequest.onerror = (event) => {
        console.error("Error deleting database:", event.target.error);
        reject(new Error(`Failed to delete database: ${event.target.error}`));
      };

      deleteRequest.onblocked = () => {
        console.warn("Database deletion blocked - close other tabs/windows using this app");
        reject(new Error("Database deletion blocked"));
      };
    });
  }

  /**
   * Check if all required object stores exist
   * @param {IDBDatabase} db - Database connection
   * @returns {boolean} Whether all stores exist
   */
  validateDatabaseSchema(db) {
    const requiredStores = Object.values(STORES);
    const existingStores = Array.from(db.objectStoreNames);

    console.log("Required stores:", requiredStores);
    console.log("Existing stores:", existingStores);

    const missingStores = requiredStores.filter((store) => !existingStores.includes(store));

    if (missingStores.length > 0) {
      console.error("Missing object stores:", missingStores);
      return false;
    }

    return true;
  }

  /**
   * Get a database connection (create if doesn't exist)
   * @returns {Promise<IDBDatabase>} Database connection
   */
  getConnection() {
    if (!this.dbPromise) {
      this.dbPromise = this._openDatabase();
    }
    return this.dbPromise;
  }

  /**
   * Force reinitialize the database connection
   * @returns {Promise<IDBDatabase>} Database connection
   */
  async reinitialize() {
    console.log("Reinitializing database connection...");
    this.dbPromise = null;
    this.isInitialized = false;
    return this.getConnection();
  }

  /**
   * Open a connection to the database with recovery mechanisms
   * @private
   * @returns {Promise<IDBDatabase>} Database connection
   */
  _openDatabase() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error("IndexedDB is not supported in this browser"));
        return;
      }

      console.log(`Opening database: ${DB_NAME} version ${DB_VERSION}`);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        const error = event.target.error;
        console.error("Database error:", error);
        reject(new Error(`Database error: ${error}`));
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log("Database opened successfully");

        // Validate schema
        if (!this.validateDatabaseSchema(db)) {
          console.error("Database schema validation failed - attempting recovery");
          db.close();

          // Try to recover by deleting and recreating the database
          this.deleteDatabase()
            .then(() => {
              console.log("Attempting to recreate database after deletion");
              return this._openDatabase();
            })
            .then(resolve)
            .catch(reject);
          return;
        }

        this.isInitialized = true;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        console.log("Database upgrade needed");
        const db = event.target.result;

        try {
          this._createObjectStores(db);
          console.log("Object stores created successfully");
        } catch (error) {
          console.error("Error creating object stores:", error);
          reject(new Error(`Failed to create object stores: ${error.message}`));
        }
      };

      request.onblocked = (event) => {
        console.warn("Database opening blocked - close other tabs/windows using this app");
        // Don't reject immediately, give user a chance to close other tabs
        setTimeout(() => {
          reject(new Error("Database opening blocked - please close other tabs using this application"));
        }, 5000);
      };
    });
  }

  /**
   * Create object stores during database initialization or upgrade
   * @private
   * @param {IDBDatabase} db - Database connection
   */
  _createObjectStores(db) {
    console.log("Creating object stores...");

    // Conversion Factors store
    if (!db.objectStoreNames.contains(STORES.CONVERSION_FACTORS)) {
      console.log("Creating conversion factors store");
      const conversionStore = db.createObjectStore(STORES.CONVERSION_FACTORS, { keyPath: "id" });
      conversionStore.createIndex("category", "category", { unique: false });
    }

    // Daily Setup store
    if (!db.objectStoreNames.contains(STORES.DAILY_SETUP)) {
      console.log("Creating daily setup store");
      db.createObjectStore(STORES.DAILY_SETUP, { keyPath: "date" });
    }

    // Bills store
    if (!db.objectStoreNames.contains(STORES.BILLS)) {
      console.log("Creating bills store");
      const billsStore = db.createObjectStore(STORES.BILLS, { keyPath: "id" });
      billsStore.createIndex("timestamp", "timestamp", { unique: false });
      billsStore.createIndex("category", "category", { unique: false });
      billsStore.createIndex("chickenType", "chickenType", { unique: false });
    }

    // Daily Closings store
    if (!db.objectStoreNames.contains(STORES.DAILY_CLOSINGS)) {
      console.log("Creating daily closings store");
      db.createObjectStore(STORES.DAILY_CLOSINGS, { keyPath: "date" });
    }

    // Closed Day store
    if (!db.objectStoreNames.contains(STORES.CLOSED_DAY)) {
      console.log("Creating closed day store");
      db.createObjectStore(STORES.CLOSED_DAY, { keyPath: "date" });
    }

    // Users store
    if (!db.objectStoreNames.contains(STORES.USERS)) {
      console.log("Creating users store");
      const usersStore = db.createObjectStore(STORES.USERS, { keyPath: "username" });
      usersStore.createIndex("role", "role", { unique: false });
    }

    // Products store
    if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
      console.log("Creating products store");
      const productsStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: "id" });
      productsStore.createIndex("isActive", "isActive", { unique: false });
    }

    // Price History store
    if (!db.objectStoreNames.contains(STORES.PRICE_HISTORY)) {
      console.log("Creating price history store");
      db.createObjectStore(STORES.PRICE_HISTORY, { keyPath: "date" });
    }

    // Regular Customers store
    if (!db.objectStoreNames.contains(STORES.REGULAR_CUSTOMERS)) {
      console.log("Creating regular customers store");
      const customersStore = db.createObjectStore(STORES.REGULAR_CUSTOMERS, { keyPath: "id" });
      customersStore.createIndex("phone", "phone", { unique: true });
      customersStore.createIndex("name", "name", { unique: false });
    }

    // Expense Categories store
    if (!db.objectStoreNames.contains(STORES.EXPENSE_CATEGORIES)) {
      console.log("Creating expense categories store");
      db.createObjectStore(STORES.EXPENSE_CATEGORIES, { keyPath: "id" });
    }

    // Expenses store
    if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
      console.log("Creating expenses store");
      const expensesStore = db.createObjectStore(STORES.EXPENSES, { keyPath: "id" });
      expensesStore.createIndex("timestamp", "timestamp", { unique: false });
      expensesStore.createIndex("categoryId", "categoryId", { unique: false });
    }

    console.log("All object stores created successfully");
  }

  /**
   * Close the database connection
   */
  closeConnection() {
    if (this.dbPromise) {
      this.dbPromise
        .then((db) => {
          if (db && !db.closed) {
            db.close();
            console.log("Database connection closed");
          }
        })
        .catch((error) => {
          console.error("Error closing database:", error);
        });
      this.dbPromise = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get database information for debugging
   * @returns {Promise<Object>} Database info
   */
  async getDatabaseInfo() {
    try {
      const db = await this.getConnection();
      return {
        name: db.name,
        version: db.version,
        objectStoreNames: Array.from(db.objectStoreNames),
        isInitialized: this.isInitialized,
      };
    } catch (error) {
      return {
        error: error.message,
        isInitialized: this.isInitialized,
      };
    }
  }
}
