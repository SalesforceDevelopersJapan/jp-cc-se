public with sharing class GMOPaymentController {
  @AuraEnabled(cacheable=false)
  public static Map<String, Object> saveCard(String token) {
    checkGuestUser();
    String memberId = GMOUtils.getGMOMemberId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.saveCard(memberId, token);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> setDefaultCard(
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    checkGuestUser();
    String memberId = GMOUtils.getGMOMemberId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.setDefaultCard(memberId, cardSeq, expire, holderName);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> deleteCard(Integer cardSeq) {
    checkGuestUser();
    String memberId = GMOUtils.getGMOMemberId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.deleteCard(memberId, cardSeq);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> searchCard() {
    checkGuestUser();
    String memberId = GMOUtils.getGMOMemberId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.searchCard(memberId);
  }

  private static void checkGuestUser() {
    if (Auth.CommunitiesUtil.isGuestUser()) {
      throw new AuraHandledException(
        'This method does not support guest user.'
      );
    }
  }

  @AuraEnabled(cacheable=false)
  public static WebCart setBillingAddressToCart(
    String cartId,
    String billingAddress
  ) {
    Map<String, Object> address = (Map<String, Object>) JSON.deserializeUntyped(
      billingAddress
    );
    WebCart cart = new WebCart(Id = cartId);
    cart.BillingStreet = (String) address.get('street');
    cart.BillingCity = (String) address.get('city');
    cart.BillingState = (String) address.get('region');
    cart.BillingPostalCode = (String) address.get('postalCode');
    cart.BillingCountry = (String) address.get('country');
    update cart;
    return cart;
  }
}
