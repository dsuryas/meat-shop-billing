# Modular IndexedDB Implementation Guide

This guide explains how to implement the modular IndexedDB architecture with proper separation of concerns.

## File Structure

```
src/
└── utils/
    └── db/
        ├── index.js                       # Main entry point that exports dbService
        ├── config.js                      # Database configuration constants
        ├── DatabaseManager.js             # Database connection management
        ├── DataAccess.js                  # Generic data access layer
        ├── defaultData.js                 # Default data for initialization
        ├── repositories/                  # Entity-specific repositories
        │   ├── BaseRepository.js          # Base class for all repositories
        │   ├── ConversionFactorsRepository.js
        │   ├── DailySetupRepository.js
        │   ├── BillsRepository.js
        │   ├── UsersRepository.js
        │   └── ... (other repositories)
        └── services/                      # Additional services
            ├── MigrationService.js        # Data migration from localStorage
            └── OperationsService.js       # Composite operations
```

## Installation Steps

### 1. Create the directory structure

```bash
mkdir -p src/utils/db/repositories
mkdir -p src/utils/db/services
```

### 2. Copy the files

Copy each file to its corresponding location:

```bash
# Configuration
cp config.js src/utils/db/
cp defaultData.js src/utils/db/

# Core classes
cp DatabaseManager.js src/utils/db/
cp DataAccess.js src/utils/db/

# Base repository
cp repositories/BaseRepository.js src/utils/db/repositories/

# Entity repositories
cp repositories/ConversionFactorsRepository.js src/utils/db/repositories/
cp repositories/DailySetupRepository.js src/utils/db/repositories/
cp repositories/BillsRepository.js src/utils/db/repositories/
cp repositories/UsersRepository.js src/utils/db/repositories/

# Services
cp services/MigrationService.js src/utils/db/services/
cp services/OperationsService.js src/utils/db/services/

# Main entry point
cp index.js src/utils/db/
```

### 3. Update storage.js to use the new db service

Update your `storage.js` file to import from the new modular structure:

```javascript
// Old import
import { dbService } from "./db";

// New import
import { dbService } from "./db/index";
```

## Creating Additional Repositories

To create additional repositories for other entities:

1. Create a new file in the `repositories` directory
2. Extend the `BaseRepository` class
3. Implement entity-specific methods
4. Import and register the repository in the `index.js` file

### Example for creating a new repository

```javascript
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

  // Add more entity-specific methods as needed
}
```

Then add it to `index.js`:

```javascript
// In index.js
import { ProductsRepository } from "./repositories/ProductsRepository";

// Create repository instance
const productsRepo = new ProductsRepository(dataAccess);

// Add to repositories collection
const repositories = {
  // ... existing repositories
  products: productsRepo,
};

// Add to dbService facade
export const dbService = {
  // ... existing properties

  products: {
    getAll: () => productsRepo.getAll(),
    getById: (id) => productsRepo.getById(id),
    getActiveProducts: () => productsRepo.getActiveProducts(),
    add: (product) => productsRepo.add(product),
    update: (product) => productsRepo.update(product),
    delete: (id) => productsRepo.delete(id),
  },

  // Backwards compatibility
  getProducts: () => productsRepo.getAll(),
  addProduct: (productData) => productsRepo.add(productData),
  updateProduct: (updatedProduct) => productsRepo.update(updatedProduct),
};
```

## Adding Composite Operations

For operations that span multiple repositories:

1. Add the operation to the `OperationsService` class
2. Expose the operation through the `operations` property of the `dbService` facade

### Example for adding a new operation

```javascript
// In services/OperationsService.js
async myNewOperation(param1, param2) {
  try {
    // Operation that uses multiple repositories
    const data1 = await this.repositories.repo1.someMethod(param1);
    const data2 = await this.repositories.repo2.otherMethod(param2);

    // Process data and return result
    return { result: data1 + data2 };
  } catch (error) {
    console.error("Error in myNewOperation:", error);
    return null;
  }
}
```

Then expose it in `index.js`:

```javascript
// In index.js, update the operations property
operations: {
  // ... existing operations
  myNewOperation: (param1, param2) => operationsService.myNewOperation(param1, param2),
},
```

## Using the Database Service

### Modern repository-based approach

```javascript
import { dbService } from "../../utils/db";

// Using repository APIs
const factors = await dbService.conversionFactors.getByCategory("broiler");
await dbService.bills.add(newBill);
const currentSetup = await dbService.dailySetup.getCurrent();

// Using composite operations
await dbService.operations.saveDailyClosing(closingData);
```

### Backwards compatibility

```javascript
import { dbService } from "../../utils/db";

// Using legacy API methods
const factors = await dbService.getConversionFactorsByCategory("broiler");
await dbService.addBill(newBill);
const currentSetup = await dbService.getDailySetup();
```

## Best Practices

1. **Single Responsibility**: Each repository should focus on one entity type
2. **Domain Logic**: Keep business logic in repositories, not in components
3. **Proper Error Handling**: All async methods should have try/catch blocks
4. **Consistent Methods**: Follow naming conventions across all repositories
5. **Immutability**: Don't mutate data received from or returned to components
6. **Logging**: Log errors with meaningful context for debugging
7. **Testing**: Write unit tests for repositories and services

## Extending the System

As your application grows, you can extend this modular architecture by:

1. Adding new repositories for new entity types
2. Adding new service classes for additional cross-cutting concerns
3. Adding new operations that combine multiple repositories
4. Enhancing the database schema in the `DatabaseManager` class

This modular design makes your codebase more maintainable and allows for easier extension and testing.
