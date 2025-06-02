// UsersRepository.js - Repository for users

import { STORES } from "../config";
import { BaseRepository } from "./BaseRepository";
import { DEFAULT_ADMIN_USER } from "../defaultData";

/**
 * Repository for managing users
 */
export class UsersRepository extends BaseRepository {
  /**
   * @param {DataAccess} dataAccess - Data access layer
   */
  constructor(dataAccess) {
    super(dataAccess, STORES.USERS);
  }

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null if not found
   */
  async getByUsername(username) {
    return await this.getById(username);
  }

  /**
   * Initialize default admin user if no users exist
   * @returns {Promise<boolean>} Success state
   */
  async initializeDefaultUser() {
    try {
      console.log("Checking for existing users...");
      const users = await this.getAll();
      console.log(`Found ${users.length} existing users`);

      if (users.length === 0) {
        console.log("No users found, creating default admin user");
        const defaultUser = {
          ...DEFAULT_ADMIN_USER,
          createdAt: new Date().toISOString(),
        };

        await this.add(defaultUser);
        console.log("Default admin user created successfully");
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error initializing default user:", error);
      return false;
    }
  }
}
