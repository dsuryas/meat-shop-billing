// repositories/DailyClosingRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class DailyClosingRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.DAILY_CLOSINGS);
  }
}
