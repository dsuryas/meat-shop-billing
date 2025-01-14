const STORAGE_KEYS = {
  DAILY_SETUP: "meatShop_dailySetup",
  BILLS: "meatShop_bills",
};

export const saveDailySetup = (setupData) => {
  const setupWithDate = {
    ...setupData,
    date: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.DAILY_SETUP, JSON.stringify(setupWithDate));
  return setupWithDate;
};

export const getDailySetup = () => {
  const setup = localStorage.getItem(STORAGE_KEYS.DAILY_SETUP);
  return setup ? JSON.parse(setup) : null;
};

export const saveBills = (bills) => {
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
};

export const getBills = () => {
  const bills = localStorage.getItem(STORAGE_KEYS.BILLS);
  return bills ? JSON.parse(bills) : [];
};

export const addBill = (billData) => {
  const bills = getBills();
  const newBill = {
    ...billData,
    id: Date.now(),
    billNumber: `BILL-${Date.now()}`,
    date: new Date().toISOString(),
  };

  const updatedBills = [newBill, ...bills];
  saveBills(updatedBills);
  return newBill;
};

export const clearStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.DAILY_SETUP);
  localStorage.removeItem(STORAGE_KEYS.BILLS);
};
