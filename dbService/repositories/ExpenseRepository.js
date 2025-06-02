// repositories/ExpenseRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class ExpenseRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.EXPENSES);
  }

  async getForDay(date) {
    const expenses = await this.getAll();
    const targetDate = new Date(date).toISOString().split("T")[0];

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.timestamp).toISOString().split("T")[0];
      return expenseDate === targetDate;
    });
  }
}
