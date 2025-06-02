// repositories/ProductsRepository.js
import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";

export class ProductsRepository extends BaseRepository {
  constructor(dataAccess) {
    super(dataAccess, STORES.PRODUCTS);
  }

  async getActiveProducts() {
    const products = await this.getAll();
    return products.filter((product) => product.isActive);
  }
}
