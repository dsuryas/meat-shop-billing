// repositories/ExpenseCategoryRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class ExpenseCategoryRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.EXPENSE_CATEGORIES);
  }
}
