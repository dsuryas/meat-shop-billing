// repositories/RegularCustomersRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class RegularCustomersRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.REGULAR_CUSTOMERS);
  }

  async getByPhone(phone) {
    try {
      return await this.dataAccess.getItemsByIndex(this.storeName, "phone", phone);
    } catch (error) {
      console.error("Error getting customer by phone:", error);
      return null;
    }
  }
}
