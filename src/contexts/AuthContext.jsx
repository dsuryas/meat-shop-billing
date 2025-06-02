import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children, dbService }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [databaseError, setDatabaseError] = useState(null);
  const [showDatabaseDiagnostic, setShowDatabaseDiagnostic] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    setError("");
    setDatabaseError(null);

    try {
      console.log("Initializing authentication system...");

      // First, try to initialize the database
      const dbInitSuccess = await dbService.initDatabase();
      if (!dbInitSuccess) {
        throw new Error("Database initialization failed");
      }

      // Load users from database
      await loadUsers();

      // Check for existing session
      const savedUser = localStorage.getItem("meatShop_currentUser");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setIsAuthenticated(true);
        console.log("Restored user session:", userData.username);
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
      setDatabaseError(error.message);

      // Check if it's a database-related error
      if (error.message.includes("object store") || error.message.includes("IndexedDB") || error.message.includes("Database")) {
        setShowDatabaseDiagnostic(true);
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log("Loading users from database...");
      const loadedUsers = await dbService.users.getAll();
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      console.log(`Loaded ${loadedUsers?.length || 0} users`);
    } catch (error) {
      console.error("Error loading users:", error);
      throw new Error(`Failed to load users: ${error.message}`);
    }
  };

  const login = async (username, password) => {
    setError("");

    try {
      if (databaseError) {
        setError("Database is not available. Please resolve database issues first.");
        return false;
      }

      const user = await dbService.users.getByUsername(username);

      if (!user) {
        setError("Invalid username or password");
        return false;
      }

      if (user.password !== password) {
        setError("Invalid username or password");
        return false;
      }

      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;

      setCurrentUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem("meatShop_currentUser", JSON.stringify(userWithoutPassword));

      console.log("User logged in successfully:", username);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("meatShop_currentUser");
    console.log("User logged out");
  };

  const addUser = async (userData) => {
    try {
      if (databaseError) {
        setError("Database is not available. Cannot add user.");
        return false;
      }

      // Check if username already exists
      const existingUser = users.find((u) => u.username === userData.username);
      if (existingUser) {
        setError("Username already exists");
        return false;
      }

      const newUser = {
        ...userData,
        createdAt: new Date().toISOString(),
      };

      await dbService.users.add(newUser);
      await loadUsers(); // Reload users list

      console.log("User added successfully:", userData.username);
      return true;
    } catch (error) {
      console.error("Error adding user:", error);
      setError("Failed to add user. Please try again.");
      return false;
    }
  };

  const handleDatabaseRecovery = async () => {
    console.log("Handling database recovery...");
    setShowDatabaseDiagnostic(false);
    setDatabaseError(null);
    await initializeAuth();
  };

  // If there's a database error and we're showing diagnostics, don't render the normal auth flow
  if (showDatabaseDiagnostic) {
    return (
      <AuthContext.Provider
        value={{
          currentUser: null,
          users: [],
          isAuthenticated: false,
          isLoading: false,
          error: "",
          databaseError,
          showDatabaseDiagnostic: true,
          login: () => false,
          logout: () => {},
          addUser: () => false,
          handleDatabaseRecovery,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated,
        isLoading,
        error,
        databaseError,
        showDatabaseDiagnostic: false,
        login,
        logout,
        addUser,
        handleDatabaseRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
