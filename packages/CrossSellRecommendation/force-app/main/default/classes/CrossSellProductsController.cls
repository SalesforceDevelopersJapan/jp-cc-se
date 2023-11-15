public with sharing class CrossSellProductsController {
  class Products {
    @AuraEnabled
    public Cross_Sell_Recommendations__c[] products;
    @AuraEnabled
    public ConnectApi.ProductOverviewCollection collections;
  }

  @AuraEnabled(cacheable=false)
  public static CrossSellProductsController.Products getProducts(
    String webstoreId,
    String effectiveAccountId,
    String productId
  ) {
    CrossSellProductsController.Products products = new CrossSellProductsController.Products();
    products.products = [
      SELECT Recommended_Product__c, Option_Category__c
      FROM Cross_Sell_Recommendations__c
      WHERE Recommended_Product_Parent__c = :productId
    ];
    String[] productIds = new List<String>{};
    for (Cross_Sell_Recommendations__c product : products.products) {
      productIds.add(product.Recommended_Product__c);
    }
    products.collections = ConnectApi.CommerceCatalog.getProducts(
      webstoreId,
      effectiveAccountId,
      productIds,
      null,
      null,
      false,
      false
    );
    return products;
  }

  @AuraEnabled(cacheable=false)
  public static Boolean hasCrossSellProduct(String productId) {
    Cross_Sell_Recommendations__c[] products = [
      SELECT Recommended_Product__c
      FROM Cross_Sell_Recommendations__c
      WHERE Recommended_Product_Parent__c = :productId
    ];
    return products.size() > 0;
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, String> getCategoryPickupValueMap() {
    Map<String, String> pickupValueMap = new Map<String, String>();
    Schema.DescribeFieldResult fieldResult = Cross_Sell_Recommendations__c.Option_Category__c.getDescribe();
    List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
    for (Schema.PicklistEntry pickListVal : ple) {
      pickupValueMap.put(pickListVal.getValue(), pickListVal.getLabel());
    }
    return pickupValueMap;
  }
}
