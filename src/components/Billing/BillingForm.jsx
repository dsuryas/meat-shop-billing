// React import is needed for JSX transformation
import React from "react";
import PropTypes from "prop-types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import ConversionDetails from "./ConversionDetails";
import ProductTypeSelector from "./ProductTypeSelector";
import CustomerSection from "./CustomerSection";
import ProductSection from "./ProductSection";
import PricingSection from "./PricingSection";
import PaymentSection from "./PaymentSection";
import useBillingForm from "./useBillingForm";
import {
  calculateWithSkinWeight,
  calculateWithoutSkinWeight,
  calculateWithSkinPricePerKg,
  calculateWithoutSkinPricePerKg,
  calculateWithSkinPrice,
  calculateWithoutSkinPrice,
} from "./BillingUtilities";

/**
 * BillingForm component - Refactored to use smaller components and custom hook
 */
const BillingForm = ({ rates, billingOption, onBillGenerate, onCancel, editData, weightType, currentStock, currentCountryStock }) => {
  // Use the custom hook to manage form state and logic
  const {
    billData,
    message,
    filteredCustomers,
    showCustomerDropdown,
    conversionFactors,
    CONVERSION_FACTOR,
    currentBasePrice,
    handleInputChange,
    handleSelectCustomer,
    setMessage,
    shouldShowConversions,
    shouldShowChickenTypeSelector,
    shouldShowSaleTypeSelector,
    shouldShowWholesaleOptions,
    calculateDiscountFromPrice,
  } = useBillingForm(billingOption, rates, onBillGenerate, editData, weightType);

  // Custom submit handler to include stock validation
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!billData.customerName || !billData.customerPhone || !billData.weight || !billData.price || !billData.amountPaid || !billData.numberOfBirds) {
      setMessage("Please fill all required fields");
      return;
    }

    if (Number(billData.weight) <= 0) {
      setMessage("Weight must be greater than 0");
      return;
    }

    // Convert weight for stock validation if weightType is meat
    let weightForStockValidation = Number(billData.weight);
    if (weightType === "meat") {
      // Always convert live weight to meat weight for stock comparison
      weightForStockValidation = weightForStockValidation / CONVERSION_FACTOR;
    }

    // Use the appropriate current stock based on chicken type
    const stockToCheck = billData.chickenType === "country" ? currentCountryStock : currentStock;

    if (weightForStockValidation > Number(stockToCheck)) {
      setMessage(`Weight cannot exceed current stock (${stockToCheck}kg ${weightType} weight)`);
      return;
    }

    // Create bill with metadata including conversion details
    const billWithMetadata = {
      ...billData,
      basePrice: currentBasePrice,
      finalPricePerKg: Number(currentBasePrice) + Number(billData.customerSellingPrice || 0) - Number(billData.discountPerKg || 0),
      productName: billingOption.name,
      weightType,
      // Store the raw weight (live weight) and also the weight appropriate for inventory deduction
      rawWeight: Number(billData.weight),
      inventoryWeight: weightType === "meat" ? Number(billData.weight) / CONVERSION_FACTOR : Number(billData.weight),
      meatWeight: Number(billData.weight) / CONVERSION_FACTOR,
      // Include conversion details if available
      withSkinWeight: calculateWithSkinWeight(billData.weight, billData.withSkinRate),
      withoutSkinWeight: calculateWithoutSkinWeight(billData.weight, billData.withoutSkinRate),
      withSkinPrice: calculateWithSkinPrice(billData.weight, billData.withSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      withoutSkinPrice: calculateWithoutSkinPrice(
        billData.weight,
        billData.withoutSkinRate,
        currentBasePrice,
        billData.customerSellingPrice,
        billData.discountPerKg
      ),
      withSkinPricePerKg: calculateWithSkinPricePerKg(billData.withSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      withoutSkinPricePerKg: calculateWithoutSkinPricePerKg(billData.withoutSkinRate, currentBasePrice, billData.customerSellingPrice, billData.discountPerKg),
      // Store the conversion factor used for this bill for reference
      usedConversionFactor: CONVERSION_FACTOR,
    };

    onBillGenerate(billWithMetadata);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Bill - {billingOption.name}</CardTitle>
        <CardDescription>
          {shouldShowWholesaleOptions(billingOption, billData.saleType) ? (
            <>
              Paper Rate: ₹{currentBasePrice}/kg
              {Number(billData.customerSellingPrice) > 0 && <span> + Customer Price: ₹{billData.customerSellingPrice}/kg</span>}
            </>
          ) : (
            <>Base Rate: ₹{currentBasePrice}/kg</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details Section */}
          <CustomerSection
            customerName={billData.customerName}
            customerPhone={billData.customerPhone}
            showCustomerDropdown={showCustomerDropdown}
            filteredCustomers={filteredCustomers}
            handleInputChange={handleInputChange}
            handleSelectCustomer={handleSelectCustomer}
            shouldShowWholesaleOptions={shouldShowWholesaleOptions}
            saleType={billData.saleType}
            billingOption={billingOption}
          />

          {/* Product Selection Section */}
          <ProductSection
            billingOption={billingOption}
            rates={rates}
            saleType={billData.saleType}
            chickenType={billData.chickenType}
            customerSellingPrice={billData.customerSellingPrice}
            handleInputChange={handleInputChange}
            shouldShowChickenTypeSelector={shouldShowChickenTypeSelector}
            shouldShowSaleTypeSelector={shouldShowSaleTypeSelector}
            shouldShowWholesaleOptions={shouldShowWholesaleOptions}
            productType={billData.productType}
            conversionFactors={conversionFactors}
            ProductTypeSelector={ProductTypeSelector}
          />

          {/* Pricing Section */}
          <PricingSection
            weight={billData.weight}
            numberOfBirds={billData.numberOfBirds}
            discountPerKg={billData.discountPerKg}
            price={billData.price}
            handleInputChange={handleInputChange}
            calculateDiscountFromPrice={calculateDiscountFromPrice}
            billingOption={billingOption}
            saleType={billData.saleType}
            currentBasePrice={currentBasePrice}
            customerSellingPrice={billData.customerSellingPrice}
            CONVERSION_FACTOR={CONVERSION_FACTOR}
          />

          {/* Conversion Details for Wholesale */}
          {shouldShowConversions(billingOption, billData.saleType, billData.selectedCustomer, billData.withSkinRate, billData.withoutSkinRate) && (
            <ConversionDetails billData={billData} basePrice={currentBasePrice} />
          )}

          {/* Payment Section */}
          <PaymentSection
            paymentType={billData.paymentType}
            amountPaid={billData.amountPaid}
            balanceAmount={billData.balanceAmount}
            handleInputChange={handleInputChange}
          />

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {editData ? "Update Bill" : "Generate Bill"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>

        {message && (
          <Alert className="mt-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

BillingForm.propTypes = {
  rates: PropTypes.object.isRequired,
  billingOption: PropTypes.object.isRequired,
  onBillGenerate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  editData: PropTypes.object,
  weightType: PropTypes.string.isRequired,
  currentStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentCountryStock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default BillingForm;
