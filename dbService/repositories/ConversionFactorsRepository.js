// ConversionFactorsRepository.js - Repository for conversion factors

import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";
import { DEFAULT_CONVERSION_FACTORS } from "../defaultData";

/**
 * Repository for managing conversion factors
 */
export class ConversionFactorsRepository extends BaseRepository {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   */
  constructor(dataAccess) {
    super(dataAccess, STORES.CONVERSION_FACTORS);
  }

  /**
   * Get conversion factors by category
   * @param {string} category - Category (e.g., 'broiler', 'country')
   * @returns {Promise<Array>} Matching conversion factors
   */
  async getByCategory(category) {
    return await this.dataAccess.getItemsByIndex(this.storeName, "category", category);
  }

  /**
   * Update a conversion factor with history tracking
   * @param {string} id - Factor ID
   * @param {number} newValue - New factor value
   * @param {string|null} modifiedBy - User who modified it
   * @param {string|null} notes - Change notes
   * @returns {Promise<boolean>} Success state
   */
  async updateFactor(id, newValue, modifiedBy = null, notes = null) {
    try {
      const factor = await this.getById(id);
      if (!factor) {
        console.error(`Conversion factor with id ${id} not found`);
        return false;
      }

      // Only update if the value has changed
      if (factor.value === newValue) {
        return true; // No change needed
      }

      // Add current value to history before updating
      const historicalEntry = {
        value: factor.value,
        timestamp: factor.updatedAt,
        modifiedBy: factor.lastModifiedBy || "System",
        notes: factor.lastModifiedNotes || "Initial value",
      };

      // Create updated factor
      const updatedFactor = {
        ...factor,
        value: newValue,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: modifiedBy,
        lastModifiedNotes: notes,
        history: [historicalEntry, ...factor.history],
      };

      // Update in the database
      await this.update(updatedFactor);
      return true;
    } catch (error) {
      console.error(`Error updating conversion factor ${id}:`, error);
      return false;
    }
  }

  /**
   * Get flattened history of all conversion factors
   * @returns {Promise<Array>} Conversion factor history
   */
  async getAllHistory() {
    try {
      const factors = await this.getAll();

      // Create a flat history array with factor identification
      const history = factors.flatMap((factor) => {
        // Create an entry for the current value
        const currentEntry = {
          id: factor.id,
          name: factor.name,
          value: factor.value,
          timestamp: factor.updatedAt,
          modifiedBy: factor.lastModifiedBy || "System",
          notes: factor.lastModifiedNotes || "Initial value",
          isCurrent: true,
          category: factor.category,
        };

        // Map history entries
        const historyEntries = factor.history.map((entry) => ({
          id: factor.id,
          name: factor.name,
          value: entry.value,
          timestamp: entry.timestamp,
          modifiedBy: entry.modifiedBy || "System",
          notes: entry.notes || "",
          isCurrent: false,
          category: factor.category,
        }));

        return [currentEntry, ...historyEntries];
      });

      // Sort by timestamp, most recent first
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error("Error getting conversion factor history:", error);
      return [];
    }
  }

  /**
   * Initialize conversion factors if they don't exist
   * @returns {Promise<boolean>} Success state
   */
  async initialize() {
    try {
      const factors = await this.getAll();
      if (factors.length === 0) {
        for (const factor of DEFAULT_CONVERSION_FACTORS) {
          await this.add(factor);
        }
      }
      return true;
    } catch (error) {
      console.error("Error initializing conversion factors:", error);
      return false;
    }
  }

  /**
   * Get broiler meat conversion factor
   * @returns {Promise<number>} Factor value
   */
  async getBroilerMeatFactor() {
    const factor = await this.getById("broilerMeatConversion");
    return factor ? factor.value : 1.45;
  }

  /**
   * Get country chicken meat conversion factor
   * @returns {Promise<number>} Factor value
   */
  async getCountryChickenMeatFactor() {
    const factor = await this.getById("countryMeatConversion");
    return factor ? factor.value : 1.65;
  }
}
