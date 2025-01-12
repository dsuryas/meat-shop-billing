import React, { createContext, useState } from "react";

export const AuthContext = createContext(null);

// Sample users data
const initialUsers = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "staff1", password: "staff123", role: "staff" },
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(initialUsers);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const login = (username, password) => {
    const foundUser = users.find(
      (u) => u.username === username && u.password === password
    );

    if (foundUser) {
      setUser(foundUser);
      setError("");
      return true;
    } else {
      setError("Invalid username or password");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const addUser = (newUser) => {
    if (users.some((u) => u.username === newUser.username)) {
      return false;
    }
    setUsers([...users, newUser]);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addUser, error }}>
      {children}
    </AuthContext.Provider>
  );
};
