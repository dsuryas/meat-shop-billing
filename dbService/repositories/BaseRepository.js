// BaseRepository.js - Base repository with common functionality

/**
 * Base repository class with common CRUD methods
 * All entity-specific repositories should extend this class
 */
export class BaseRepository {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   * @param {string} storeName - Store name for this repository
   */
  constructor(dataAccess, storeName) {
    this.dataAccess = dataAccess;
    this.storeName = storeName;
  }

  /**
   * Get all items from the store
   * @returns {Promise<Array>} All items
   */
  async getAll() {
    return await this.dataAccess.getAllItems(this.storeName);
  }

  /**
   * Get an item by its ID/key
   * @param {string|number} id - Item ID/key
   * @returns {Promise<Object|null>} Item or null if not found
   */
  async getById(id) {
    return await this.dataAccess.getItemByKey(this.storeName, id);
  }

  /**
   * Add a new item
   * @param {Object} item - Item to add
   * @returns {Promise<Object>} Added item
   */
  async add(item) {
    return await this.dataAccess.addItem(this.storeName, item);
  }

  /**
   * Update an existing item
   * @param {Object} item - Item to update
   * @returns {Promise<Object>} Updated item
   */
  async update(item) {
    return await this.dataAccess.updateItem(this.storeName, item);
  }

  /**
   * Delete an item by its ID/key
   * @param {string|number} id - Item ID/key
   * @returns {Promise<boolean>} Success state
   */
  async delete(id) {
    return await this.dataAccess.deleteItemByKey(this.storeName, id);
  }

  /**
   * Clear all items from the store
   * @returns {Promise<boolean>} Success state
   */
  async clear() {
    return await this.dataAccess.clearStore(this.storeName);
  }
}
