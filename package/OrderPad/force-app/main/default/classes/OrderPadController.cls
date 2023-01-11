public with sharing class OrderPadController {
  @AuraEnabled(cacheable=false)
  public static ConnectApi.ProductSearchResults searchProducts(
    String webstoreId,
    String effectiveAccountId,
    ConnectApi.ProductSearchInput productSearchInput
  ) {
    return ConnectApi.CommerceSearch.searchProducts(
      webstoreId,
      effectiveAccountId,
      productSearchInput
    );
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.CartItem addToCart(
    String webstoreId,
    String effectiveAccountId,
    String activeCartOrId,
    ConnectApi.CartItemInput cartItemInput
  ) {
    cartItemInput.type = ConnectApi.CartItemType.Product;
    return ConnectApi.CommerceCart.addItemToCart(
      webstoreId,
      effectiveAccountId,
      activeCartOrId,
      cartItemInput
    );
  }

  @AuraEnabled(cacheable=false)
  public static List<WebStoreBuyerGroup> getWebStores(String accountId) {
    return [
      SELECT WebStore.Id, WebStore.Name
      FROM WebStoreBuyerGroup
      WHERE
        BuyerGroupId IN (
          SELECT BuyerGroupId
          FROM BuyerGroupMember
          WHERE BuyerId = :accountId
        )
    ];
  }

  @AuraEnabled(cacheable=false)
  public static List<Webcart> getCarts(
    String webstoreId,
    String effectiveAccountId,
    String contactId
  ) {
    return [
      SELECT
        Id,
        Name,
        Status,
        IsSecondary,
        UniqueProductCount,
        TotalProductCount
      FROM Webcart
      WHERE
        OwnerId IN (SELECT Id FROM User WHERE ContactId = :contactId)
        AND AccountId = :effectiveAccountId
        AND WebStoreId = :webStoreId
        AND Status = 'Active'
    ];
  }
}
