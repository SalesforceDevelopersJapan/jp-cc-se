public with sharing class QuoteRequestController {

  @AuraEnabled(cacheable=false)
  public static Boolean isQuoteAccesible() {
    return Schema.sObjectType.Quote.isAccessible();
  }
}
