// DailySetupRepository.js - Repository for daily setup

import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing daily setup
 */
export class DailySetupRepository extends BaseRepository {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   */
  constructor(dataAccess) {
    super(dataAccess, STORES.DAILY_SETUP);
  }

  /**
   * Get current daily setup
   * @returns {Promise<Object|null>} Current daily setup or null
   */
  async getCurrent() {
    try {
      const setups = await this.getAll();
      if (setups.length === 0) return null;

      // Sort by date and return the most recent one
      setups.sort((a, b) => new Date(b.date) - new Date(a.date));
      return setups[0];
    } catch (error) {
      console.error("Error getting current daily setup:", error);
      return null;
    }
  }

  /**
   * Check if daily setup is valid for the current date
   * @param {Date} currentDate - Date to check against
   * @returns {Promise<boolean>} Whether setup is valid
   */
  async isValid(currentDate) {
    try {
      const setup = await this.getCurrent();
      if (!setup) return false;

      // Compare only the date part (yyyy-mm-dd)
      const setupDate = new Date(setup.date).toISOString().split("T")[0];
      const today = currentDate.toISOString().split("T")[0];

      return setupDate === today;
    } catch (error) {
      console.error("Error checking day setup validity:", error);
      return false;
    }
  }

  /**
   * Save daily setup
   * @param {Object} setupData - Setup data
   * @returns {Promise<Object|null>} Saved setup or null on failure
   */
  async save(setupData) {
    try {
      const setupWithMeta = {
        ...setupData,
        hasClosedDay: setupData.hasClosedDay || false,
        date: setupData.date || new Date().toISOString(),
      };

      await this.update(setupWithMeta);
      return setupWithMeta;
    } catch (error) {
      console.error("Error saving daily setup:", error);
      return null;
    }
  }
}
