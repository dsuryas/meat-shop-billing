import React, { useState, useContext, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { UserPlus, Users, LogOut } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const PriceManagement = React.lazy(() => import("./PriceManagement"));

const AdminDashboard = () => {
  const { logout, addUser } = useContext(AuthContext);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "staff",
  });
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // users, prices

  const handleAddUser = (e) => {
    e.preventDefault();
    if (addUser(newUser)) {
      setMessage("User added successfully!");
      setNewUser({ username: "", password: "", role: "staff" });
    } else {
      setMessage("Username already exists!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 bg-white shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="mb-6 flex space-x-4">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            Manage Users
          </Button>
          <Button
            variant={activeTab === "prices" ? "default" : "outline"}
            onClick={() => setActiveTab("prices")}
          >
            Manage Prices
          </Button>
        </div>

        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Staff User</CardTitle>
                <CardDescription>
                  Add new billing staff accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) =>
                        setNewUser({ ...newUser, username: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </form>
                {message && (
                  <Alert className="mt-4">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff Overview</CardTitle>
                <CardDescription>Quick stats about your staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Users className="h-8 w-8" />
                  <div>
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-gray-500">Active Staff Members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "prices" && (
          <Suspense fallback={<div>Loading...</div>}>
            <PriceManagement />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
