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
 * BillingForm component - Updated to handle async conversion factors
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
    isLoadingFactors,
    factorsError,
    handleInputChange,
    handleSelectCustomer,
    setMessage,
    shouldShowConversions,
    shouldShowChickenTypeSelector,
    shouldShowSaleTypeSelector,
    shouldShowWholesaleOptions,
    calculateDiscountFromPrice,
  } = useBillingForm(billingOption, rates, onBillGenerate, editData, weightType);

  // Show loading state while conversion factors are being loaded
  if (isLoadingFactors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Billing Form...</CardTitle>
          <CardDescription>Please wait while we load conversion factors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading conversion factors...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if conversion factors failed to load
  if (factorsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Billing Form</CardTitle>
          <CardDescription>There was an issue loading conversion factors</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Warning: Using default conversion factors. Some calculations may not be accurate.
              <br />
              Error: {factorsError.message}
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => window.location.reload()} className="flex-1">
              Retry
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom submit handler to include stock validation
  const handleSubmit = async (e) => {
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

    if (Number(billData.amountPaid) < 0) {
      setMessage("Amount paid cannot be negative");
      return;
    }

    if (billData.paymentType !== "partial" && Number(billData.amountPaid) !== Number(billData.price)) {
      setMessage("Amount paid must equal total price for full payment");
      return;
    }

    if (billData.paymentType === "partial" && Number(billData.amountPaid) >= Number(billData.price)) {
      setMessage("Partial payment must be less than total price");
      return;
    }

    try {
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
        withoutSkinPricePerKg: calculateWithoutSkinPricePerKg(
          billData.withoutSkinRate,
          currentBasePrice,
          billData.customerSellingPrice,
          billData.discountPerKg
        ),
        // Store the conversion factor used for this bill for reference
        usedConversionFactor: CONVERSION_FACTOR,
        // Add timestamp for tracking
        timestamp: new Date().toISOString(),
      };

      await onBillGenerate(billWithMetadata);
    } catch (error) {
      console.error("Error generating bill:", error);
      setMessage("Error generating bill. Please try again.");
    }
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
          <div className="text-xs text-gray-500 mt-1">
            Conversion Factor: {CONVERSION_FACTOR} ({billData.chickenType === "country" ? "Country Chicken" : "Broiler"})
          </div>
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

          {/* Stock Information */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-700">
              <div>
                Available Stock: {billData.chickenType === "country" ? currentCountryStock : currentStock}kg ({weightType} weight)
              </div>
              {billData.weight && (
                <div className="mt-1">
                  Required Stock: {weightType === "meat" ? (Number(billData.weight) / CONVERSION_FACTOR).toFixed(3) : billData.weight}kg
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={isLoadingFactors}>
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
