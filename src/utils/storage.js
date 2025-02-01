const STORAGE_KEYS = {
  DAILY_SETUP: "meatShop_dailySetup",
  BILLS: "meatShop_bills",
  PRODUCTS: "meatShop_products",
  USERS: "meatShop_users",
  DAILY_CLOSINGS: "meatShop_dailyClosings",
  CLOSED_DAY: "meatShop_closedDay",
};

export const MEAT_CONVERSION_FACTOR = 1.45;

// Daily Setup Functions
export const saveDailySetup = (setupData) => {
  const setupWithMeta = {
    ...setupData,
    hasClosedDay: false,
    date: setupData.date || new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.DAILY_SETUP, JSON.stringify(setupWithMeta));
  return setupWithMeta;
};

export const getDailySetup = () => {
  const setup = localStorage.getItem(STORAGE_KEYS.DAILY_SETUP);
  return setup ? JSON.parse(setup) : null;
};

export const isDaySetupValid = (date) => {
  const setup = getDailySetup();
  if (!setup) return false;

  const setupDate = new Date(setup.date);
  const targetDate = new Date(date);

  return (
    setupDate.getDate() === targetDate.getDate() &&
    setupDate.getMonth() === targetDate.getMonth() &&
    setupDate.getFullYear() === targetDate.getFullYear()
  );
};

// Bills Functions
export const getBills = () => {
  try {
    const billsStr = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!billsStr) return [];
    const bills = JSON.parse(billsStr);
    return Array.isArray(bills) ? bills : [];
  } catch (error) {
    console.error("Error getting bills:", error);
    return [];
  }
};

export const saveBills = (bills) => {
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  return bills;
};

export const addBill = (billData) => {
  const bills = getBills();
  const newBill = {
    ...billData,
    id: Date.now(),
    billNumber: `BILL-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updatedBills = [newBill, ...bills];
  saveBills(updatedBills);
  return newBill;
};

export const updateBill = (updatedBill) => {
  const bills = getBills();
  const updatedBills = bills.map((bill) =>
    bill.id === updatedBill.id ? { ...bill, ...updatedBill } : bill
  );
  saveBills(updatedBills);
  return updatedBills;
};

export const deleteBill = (billId) => {
  const bills = getBills();
  const updatedBills = bills.filter((bill) => bill.id !== billId);
  saveBills(updatedBills);
  return updatedBills;
};

// Products Functions
export const getProducts = () => {
  const products = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return products ? JSON.parse(products) : [];
};

export const saveProducts = (products) => {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  return products;
};

export const addProduct = (productData) => {
  const products = getProducts();
  const newProduct = {
    ...productData,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  const updatedProducts = [...products, newProduct];
  saveProducts(updatedProducts);
  return newProduct;
};

export const updateProduct = (updatedProduct) => {
  const products = getProducts();
  const updatedProducts = products.map((product) =>
    product.id === updatedProduct.id
      ? { ...product, ...updatedProduct }
      : product
  );
  saveProducts(updatedProducts);
  return updatedProducts;
};

// Users Functions
export const getUsers = () => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return users;
};

// Daily Closing Functions
export const saveClosedDay = (dayData) => {
  localStorage.setItem(STORAGE_KEYS.CLOSED_DAY, JSON.stringify(dayData));
};

export const getClosedDay = () => {
  const closedDay = localStorage.getItem(STORAGE_KEYS.CLOSED_DAY);
  return closedDay ? JSON.parse(closedDay) : null;
};

export const clearClosedDay = () => {
  localStorage.removeItem(STORAGE_KEYS.CLOSED_DAY);
};

export const saveDailyClosing = (closingData) => {
  try {
    const closings = getDailyClosings();
    const updatedClosings = [closingData, ...closings];
    localStorage.setItem(
      STORAGE_KEYS.DAILY_CLOSINGS,
      JSON.stringify(updatedClosings)
    );
    // Also save as the current closed day
    saveClosedDay(closingData);
    return true;
  } catch (error) {
    console.error("Error saving daily closing:", error);
    return false;
  }
};

export const getDailyClosings = () => {
  try {
    const closings = localStorage.getItem(STORAGE_KEYS.DAILY_CLOSINGS);
    return closings ? JSON.parse(closings) : [];
  } catch (error) {
    console.error("Error getting daily closings:", error);
    return [];
  }
};

// Clear Functions
export const clearDaySetup = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DAILY_SETUP);
    localStorage.removeItem(STORAGE_KEYS.BILLS);
    return true;
  } catch (error) {
    console.error("Error clearing daily setup:", error);
    return false;
  }
};

export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};

// Date Utility Functions
export const isDifferentDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  );
};

export const checkNeedsDailySetup = () => {
  const setup = getDailySetup();
  if (!setup) return true;

  // If closed day exists and it's not a new day, don't need setup
  const closedDay = getClosedDay();
  if (closedDay && !isDifferentDay(closedDay.date, new Date())) {
    return false;
  }

  // Check if it's a new day
  return isDifferentDay(setup.date, new Date());
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
