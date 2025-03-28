import React from "react";
import PropTypes from "prop-types";
import { Input } from "../ui/input";

/**
 * PaymentSection component handles the payment part of the billing form
 * including payment type, amount paid, and balance
 */
const PaymentSection = ({ paymentType, amountPaid, balanceAmount, handleInputChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Payment Type *</label>
          <select value={paymentType} onChange={(e) => handleInputChange("paymentType", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="partial">Partial</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Amount Paid (₹) *</label>
          <Input
            type="number"
            step="0.01"
            placeholder="Enter amount"
            value={amountPaid}
            onChange={(e) => handleInputChange("amountPaid", e.target.value)}
            className="mt-1"
            readOnly={paymentType !== "partial"}
          />
        </div>
      </div>

      {/* Balance Display */}
      {paymentType === "partial" && Number(balanceAmount) > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-700">Balance Amount: ₹{balanceAmount}</p>
        </div>
      )}
    </div>
  );
};

PaymentSection.propTypes = {
  paymentType: PropTypes.string.isRequired,
  amountPaid: PropTypes.string.isRequired,
  balanceAmount: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
};

export default PaymentSection;
