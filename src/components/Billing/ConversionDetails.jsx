import React from "react";
import {
  calculateWithSkinWeight,
  calculateWithoutSkinWeight,
  calculateWithSkinPricePerKg,
  calculateWithoutSkinPricePerKg,
  calculateWithSkinPrice,
  calculateWithoutSkinPrice,
} from "./BillingUtilities";

/**
 * Component for displaying wholesale conversion details
 * Shows with-skin and without-skin conversion information
 */
const ConversionDetails = ({ billData, basePrice }) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-800 mb-3">Conversion Details</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="border-r border-blue-200 pr-4">
          <h4 className="font-medium text-blue-700 mb-2">With Skin</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Conversion Rate:</td>
                <td className="py-1 font-medium text-right">{billData.withSkinRate}</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Price Per Kg:</td>
                <td className="py-1 font-medium text-right">
                  ₹{calculateWithSkinPricePerKg(billData.withSkinRate, basePrice, billData.customerSellingPrice, billData.discountPerKg)}
                </td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Converted Weight:</td>
                <td className="py-1 font-medium text-right">{calculateWithSkinWeight(billData.weight, billData.withSkinRate)} kg</td>
              </tr>
              <tr>
                <td className="py-1 text-blue-600 italic">Total Price:</td>
                <td className="py-1 font-bold text-right">
                  ₹{calculateWithSkinPrice(billData.weight, billData.withSkinRate, basePrice, billData.customerSellingPrice, billData.discountPerKg)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="font-medium text-blue-700 mb-2">Without Skin</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Conversion Rate:</td>
                <td className="py-1 font-medium text-right">{billData.withoutSkinRate}</td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Price Per Kg:</td>
                <td className="py-1 font-medium text-right">
                  ₹{calculateWithoutSkinPricePerKg(billData.withoutSkinRate, basePrice, billData.customerSellingPrice, billData.discountPerKg)}
                </td>
              </tr>
              <tr className="border-b border-blue-100">
                <td className="py-1 text-blue-600 italic">Converted Weight:</td>
                <td className="py-1 font-medium text-right">{calculateWithoutSkinWeight(billData.weight, billData.withoutSkinRate)} kg</td>
              </tr>
              <tr>
                <td className="py-1 text-blue-600 italic">Total Price:</td>
                <td className="py-1 font-bold text-right">
                  ₹{calculateWithoutSkinPrice(billData.weight, billData.withoutSkinRate, basePrice, billData.customerSellingPrice, billData.discountPerKg)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-blue-200 text-xs text-blue-600">
        <h4 className="text-sm text-blue-700 mb-2">Without Conversion</h4>
        <div>
          Base Rate: ₹{basePrice}/kg + Customer Price: ₹{billData.customerSellingPrice}/kg - Discount: ₹{billData.discountPerKg || 0}/kg
        </div>
        <div>
          Final Customer Price: ₹{(Number(basePrice) + Number(billData.customerSellingPrice) - Number(billData.discountPerKg || 0)).toFixed(2)}
          /kg
        </div>
      </div>
    </div>
  );
};

export default ConversionDetails;
