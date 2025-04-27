import React from "react";
import PropTypes from "prop-types";

/**
 * ProductSection component handles the product type selection part of the billing form
 * including chicken type, sale type, and product type
 */
const ProductSection = ({
  billingOption,
  rates,
  saleType,
  chickenType,
  customerSellingPrice,
  handleInputChange,
  shouldShowChickenTypeSelector,
  shouldShowSaleTypeSelector,
  shouldShowWholesaleOptions,
  productType,
  conversionFactors,
  ProductTypeSelector,
}) => {
  return (
    <>
      {/* Chicken Type Selector - Only if not already on country chicken */}
      {shouldShowChickenTypeSelector(billingOption) && (
        <div>
          <label className="text-sm font-medium">Chicken Type *</label>
          <select value={chickenType} onChange={(e) => handleInputChange("chickenType", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
            <option value="broiler">Broiler Chicken</option>
            <option value="country">Country Chicken</option>
          </select>
          <div className="mt-1 flex items-center">
            <div className="text-xs text-gray-500 mr-2">Conversion Factor:</div>
            <div className="text-xs font-medium">{chickenType === "country" ? conversionFactors.countryChicken : conversionFactors.broiler}</div>
          </div>
        </div>
      )}

      {/* Sale Type Selector for Country Chicken */}
      {shouldShowSaleTypeSelector(billingOption) && (
        <div>
          <label className="text-sm font-medium">Sale Type *</label>
          <select value={saleType} onChange={(e) => handleInputChange("saleType", e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md">
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
          </select>
          <div className="mt-1 text-xs text-gray-500">
            {saleType === "retail" ? "Retail pricing for individual customers" : "Wholesale pricing for bulk orders"}
          </div>
        </div>
      )}

      {/* Customer selling price for wholesale */}
      {shouldShowWholesaleOptions(billingOption, saleType) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Price (₹/kg)</label>
          <input
            type="number"
            step="0.01"
            placeholder="Enter additional price per kg"
            value={customerSellingPrice}
            onChange={(e) => handleInputChange("customerSellingPrice", e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
          <div className="text-xs text-gray-500">Additional per kg price on top of the paper rate</div>
        </div>
      )}

      {/* Product Type Selection */}
      <ProductTypeSelector
        billingOption={billingOption}
        rates={rates}
        saleType={saleType}
        productType={productType}
        onChange={(value) => handleInputChange("productType", value)}
      />
    </>
  );
};

ProductSection.propTypes = {
  billingOption: PropTypes.object.isRequired,
  rates: PropTypes.object.isRequired,
  saleType: PropTypes.string.isRequired,
  chickenType: PropTypes.string.isRequired,
  customerSellingPrice: PropTypes.string.isRequired,
  handleInputChange: PropTypes.func.isRequired,
  shouldShowChickenTypeSelector: PropTypes.func.isRequired,
  shouldShowSaleTypeSelector: PropTypes.func.isRequired,
  shouldShowWholesaleOptions: PropTypes.func.isRequired,
  productType: PropTypes.string.isRequired,
  conversionFactors: PropTypes.object.isRequired,
  ProductTypeSelector: PropTypes.elementType.isRequired,
};

export default ProductSection;
