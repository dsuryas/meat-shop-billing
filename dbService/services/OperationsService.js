// OperationsService.js - Service for composite operations

/**
 * Service for composite operations that span multiple repositories
 */
export class OperationsService {
  /**
   * @param {Object} repositories - Repository instances
   */
  constructor(repositories) {
    this.repositories = repositories;
  }

  /**
   * Save daily closing data
   * @param {Object} closingData - Closing data
   * @returns {Promise<boolean>} Success state
   */
  async saveDailyClosing(closingData) {
    try {
      // 1. Save to daily closings collection
      await this.repositories.dailyClosings.update(closingData);

      // 2. Get current setup and bills
      const dailySetup = await this.repositories.dailySetup.getCurrent();
      const bills = await this.repositories.bills.getCurrentDayBills(this.repositories.dailySetup);

      // 3. Create closed day record
      const closedDayData = {
        date: closingData.date,
        setup: dailySetup,
        bills: bills,
        closingData: closingData,
      };

      // 4. Save closed day record
      await this.repositories.closedDay.update(closedDayData);
      return true;
    } catch (error) {
      console.error("Error saving daily closing:", error);
      return false;
    }
  }

  /**
   * Start new day setup
   * @returns {Promise<boolean>} Success state
   */
  async startNewDaySetup() {
    try {
      // 1. Get current setup and bills
      const currentSetup = await this.repositories.dailySetup.getCurrent();
      const currentBills = await this.repositories.bills.getCurrentDayBills(this.repositories.dailySetup);

      // 2. Only save if we have data
      if (currentSetup && currentBills.length > 0) {
        await this.repositories.closedDay.update({
          date: currentSetup.date,
          setup: currentSetup,
          bills: currentBills,
        });
      }

      // 3. Clear current setup
      await this.repositories.dailySetup.clear();

      return true;
    } catch (error) {
      console.error("Error starting new day setup:", error);
      return false;
    }
  }

  /**
   * Clear all data from all stores
   * @returns {Promise<boolean>} Success state
   */
  async clearAllData() {
    try {
      for (const repository of Object.values(this.repositories)) {
        if (repository.clear && typeof repository.clear === "function") {
          await repository.clear();
        }
      }
      return true;
    } catch (error) {
      console.error("Error clearing all data:", error);
      return false;
    }
  }
}
