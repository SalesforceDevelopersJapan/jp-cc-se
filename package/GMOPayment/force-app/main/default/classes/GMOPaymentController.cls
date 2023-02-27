public with sharing class GMOPaymentController {
  @AuraEnabled(cacheable=false)
  public static Map<String, Object> saveCard(String token) {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doSaveCard(userId, token);
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> setDefaultCard(
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doSetDefault(
      userId,
      cardSeq,
      expire,
      holderName
    );
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> deleteCard(Integer cardSeq) {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doDeleteCard(userId, cardSeq);
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> searchCard() {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doSearchCard(userId);
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> saveMember() {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doSaveMember(userId);
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static Map<String, Object> searchMember() {
    String userId = UserInfo.getUserId();
    GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
    HttpResponse response = client.doSearchMember(userId);
    String body = response.getBody();
    return GMOUtils.convertParamToMap(body);
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.AuthorizationReversalResponse reversePayment(
    String orderSummaryId
  ) {
    sObject sOps = [
      SELECT Id
      FROM OrderPaymentSummary
      WHERE OrderSummaryId = :orderSummaryId
      LIMIT 1
    ];
    OrderPaymentSummary ops = (OrderPaymentSummary) sOps;
    sObject sPa = [
      SELECT Id, AccountId, Amount
      FROM PaymentAuthorization
      WHERE OrderPaymentSummaryId = :ops.Id
      LIMIT 1
    ];
    PaymentAuthorization pa = (PaymentAuthorization) sPa;
    ConnectApi.AuthorizationReversalRequest req = new ConnectApi.AuthorizationReversalRequest();
    req.accountId = pa.AccountId;
    req.amount = pa.Amount;
    return ConnectApi.Payments.reverseAuthorization(req, pa.Id);
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.CaptureResponse capturePayment(
    String orderSummaryId
  ) {
    sObject sOps = [
      SELECT Id
      FROM OrderPaymentSummary
      WHERE OrderSummaryId = :orderSummaryId
      LIMIT 1
    ];
    OrderPaymentSummary ops = (OrderPaymentSummary) sOps;
    sObject sPa = [
      SELECT Id, AccountId, Amount
      FROM PaymentAuthorization
      WHERE OrderPaymentSummaryId = :ops.Id
      LIMIT 1
    ];
    PaymentAuthorization pa = (PaymentAuthorization) sPa;
    ConnectApi.CaptureRequest req = new ConnectApi.CaptureRequest();
    req.accountId = pa.AccountId;
    req.amount = pa.Amount;
    return ConnectApi.Payments.capture(req, pa.Id);
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.ReferencedRefundResponse refundPayment(
    String orderSummaryId
  ) {
    sObject sOps = [
      SELECT Id
      FROM OrderPaymentSummary
      WHERE OrderSummaryId = :orderSummaryId
      LIMIT 1
    ];
    OrderPaymentSummary ops = (OrderPaymentSummary) sOps;
    sObject sPa = [
      SELECT Id, AccountId, Amount
      FROM PaymentAuthorization
      WHERE OrderPaymentSummaryId = :ops.Id
      LIMIT 1
    ];
    PaymentAuthorization pa = (PaymentAuthorization) sPa;
    sObject sPay = [
      SELECT Id
      FROM Payment
      WHERE PaymentAuthorizationId = :pa.Id
      LIMIT 1
    ];
    Payment pay = (Payment) sPay;
    ConnectApi.ReferencedRefundRequest req = new ConnectApi.ReferencedRefundRequest();
    req.accountId = pa.AccountId;
    req.amount = pa.Amount;
    return ConnectApi.Payments.refund(req, pay.Id);
  }
}
