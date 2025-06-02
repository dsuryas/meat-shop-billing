// asyncUtil.js - Utilities for managing async operations in the React components
import React from "react";

// Custom hook to use async function with loading/error states
export const useAsyncOperation = (asyncFn, defaultValue = null) => {
  const [data, setData] = React.useState(defaultValue);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const execute = async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      console.error("Async operation error:", err);
      setError(err.message || "Operation failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(defaultValue);
      setError(null);
    },
  };
};

// Helper to run an async operation with default error handling
export const runAsyncOperation = async (asyncFn, errorMessage = "Operation failed") => {
  try {
    return await asyncFn();
  } catch (err) {
    console.error(errorMessage, err);
    throw new Error(errorMessage);
  }
};

// Helper to wrap multiple async operations in a single transaction
export const batchAsyncOperations = async (operations) => {
  try {
    const results = await Promise.all(operations.map((op) => op()));
    return results;
  } catch (err) {
    console.error("Batch operations failed:", err);
    throw new Error("Failed to complete all operations");
  }
};

// Helper for sequential async operations
export const sequentialAsyncOperations = async (operations) => {
  const results = [];
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (err) {
      console.error("Sequential operation failed:", err);
      throw err;
    }
  }
  return results;
};

// React hook to load data once component mounts
export const useAsyncDataLoader = (asyncFn, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const result = await asyncFn();

        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        console.error("Data loading error:", err);
        if (mounted) {
          setError(err.message || "Failed to load data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refresh: () => setLoading(true) };
};

export default {
  useAsyncOperation,
  runAsyncOperation,
  batchAsyncOperations,
  sequentialAsyncOperations,
  useAsyncDataLoader,
};
