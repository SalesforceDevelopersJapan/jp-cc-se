/**
 * @see https://developer.salesforce.com/docs/commerce/salesforce-commerce/guide/available-extensions.html#tax-cart-calculator-ga
 * @see https://github.com/forcedotcom/commerce-extensibility/blob/releases/248/commerce/domain/tax/cart/calculator/classes/TaxCartCalculatorSample.cls
 * @see https://salesforce.quip.com/OXUHA72Bou5S#FKYABA9tA8N
 */
public class JapanTaxCalculationServiceDE extends CartExtension.TaxCartCalculator {
  class JapanTaxCalculationServiceDEException extends Exception {
  }

  class CartItemResult {
    public Decimal amount { get; set; }
    public TaxRate rate { get; set; }
    public CartExtension.CartItem item { get; set; }
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
    Map<Id, Product2> idCodeMap;

    public TaxRate defaultTaxRate;

    // この税コードは default_taxrate.sh にて設定されています
    final String DEFAULT_TAX_CODE = 'defalt_tax';

    public CartItemsTax(CartExtension.CartItemList cartItems) {
      List<Id> productIds = new List<Id>{};
      Iterator<CartExtension.CartItem> cartItemsItr = cartItems.iterator();
      while (cartItemsItr.hasNext()) {
        CartExtension.CartItem cartItem = cartItemsItr.next();
        productIds.add(cartItem.getProduct2Id());
      }
      this.idCodeMap = new Map<Id, Product2>(
        [
          SELECT Id, ProductCode
          FROM Product2
          WHERE Id IN :productIds
        ]
      );
      retrieveDefaultTaxRates();
      List<String> productCodes = new List<String>{};
      for (Product2 product : this.idCodeMap.values()) {
        productCodes.add(product.ProductCode);
      }
      retrieveTaxRates(productCodes);
    }

    public TaxRate getRateByPoduct2Id(ID productId) {
      Product2 product = this.idCodeMap.get(productId);
      String taxCode = this.treatmentMap.get(product.ProductCode);
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
        throw new JapanTaxCalculationServiceDEException(
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
        throw new JapanTaxCalculationServiceDEException(
          'Something wrong with tax setting of products.',
          e
        );
      }
    }
  }

