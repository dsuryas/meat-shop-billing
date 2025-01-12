import React, { useContext } from "react";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";

const App = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <LoginForm />;
  }

  return user.role === "admin" ? <AdminDashboard /> : <StaffDashboard />;
};

const Root = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default Root;
