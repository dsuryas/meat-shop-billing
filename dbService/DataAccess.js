// DataAccess.js - Generic data access layer

/**
 * Provides generic CRUD operations for IndexedDB
 */
export class DataAccess {
  /**
   * @param {DatabaseManager} dbManager - Database connection manager
   */
  constructor(dbManager) {
    this.dbManager = dbManager;
  }

  /**
   * Add an item to a store
   * @param {string} storeName - Name of the store
   * @param {Object} item - Item to add
   * @returns {Promise<Object>} Added item
   */
  async addItem(storeName, item) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(item);
      request.onerror = (event) => reject(new Error(`Failed to add item to ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Update an item in a store
   * @param {string} storeName - Name of the store
   * @param {Object} item - Item to update
   * @returns {Promise<Object>} Updated item
   */
  async updateItem(storeName, item) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = (event) => reject(new Error(`Failed to update item in ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Get all items from a store
   * @param {string} storeName - Name of the store
   * @returns {Promise<Array>} All items in the store
   */
  async getAllItems(storeName) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(new Error(`Failed to get items from ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Get an item by its key
   * @param {string} storeName - Name of the store
   * @param {string|number} key - Key of the item
   * @returns {Promise<Object|null>} Found item or null
   */
  async getItemByKey(storeName, key) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(new Error(`Failed to get item from ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Delete an item by its key
   * @param {string} storeName - Name of the store
   * @param {string|number} key - Key of the item
   * @returns {Promise<boolean>} Success state
   */
  async deleteItemByKey(storeName, key) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(new Error(`Failed to delete item from ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Clear all items from a store
   * @param {string} storeName - Name of the store
   * @returns {Promise<boolean>} Success state
   */
  async clearStore(storeName) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(new Error(`Failed to clear ${storeName}: ${event.target.error}`));
    });
  }

  /**
   * Get items using an index
   * @param {string} storeName - Name of the store
   * @param {string} indexName - Name of the index
   * @param {*} value - Value to search for
   * @returns {Promise<Array>} Matching items
   */
  async getItemsByIndex(storeName, indexName, value) {
    const db = await this.dbManager.getConnection();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(new Error(`Failed to get items by index from ${storeName}: ${event.target.error}`));
    });
  }
}
