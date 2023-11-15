public with sharing class GMOPaymentController {
  @AuraEnabled(cacheable=false)
  public static Map<String, Object> saveCard(
    String token,
    String effectiveAccountId
  ) {
    String memberId = GMOUtils.getGMOMemberId(effectiveAccountId);
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.saveCard(memberId, token);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> setDefaultCard(
    Integer cardSeq,
    String expire,
    String holderName,
    String effectiveAccountId
  ) {
    String memberId = GMOUtils.getGMOMemberId(effectiveAccountId);
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.setDefaultCard(memberId, cardSeq, expire, holderName);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> deleteCard(
    Integer cardSeq,
    String effectiveAccountId
  ) {
    String memberId = GMOUtils.getGMOMemberId(effectiveAccountId);
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.deleteCard(memberId, cardSeq);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> searchCard(String effectiveAccountId) {
    String memberId = GMOUtils.getGMOMemberId(effectiveAccountId);
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.searchCard(memberId);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> check3DResult(String accessID) {
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.check3DResult(accessID);
  }

  @AuraEnabled(cacheable=false)
  public static GMOSession__c saveGMOSession(
    String orderId,
    String accessID,
    String billingAddressJsonStr
  ) {
    return GMOUtils.saveGMOSession(
      orderId,
      accessID,
      null,
      billingAddressJsonStr
    );
  }
}
