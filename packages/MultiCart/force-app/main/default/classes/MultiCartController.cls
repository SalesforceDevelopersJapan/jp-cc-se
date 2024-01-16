public with sharing class MultiCartController {
  @AuraEnabled(cacheable=false)
  public static List<Webcart> getCarts(
    String webstoreId,
    String effectiveAccountId,
    String ownerId
  ) {
    checkGuestUser();
    if (String.isNotBlank(effectiveAccountId)) {
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
          OwnerId = :ownerId
          AND AccountId = :effectiveAccountId
          AND WebStoreId = :webStoreId
          AND (Status = 'Active'
          OR Status = 'Checkout')
        WITH SECURITY_ENFORCED
      ];
    } else {
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
          OwnerId = :ownerId
          AND WebStoreId = :webStoreId
          AND (Status = 'Active'
          OR Status = 'Checkout')
        WITH SECURITY_ENFORCED
      ];
    }
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.CartSummary createCart(
    String webstoreId,
    String effectiveAccountId,
    String cartName
  ) {
    checkGuestUser();
    if (String.isBlank(cartName)) {
      throw new AuraHandledException(
        System.Label.MultiCarts_Apex_NotCartNameEmpty
      );
    }
    ConnectApi.CartInput cart = new ConnectApi.CartInput();
    if (String.isNotBlank(effectiveAccountId)) {
      cart.effectiveAccountId = effectiveAccountId;
    }
    cart.isSecondary = true;
    cart.name = cartName;
    ConnectApi.CartSummary cartSummary = ConnectApi.CommerceCart.createCart(
      webstoreId,
      cart
    );
    return cartSummary;
  }

  @AuraEnabled(cacheable=false)
  public static void deleteCart(
    String webstoreId,
    String effectiveAccountId,
    String cartId
  ) {
    checkGuestUser();
    ConnectApi.CommerceCart.deleteCart(
      webstoreId,
      String.isBlank(effectiveAccountId) ? null : effectiveAccountId,
      cartId
    );
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.CommerceActionResult setPrimaryCart(
    String webstoreId,
    String effectiveAccountId,
    String cartId
  ) {
    checkGuestUser();
    ConnectApi.CommerceActionResult result = ConnectApi.CommerceCart.makeCartPrimary(
      webstoreId,
      cartId,
      String.isBlank(effectiveAccountId) ? null : effectiveAccountId
    );
    return result;
  }

  @AuraEnabled(cacheable=false)
  public static Schema.Webcart updateCartName(
    String webstoreId,
    String effectiveAccountId,
    String cartId,
    String ownerId,
    String cartName
  ) {
    checkGuestUser();
    if (String.isBlank(cartName)) {
      throw new AuraHandledException(
        System.Label.MultiCarts_Apex_NotCartNameEmpty
      );
    }
    Webcart cart;
    if (String.isBlank(effectiveAccountId)) {
      cart = [
        SELECT Id, Name
        FROM Webcart
        WHERE Id = :cartId AND WebStoreId = :webstoreId AND OwnerId = :ownerId
        LIMIT 1
      ];
    } else {
      cart = [
        SELECT Id, Name
        FROM Webcart
        WHERE
          Id = :cartId
          AND WebStoreId = :webstoreId
          AND AccountId = :effectiveAccountId
          AND OwnerId = :ownerId
        LIMIT 1
      ];
    }
    cart.Name = cartName;
    update cart;
    return cart;
  }

  private static void checkGuestUser() {
    if (Auth.CommunitiesUtil.isGuestUser()) {
      throw new AuraHandledException(
        'This method does not support guest user.'
      );
    }
  }
}
