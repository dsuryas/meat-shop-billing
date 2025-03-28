// React import is needed for JSX transformation
import React from "react";
import PropTypes from "prop-types";
import { Input } from "../ui/input";

/**
 * CustomerSection component handles the customer information part of the billing form
 * including name, phone, and dropdown for regular customers
 */
const CustomerSection = ({
  customerName,
  customerPhone,
  showCustomerDropdown,
  filteredCustomers,
  handleInputChange,
  handleSelectCustomer,
  shouldShowWholesaleOptions,
  saleType,
  billingOption,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="relative">
        <label className="text-sm font-medium">Customer Name *</label>
        <Input placeholder="Enter or search name" value={customerName} onChange={(e) => handleInputChange("customerName", e.target.value)} className="mt-1" />
        {/* Customer dropdown for wholesale */}
        {shouldShowWholesaleOptions(billingOption, saleType) && showCustomerDropdown && (
          <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSelectCustomer(customer)}>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Phone Number *</label>
        <Input placeholder="Enter phone" value={customerPhone} onChange={(e) => handleInputChange("customerPhone", e.target.value)} className="mt-1" />
      </div>
    </div>
  );
};

CustomerSection.propTypes = {
  customerName: PropTypes.string.isRequired,
  customerPhone: PropTypes.string.isRequired,
  showCustomerDropdown: PropTypes.bool.isRequired,
  filteredCustomers: PropTypes.array.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleSelectCustomer: PropTypes.func.isRequired,
  shouldShowWholesaleOptions: PropTypes.func.isRequired,
  saleType: PropTypes.string.isRequired,
  billingOption: PropTypes.object.isRequired,
};

export default CustomerSection;
