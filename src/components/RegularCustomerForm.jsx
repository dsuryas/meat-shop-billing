import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { Pencil, Trash, Users } from "lucide-react";

const RegularCustomerForm = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    withSkinRate: "",
    withoutSkinRate: "",
    sellingPrice: "",
  });

  useEffect(() => {
    // Load customers from localStorage
    const savedCustomers = localStorage.getItem("meatShop_regularCustomers");
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers));
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.name || !formData.phone) {
      setMessage("Customer name and phone are required");
      return;
    }

    if (!formData.withSkinRate || !formData.withoutSkinRate || !formData.sellingPrice) {
      setMessage("All rate fields are required");
      return;
    }

    // Convert inputs to numbers for validation
    const withSkinRate = Number(formData.withSkinRate);
    const withoutSkinRate = Number(formData.withoutSkinRate);
    const sellingPrice = Number(formData.sellingPrice);

    if (isNaN(withSkinRate) || isNaN(withoutSkinRate) || isNaN(sellingPrice) || withSkinRate <= 0 || withoutSkinRate <= 0 || sellingPrice <= 0) {
      setMessage("All rates must be positive numbers");
      return;
    }

    let updatedCustomers;

    if (editingCustomer) {
      // Update existing customer
      updatedCustomers = customers.map((customer) => (customer.id === editingCustomer.id ? { ...formData, id: editingCustomer.id } : customer));
      setMessage("Customer updated successfully!");
    } else {
      // Check if phone number already exists
      if (customers.some((customer) => customer.phone === formData.phone)) {
        setMessage("A customer with this phone number already exists");
        return;
      }

      // Add new customer
      const newCustomer = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      updatedCustomers = [...customers, newCustomer];
      setMessage("Customer added successfully!");
    }

    // Save to localStorage
    localStorage.setItem("meatShop_regularCustomers", JSON.stringify(updatedCustomers));
    setCustomers(updatedCustomers);

    // Reset form
    setFormData({
      name: "",
      phone: "",
      withSkinRate: "",
      withoutSkinRate: "",
      sellingPrice: "",
    });
    setEditingCustomer(null);
    setShowForm(false);

    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      withSkinRate: customer.withSkinRate,
      withoutSkinRate: customer.withoutSkinRate,
      sellingPrice: customer.sellingPrice,
    });
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      const updatedCustomers = customers.filter((customer) => customer.id !== customerId);
      localStorage.setItem("meatShop_regularCustomers", JSON.stringify(updatedCustomers));
      setCustomers(updatedCustomers);
      setMessage("Customer deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      phone: "",
      withSkinRate: "",
      withoutSkinRate: "",
      sellingPrice: "",
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Regular Customers</h2>
        {!showForm && <Button onClick={() => setShowForm(true)}>Add Regular Customer</Button>}
      </div>

      {message && (
        <Alert className="bg-blue-50">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCustomer ? "Edit Customer" : "Add Regular Customer"}</CardTitle>
            <CardDescription>{editingCustomer ? "Update customer details and rates" : "Create a new regular customer with specific rates"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Name *</label>
                  <Input placeholder="Enter full name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input placeholder="Enter phone number" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">With Skin Conversion Rate *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    value={formData.withSkinRate}
                    onChange={(e) => handleInputChange("withSkinRate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Without Skin Conversion Rate *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    value={formData.withoutSkinRate}
                    onChange={(e) => handleInputChange("withoutSkinRate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selling Price (₹/kg) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  {editingCustomer ? "Update Customer" : "Add Customer"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          {/* <CardTitle>Regular Customers List</CardTitle> */}
          <CardDescription>Manage your regular customers and their rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With Skin Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Without Skin Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.withSkinRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.withoutSkinRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(customer.sellingPrice).toFixed(2)}/kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(customer.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && (
              <div className="text-center py-12">
                <p className="mt-2 text-sm font-medium text-gray-900">No regular customers</p>
                <p className="mt-1 text-sm text-gray-500">Add your first regular customer to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegularCustomerForm;
