// repositories/PriceHistoryRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class PriceHistoryRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.PRICE_HISTORY);
  }

  async getLatestPrices() {
    const history = await this.getAll();
    if (history.length === 0) return null;

    // Sort by date and return most recent
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    return history[0];
  }
}
