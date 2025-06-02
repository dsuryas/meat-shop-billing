# Separation of Concerns in the Database Layer

The database implementation has been refactored to follow a clean separation of concerns. This document explains the architecture and how it improves maintainability and testability.

## Architecture Overview

The architecture is based on multiple layers, each with a specific responsibility:

1. **Database Configuration**: Constants and settings
2. **Core Database Operations**: Low-level database access
3. **Domain-Specific Repositories**: Business logic for each entity
4. **Migration Service**: Data migration management
5. **Database Service Facade**: Public API for the application

```
┌────────────────────────────────────────────────────────────┐
│ Database Service Facade (dbService)                        │
└───────────────────────────┬────────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────┐
│ ┌─────────────────┐  ┌────┴───────────┐  ┌────────────────┐│
│ │ Repositories    │  │ Operations     │  │ Migration      ││
│ │ - Conversion    │  │ - dailyClosing │  │ Service        ││
│ │ - DailySetup    │  │ - newDaySetup  │  │                ││
│ │ - Bills         │  │ - clearAll     │  │                ││
│ │ - Users         │  └────────────────┘  └────────────────┘│
│ │ - etc.          │                                        │
│ └────────┬────────┘                                        │
└──────────┼─────────────────────────────────────────────────┘
           │
┌──────────┼─────────────────────────────────────────────────┐
│ ┌────────┴────────┐                                        │
│ │ Data Access     │                                        │
│ │ - addItem       │                                        │
│ │ - updateItem    │                                        │
│ │ - getAllItems   │                                        │
│ │ - etc.          │                                        │
│ └────────┬────────┘                                        │
└──────────┼─────────────────────────────────────────────────┘
           │
┌──────────┼─────────────────────────────────────────────────┐
│ ┌────────┴────────┐                                        │
│ │ DatabaseManager │                                        │
│ │ - getConnection │                                        │
│ │ - closeConn     │                                        │
│ │ - etc.          │                                        │
│ └─────────────────┘                                        │
└────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Database Configuration

```javascript
// Constants for database names and structure
const DB_NAME = "MeatShopDB";
const DB_VERSION = 1;
export const STORES = { ... };
```

### 2. Database Manager

Handles the database connection lifecycle:

```javascript
class DatabaseManager {
  constructor() { ... }
  isSupported() { ... }
  getConnection() { ... }
  _openDatabase() { ... }
  _createObjectStores(db) { ... }
  closeConnection() { ... }
}
```

### 3. Data Access Layer

Provides generic CRUD operations:

```javascript
class DataAccess {
  constructor(dbManager) { ... }
  async addItem(storeName, item) { ... }
  async updateItem(storeName, item) { ... }
  async getAllItems(storeName) { ... }
  async getItemByKey(storeName, key) { ... }
  async deleteItemByKey(storeName, key) { ... }
  async clearStore(storeName) { ... }
  async getItemsByIndex(storeName, indexName, value) { ... }
}
```

### 4. Domain-Specific Repositories

Each entity type gets its own repository with business logic:

```javascript
// Base Repository with common functionality
class BaseRepository { ... }

// Specialized repositories with domain-specific logic
class ConversionFactorsRepository extends BaseRepository { ... }
class DailySetupRepository extends BaseRepository { ... }
class BillsRepository extends BaseRepository { ... }
// etc.
```

### 5. Migration Service

Handles data migration from localStorage:

```javascript
class MigrationService {
  constructor(dataAccess) { ... }
  async migrateFromLocalStorage(progressCallback) { ... }
}
```

### 6. Database Service Facade

Provides a unified public API:

```javascript
export const dbService = {
  // Direct repository methods
  conversionFactors: { ... },
  dailySetup: { ... },
  bills: { ... },
  // etc.

  // Composite operations
  operations: { ... },

  // Backwards compatibility methods
  getConversionFactors: () => ...,
  getConversionFactorsByCategory: (category) => ...,
  // etc.
};
```

## Benefits of This Architecture

### 1. Single Responsibility Principle

Each class has a single responsibility:

- `DatabaseManager`: Manage database connections
- `DataAccess`: Handle generic CRUD operations
- `Repositories`: Implement business logic for entities
- `MigrationService`: Handle data migration

### 2. Dependency Injection

Dependencies are injected rather than created inside classes:

- `DataAccess` depends on `DatabaseManager`
- Each repository depends on `DataAccess`
- The facade creates and composes all dependencies

### 3. Encapsulation

Implementation details are hidden behind interfaces:

- Direct IndexedDB access is encapsulated in `DatabaseManager`
- Generic CRUD operations are encapsulated in `DataAccess`
- Entity-specific logic is encapsulated in repositories

### 4. Testability

The architecture supports better testing:

- Each layer can be tested in isolation
- Dependencies can be mocked for unit tests
- Business logic is separate from database access

### 5. Maintainability

Code is more maintainable because:

- Changes to one layer don't affect others
- New functionality can be added without modifying existing code
- Implementation details can change without affecting the public API
- Each component has a clear purpose and scope

### 6. Backwards Compatibility

The facade provides compatibility with the existing codebase:

- Legacy methods are preserved as thin wrappers
- Both new and old code can coexist during transition
- Gradual migration path is supported

## Usage Examples

### Using the Repository-Based API

```javascript
// Get conversion factors by category
const broilerFactors = await dbService.conversionFactors.getByCategory("broiler");

// Save daily setup
await dbService.dailySetup.save(setupData);

// Add a new bill
await dbService.bills.add(billData);
```

### Using the Compatibility API

```javascript
// Legacy code continues to work
const factors = await dbService.getConversionFactors();
const setup = await dbService.getDailySetup();
await dbService.saveDailyClosing(closingData);
```

## Conclusion

This architecture provides a clean separation of concerns that improves code quality and maintainability. The layered approach allows for better testing, easier debugging, and more flexible evolution of the codebase over time.
