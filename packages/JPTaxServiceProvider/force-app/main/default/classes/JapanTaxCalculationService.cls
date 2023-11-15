global class JapanTaxCalculationService implements sfdc_checkout.CartTaxCalculations {
  class JapanTaxServiceProviderException extends Exception {
  }

  class CartItemResult {
    public Decimal amount { get; set; }
    public TaxRate rate { get; set; }
    public CartItem item { get; set; }
  }

  class TaxRateResult {
    public TaxRate rate { get; set; }
    public Decimal total { get; set; }
    public Decimal tax { get; set; }
    public Decimal totalProratedTax { get; set; }
  }

  class CartItemsTax {
    Map<String, TaxRate> taxRateMap;
    Map<String, String> treatmentMap;

    public TaxRate defaultTaxRate;

    // This tax setting is set up by tax.sh
    final String DEFAULT_TAX_CODE = 'defalt_tax';

    public CartItemsTax(List<CartItem> cartItems) {
      List<String> productCodes = new List<String>{};
      for (CartItem cartItem : cartItems) {
        productCodes.add(cartItem.Product2.ProductCode);
      }
      retrieveDefaultTaxRates();
      retrieveTaxRates(productCodes);
    }

    public TaxRate getRateByPoduct2Code(String productCode) {
      String taxCode = this.treatmentMap.get(productCode);
      TaxRate taxRate = this.taxRateMap.get(taxCode);
      return taxRate == null ? this.defaultTaxRate : taxRate;
    }

    private void retrieveDefaultTaxRates() {
      try {
        this.defaultTaxRate = [
          SELECT TaxCode, Rate
          FROM TaxRate
          WHERE TaxCode = :this.DEFAULT_TAX_CODE
          LIMIT 1
        ];
      } catch (Exception e) {
        throw new JapanTaxServiceProviderException(
          'Something wrong with default tax setting.',
          e
        );
      }
    }

    private void retrieveTaxRates(List<String> productCodes) {
      try {
        this.treatmentMap = new Map<String, String>();
        for (TaxTreatment treatment : [
          SELECT ProductCode, TaxCode
          FROM TaxTreatment
          WHERE ProductCode IN :productCodes
        ]) {
          this.treatmentMap.put(treatment.ProductCode, treatment.TaxCode);
        }
        this.taxRateMap = new Map<String, TaxRate>();
        for (TaxRate taxRate : [
          SELECT TaxCode, Rate
          FROM TaxRate
          WHERE TaxCode = :this.treatmentMap.values()
        ]) {
          this.taxRateMap.put(taxRate.TaxCode, taxRate);
        }
      } catch (Exception e) {
        throw new JapanTaxServiceProviderException(
          'Something wrong with tax setting of products.',
          e
        );
      }
    }
  }

  global sfdc_checkout.IntegrationStatus startCartProcessAsync(
    sfdc_checkout.IntegrationInfo jobInfo,
    Id cartId
  ) {
    sfdc_checkout.IntegrationStatus integStatus = new sfdc_checkout.IntegrationStatus();

    try {
      String taxType = [SELECT TaxType FROM WebCart WHERE Id = :cartId][0]
      .TaxType;
      if (taxType != 'Net') {
        throw new JapanTaxServiceProviderException(
          'Japan Tax Service support only Net tax type.'
        );
      }

      // If there are taxes from a previously cancelled checkout, delete them.
      delete [
        SELECT Id
        FROM CartTax
        WHERE CartItemId IN (SELECT Id FROM CartItem WHERE CartId = :cartId)
      ];

      // Get cart items by cart id
      List<CartItem> cartItems = [
        SELECT
          Id,
          Name,
          CartId,
          Product2.Id,
          Product2.ProductCode,
          SalesPrice,
          ListPrice,
          TotalLineAmount,
          TotalAdjustmentAmount,
          TotalPriceAfterAllAdjustments
        FROM CartItem
        WHERE CartId = :cartId
      ];

      // Retrieve tax rate from cart items
      CartItemsTax cartItemsTax = new CartItemsTax(cartItems);

      // List for storing tax rate and amount
      List<CartItemResult> itemList = new List<CartItemResult>{};

      // Map for storing tax rate and total amount by tax rate
      Map<Double, TaxRateResult> rateTotalMap = new Map<Double, TaxRateResult>();

      for (CartItem cartItem : cartItems) {
        // Get tax rate from cart
        TaxRate rate = cartItemsTax.getRateByPoduct2Code(
          cartItem.Product2.ProductCode
        );

        // Calcurate total amount by tax rate
        Decimal total = rateTotalMap.get(rate.Rate) != null
          ? (Decimal) rateTotalMap.get(rate.Rate).total
          : 0;

        // Calcurate total ajusted amount for each item
        Decimal amount = cartItem.TotalAdjustmentAmount == null
          ? (Decimal) cartItem.TotalLineAmount
          : (Decimal) cartItem.TotalLineAmount +
            (Decimal) cartItem.TotalAdjustmentAmount;

        // Make list of item id and CartItemResult
        CartItemResult item = new CartItemResult();
        item.amount = amount;
        item.rate = rate;
        item.item = cartItem;
        itemList.add(item);

        // Make map of tax rate and TaxRateResult
        TaxRateResult taxResult = rateTotalMap.get(rate.Rate);
        if (taxResult == null) {
          taxResult = new TaxRateResult();
          taxResult.rate = rate;
          taxResult.total = total + amount;
          taxResult.totalProratedTax = 0;
          rateTotalMap.put(rate.Rate, taxResult);
        } else {
          taxResult.total = total + amount;
        }
      }

      // Calcurate by tax rate
      for (Double rate : rateTotalMap.keyset()) {
        TaxRateResult result = rateTotalMap.get(rate);
        Decimal tax =
          result.total * ((Decimal) result.rate.Rate / (Decimal) 100);
        result.tax = (Decimal) tax.round(System.RoundingMode.UP);
      }

      // Prorate tax amount to each item and insert them
      CartTax[] cartTaxesToInsert = new List<CartTax>{};
      for (CartItemResult item : itemList) {
        TaxRateResult result = rateTotalMap.get(item.rate.Rate);
        Decimal prorated = result.tax * (item.amount / result.total);
        prorated = (Decimal) prorated.round(System.RoundingMode.UP);
        result.totalProratedTax += prorated;
        CartTax tax = new CartTax(
          Amount = prorated,
          CartItemId = item.item.Id,
          Name = item.item.Name,
          TaxCalculationDate = Date.today(),
          TaxRate = item.rate.Rate,
          TaxType = 'Actual'
        );
        cartTaxesToInsert.add(tax);
      }

      // Check if the sum of prorated tax amount is equal to the total tax amount and modify it if not
      for (Double rate : rateTotalMap.keyset()) {
        TaxRateResult result = rateTotalMap.get(rate);
        if (result.tax != result.totalProratedTax) {
          for (CartTax cartTax : cartTaxesToInsert) {
            if (cartTax.TaxRate == result.rate.Rate) {
              cartTax.Amount += result.tax - result.totalProratedTax;
              break;
            }
          }
        }
      }

      // Insert cart taxes
      insert (cartTaxesToInsert);

      // Set success status
      integStatus.status = sfdc_checkout.IntegrationStatus.Status.SUCCESS;
    } catch (Exception e) {
      return integrationStatusFailedWithCartValidationOutputError(
        integStatus,
        String.format(
          'Error Type: {0} , Message: {1}',
          new List<String>{ e.getTypeName(), e.getMessage() }
        ),
        jobInfo,
        cartId
      );
    }
    return integStatus;
  }

  private sfdc_checkout.IntegrationStatus integrationStatusFailedWithCartValidationOutputError(
    sfdc_checkout.IntegrationStatus integrationStatus,
    String errorMessage,
    sfdc_checkout.IntegrationInfo jobInfo,
    Id cartId
  ) {
    integrationStatus.status = sfdc_checkout.IntegrationStatus.Status.FAILED;
    CartValidationOutput cartValidationError = new CartValidationOutput(
      BackgroundOperationId = jobInfo.jobId,
      CartId = cartId,
      Level = 'Error',
      Message = errorMessage.left(255),
      Name = (String) cartId + ':' + jobInfo.jobId,
      RelatedEntityId = cartId,
      Type = 'Taxes'
    );
    insert (cartValidationError);
    return integrationStatus;
  }
}
