public with sharing class GMOPaymentController {
  @AuraEnabled(cacheable=false)
  public static Map<String, Object> saveCard(String token) {
    String userId = UserInfo.getUserId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.saveCard(userId, token);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> setDefaultCard(
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    String userId = UserInfo.getUserId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.setDefaultCard(userId, cardSeq, expire, holderName);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> deleteCard(Integer cardSeq) {
    String userId = UserInfo.getUserId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.deleteCard(userId, cardSeq);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> searchCard() {
    String userId = UserInfo.getUserId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    return service.searchCard(userId);
  }
}
