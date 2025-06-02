// defaultData.js - Default data for database initialization

// Default conversion factors
export const DEFAULT_CONVERSION_FACTORS = [
  // Broiler Chicken Factors
  {
    id: "broilerMeatConversion",
    name: "Broiler Meat Conversion",
    value: 1.45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to meat weight ratio for broiler chicken",
    category: "broiler",
  },
  {
    id: "broilerWithSkinConversion",
    name: "Broiler With Skin Conversion",
    value: 1.25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to with-skin weight ratio for broiler chicken",
    category: "broiler",
  },
  {
    id: "broilerWithoutSkinConversion",
    name: "Broiler Without Skin Conversion",
    value: 1.35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to without-skin weight ratio for broiler chicken",
    category: "broiler",
  },

  // Country Chicken Factors
  {
    id: "countryMeatConversion",
    name: "Country Chicken Meat Conversion",
    value: 1.65,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to meat weight ratio for country chicken",
    category: "country",
  },
  {
    id: "countryWithSkinConversion",
    name: "Country Chicken With Skin Conversion",
    value: 1.45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to with-skin weight ratio for country chicken",
    category: "country",
  },
  {
    id: "countryWithoutSkinConversion",
    name: "Country Chicken Without Skin Conversion",
    value: 1.55,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
    description: "Live weight to without-skin weight ratio for country chicken",
    category: "country",
  },
];

// Default user (created if no users exist)
export const DEFAULT_ADMIN_USER = {
  username: "admin",
  password: "admin",
  role: "admin",
  createdAt: new Date().toISOString(),
};

// Export any other default data as needed
