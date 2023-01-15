public with sharing class QuoteRequestController {
  @AuraEnabled(cacheable=false)
  public static ConnectApi.CartSummary getCartSummary(String webstoreId) {
    return ConnectApi.CommerceCart.getCartSummary(webstoreId, null, 'active');
  }

  @AuraEnabled(cacheable=false)
  public static Boolean isQuoteAccesible() {
    return Schema.sObjectType.Quote.isAccessible();
  }
}
