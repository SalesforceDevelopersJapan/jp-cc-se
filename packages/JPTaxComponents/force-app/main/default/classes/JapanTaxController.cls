public with sharing class JapanTaxController {
  @AuraEnabled(cacheable=false)
  public static JapanTaxService.OrderSummaryTotals getOrderSummaryTotals(
    String orderSummaryId
  ) {
    return JapanTaxService.getOrderSummaryTotals(orderSummaryId);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Double> getCartTaxMap(String cartId) {
    List<CartTax> cartTaxList = [
      SELECT TaxRate, Amount
      FROM CartTax
      WHERE CartItem.CartId = :cartId
    ];
    Map<String, Double> cartTaxMap = new Map<String, Double>();
    for (CartTax cartTax : cartTaxList) {
      String key = String.valueOf(cartTax.TaxRate.intValue());
      if (cartTaxMap.containsKey(key)) {
        cartTaxMap.put(key, cartTaxMap.get(key) + cartTax.Amount);
      } else {
        cartTaxMap.put(key, cartTax.Amount);
      }
    }
    return cartTaxMap;
  }
}