  public virtual override void calculate(
    CartExtension.CartCalculateCalculatorRequest request
  ) {
    try {
      // カートの取得
      CartExtension.Cart cart = request.getCart();
      CartExtension.TaxLocaleTypeEnum taxType = cart.getTaxType();

      if (taxType == CartExtension.TaxLocaleTypeEnum.GROSS) {
        throw new JapanTaxCalculationServiceDEException(
          'Japan Tax Service support only Net tax type.'
        );
      }

      // バリデーション情報の削除
      CartExtension.CartValidationOutputList cvos = cart.getCartValidationOutputs();
      Iterator<CartExtension.CartValidationOutput> cvosItr = cvos.iterator();
      while (cvosItr.hasNext()) {
        CartExtension.CartValidationOutput cvo = cvosItr.next();
        if (cvo.getType() == CartExtension.CartValidationOutputTypeEnum.TAXES) {
          cvos.remove(cvo);
        }
      }

      // 必要に応じて配送情報を取得。例えば外部サービスに住所情報渡したいとか
      // CartExtension.CartDeliveryGroupList cartDeliveryGroups = cart.getCartDeliveryGroups();
      // CartExtension.CartDeliveryGroup cartDeliveryGroup = cartDeliveryGroups.get(0);

      // カートアイテムを取得
      CartExtension.CartItemList cartItems = cart.getCartItems();

      // カートアイテムから税レートを取得
      CartItemsTax cartItemsTax = new CartItemsTax(cartItems);

      // 税率と料金を保持するための変数を宣言
      List<CartItemResult> itemList = new List<CartItemResult>{};

      // 税率と税率ごとの合計を保持するためのマップ変数を宣言
      Map<Double, TaxRateResult> rateTotalMap = new Map<Double, TaxRateResult>();

      // カートの税金を作成
      Iterator<CartExtension.CartItem> cartItemsItr = cartItems.iterator();

      while (cartItemsItr.hasNext()) {
        CartExtension.CartItem cartItem = cartItemsItr.next();
        // カートアイテムに紐づく税金を削除
        if (cartItem.getCartTaxes().size() > 0) {
          cartItem.getCartTaxes().remove(cartItem.getCartTaxes().get(0));
        }

        // 商品の税率を取得
        TaxRate rate = cartItemsTax.getRateByPoduct2Id(
          cartItem.getProduct2Id()
        );

        // 税率ごとの合計を取得
        Decimal total = rateTotalMap.get(rate.Rate) != null
          ? (Decimal) rateTotalMap.get(rate.Rate).total
          : 0;

        // 各ラインアイテムごとの調整後の合計を計算
        Decimal adjustment = cartItem.getTotalAdjustmentAmount() != null
          ? (Decimal) cartItem.getTotalAdjustmentAmount()
          : 0;
        Decimal amount = (Decimal) cartItem.getTotalAmount() + adjustment;

        // 各ラインアイテムごとの計算結果と税率とラインアイテムオブジェクトを保持したオブジェクトをリストに追加
        CartItemResult item = new CartItemResult();
        item.amount = amount;
        item.rate = rate;
        item.item = cartItem;
        itemList.add(item);

        // 税率ごとの計算結果をマップに保存
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

      // 税率ごとの税金を計算
      for (Double rate : rateTotalMap.keyset()) {
        TaxRateResult result = rateTotalMap.get(rate);
        Decimal tax =
          result.total * ((Decimal) result.rate.Rate / (Decimal) 100);
        result.tax = (Decimal) tax.round(System.RoundingMode.UP);
      }

      // 計算した税金を各ラインアイテムに按分して保存
      System.debug(itemList);
      System.debug(itemList.size());
      for (CartItemResult item : itemList) {
        CartExtension.CartItem cartItem = item.item;
        TaxRateResult result = rateTotalMap.get(item.rate.Rate);
        Decimal prorated = result.tax * (item.amount / result.total);
        prorated = (Decimal) prorated.round(System.RoundingMode.UP);
        result.totalProratedTax += prorated;
        Decimal quantity = (Decimal) cartItem.getQuantity();
        Decimal adjustment = cartItem.getTotalAdjustmentAmount() != null
          ? (Decimal) cartItem.getTotalAdjustmentAmount()
          : 0;
        Decimal amount = (Decimal) cartItem.getTotalAmount() + adjustment;
        Decimal taxRate = (Decimal) item.rate.Rate / 100;
        cartItem.setNetUnitPrice((amount + prorated) / quantity);
        cartItem.setGrossUnitPrice(0);
        CartExtension.CartTaxList cartTaxCollection = cartItem.getCartTaxes();
        CartExtension.CartTax cartTax = new CartExtension.CartTax(
          CartExtension.TaxTypeEnum.ACTUAL,
          prorated,
          cartItem.getName()
        );
        cartTax.setTaxRate(String.valueOf(item.rate.Rate));
        cartTaxCollection.add(cartTax);
      }

      // 按分した税金の合計が税金の合計と一致するかチェックしてしていなければ修正
      for (Double rate : rateTotalMap.keyset()) {
        TaxRateResult result = rateTotalMap.get(rate);
        if (result.tax != result.totalProratedTax) {
          for (CartItemResult item : itemList) {
            CartExtension.CartItem cartItem = item.item;
            CartExtension.CartTax cartTax = cartItem.getCartTaxes().get(0);
            if (
              String.valueOf(cartTax.getTaxRate()) ==
              String.valueOf(result.rate.Rate)
            ) {
              cartTax.setAmount(
                cartTax.getAmount() + (result.tax - result.totalProratedTax)
              );
              break;
            }
          }
        }
      }
    } catch (Exception e) {
      insertError(e.getMessage());
      throw new CalloutException('There was a problem with the request.');
    }
    return;
  }

  private void insertError(String errorMessage) {
    CartExtension.CartValidationOutput cvo = new CartExtension.CartValidationOutput(
      CartExtension.CartValidationOutputTypeEnum.TAXES,
      CartExtension.CartValidationOutputLevelEnum.ERROR
    );
    cvo.setMessage(errorMessage);
  }
}
