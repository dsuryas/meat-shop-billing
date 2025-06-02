// repositories/ClosedDayRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class ClosedDayRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.CLOSED_DAY);
  }

  async getMostRecent() {
    const closedDays = await this.getAll();
    if (closedDays.length === 0) return null;

    // Sort by date (most recent first) and return the first one
    return closedDays.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }
}
