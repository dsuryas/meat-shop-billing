import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Receipt, Pencil } from "lucide-react";

const BillsTable = ({ bills, onEditBill, isAdmin, isReadOnly = false }) => {
  // Format the date and time for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <Card>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Live weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meat weight</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birds</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                {!isReadOnly && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill, index) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(bill.timestamp)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{bill.customerName}</div>
                    <div className="text-xs text-gray-400">{bill.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.productType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(bill.weight).toFixed(2)} kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(bill.meatWeight || 0).toFixed(2)} kg</td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.rawWeight && bill.inventoryWeight ? Number(bill.inventoryWeight).toFixed(2) : (Number(bill.weight) / 1.45).toFixed(2)} kg
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.numberOfBirds}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(bill.basePrice).toFixed(2)}/kg</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.discountPerKg ? `₹${Number(bill.discountPerKg).toFixed(2)}/kg` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{Number(bill.price).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          bill.paymentType === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : bill.paymentType === "cash"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {bill.paymentType}
                      </span>
                      {bill.paymentType === "partial" && (
                        <div className="text-xs text-gray-500">
                          <div>Paid: ₹{Number(bill.amountPaid).toFixed(2)}</div>
                          <div>Balance: ₹{Number(bill.balanceAmount).toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Button variant="ghost" size="sm" onClick={() => onEditBill(bill)} disabled={!isAdmin && bill.paymentType !== "partial"}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bills.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bills</h3>
            <p className="mt-1 text-sm text-gray-500">No bills have been generated today.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BillsTable;
