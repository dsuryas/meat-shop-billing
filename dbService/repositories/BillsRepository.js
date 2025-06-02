// BillsRepository.js - Repository for bills

import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

/**
 * Repository for managing bills
 */
export class BillsRepository extends BaseRepository {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   */
  constructor(dataAccess) {
    super(dataAccess, STORES.BILLS);
  }

  /**
   * Get bills for a specific day
   * @param {string} date - Date in ISO format
   * @returns {Promise<Array>} Bills for the specified day
   */
  async getForDay(date) {
    try {
      const bills = await this.getAll();
      const targetDate = new Date(date).toISOString().split("T")[0];

      return bills.filter((bill) => {
        const billDate = new Date(bill.timestamp).toISOString().split("T")[0];
        return billDate === targetDate;
      });
    } catch (error) {
      console.error("Error getting bills for day:", error);
      return [];
    }
  }

  /**
   * Get bills for the current day
   * @param {DailySetupRepository} dailySetupRepo - Daily setup repository
   * @returns {Promise<Array>} Bills for the current day
   */
  async getCurrentDayBills(dailySetupRepo) {
    try {
      const setup = await dailySetupRepo.getCurrent();
      if (!setup) return await this.getAll();

      return await this.getForDay(setup.date);
    } catch (error) {
      console.error("Error getting bills for current day:", error);
      return [];
    }
  }

  /**
   * Add a new bill
   * @param {Object} billData - Bill data
   * @returns {Promise<Object|null>} Added bill or null on failure
   */
  async addBill(billData) {
    try {
      const newBill = {
        ...billData,
        id: billData.id || Date.now(),
        billNumber: billData.billNumber || `BILL-${Date.now()}`,
        timestamp: billData.timestamp || new Date().toISOString(),
      };

      await this.add(newBill);
      return newBill;
    } catch (error) {
      console.error("Error adding bill:", error);
      return null;
    }
  }
}
