import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { getExpenseCategories, saveExpenseCategories } from "../utils/storage";

/**
 * ExpenseCategoryManagement component allows admins to manage expense categories
 * that will be used when collecting expenses during day closing
 */
const ExpenseCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Load expense categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load expense categories from storage
  const loadCategories = async () => {
    const savedCategories = await getExpenseCategories();
    setCategories(savedCategories);
  };

  // Handle input change for new/editing category
  const handleInputChange = (field, value) => {
    if (editingIndex >= 0) {
      // Editing existing category
      const updatedCategories = [...categories];
      updatedCategories[editingIndex] = {
        ...updatedCategories[editingIndex],
        [field]: value,
      };
      setCategories(updatedCategories);
    } else {
      // Adding new category
      setNewCategory({
        ...newCategory,
        [field]: value,
      });
    }
  };

  // Add a new expense category
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      setMessage("Category name is required");
      setIsSuccess(false);
      return;
    }

    // Check for duplicate category name
    if (categories.some((cat) => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      setMessage("A category with this name already exists");
      setIsSuccess(false);
      return;
    }

    const categoryToAdd = {
      id: Date.now(),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCategories = [...categories, categoryToAdd];
    saveExpenseCategories(updatedCategories);
    setCategories(updatedCategories);
    setNewCategory({ name: "", description: "" });
    setMessage("Category added successfully");
    setIsSuccess(true);

    // Clear success message after a few seconds
    setTimeout(() => {
      if (isSuccess) setMessage("");
    }, 3000);
  };

  // Start editing a category
  const handleEditCategory = (index) => {
    setEditingIndex(index);
  };

  // Save edited category
  const handleSaveEdit = () => {
    if (!categories[editingIndex].name.trim()) {
      setMessage("Category name is required");
      setIsSuccess(false);
      return;
    }

    // Check for duplicate category name (excluding the current one being edited)
    const isDuplicate = categories.some((cat, idx) => idx !== editingIndex && cat.name.toLowerCase() === categories[editingIndex].name.toLowerCase());

    if (isDuplicate) {
      setMessage("A category with this name already exists");
      setIsSuccess(false);
      return;
    }

    // Update the category with new updatedAt timestamp
    const updatedCategories = [...categories];
    updatedCategories[editingIndex] = {
      ...updatedCategories[editingIndex],
      updatedAt: new Date().toISOString(),
    };

    saveExpenseCategories(updatedCategories);
    setCategories(updatedCategories);
    setEditingIndex(-1);
    setMessage("Category updated successfully");
    setIsSuccess(true);

    // Clear success message after a few seconds
    setTimeout(() => {
      if (isSuccess) setMessage("");
    }, 3000);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reload categories to discard changes
    loadCategories();
    setEditingIndex(-1);
  };

  // Delete a category
  const handleDeleteCategory = (index) => {
    if (window.confirm("Are you sure you want to delete this expense category?")) {
      const updatedCategories = [...categories];
      updatedCategories.splice(index, 1);
      saveExpenseCategories(updatedCategories);
      setCategories(updatedCategories);
      setMessage("Category deleted successfully");
      setIsSuccess(true);

      // Clear success message after a few seconds
      setTimeout(() => {
        if (isSuccess) setMessage("");
      }, 3000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories Management</CardTitle>
        <CardDescription>Configure expense categories for day closing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Add/Edit Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{editingIndex >= 0 ? "Edit Category" : "Add New Category"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name *</label>
                <Input
                  placeholder="Enter category name"
                  value={editingIndex >= 0 ? categories[editingIndex].name : newCategory.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter category description"
                  value={editingIndex >= 0 ? categories[editingIndex].description : newCategory.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                {editingIndex >= 0 ? (
                  <>
                    <Button onClick={handleSaveEdit}>Save Changes</Button>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddCategory}>Add Category</Button>
                )}
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">No expense categories configured. Add your first category above.</div>
            ) : (
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div key={category.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        {category.description && <p className="text-sm text-gray-600 mt-1">{category.description}</p>}
                        <p className="text-xs text-gray-500 mt-2">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                          {category.updatedAt && ` • Updated: ${new Date(category.updatedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditCategory(index)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(index)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <Alert className={isSuccess ? "bg-green-50" : "bg-red-50"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseCategoryManagement;
