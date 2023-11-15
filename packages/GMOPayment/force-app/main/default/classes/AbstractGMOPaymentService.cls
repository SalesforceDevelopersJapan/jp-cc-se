public abstract class AbstractGMOPaymentService {
  private final AbstractGMOSiteAPIClient siteClient;
  private final AbstractGMOShopAPIClient shopClient;

  public AbstractGMOPaymentService(
    AbstractGMOSiteAPIClient siteClient,
    AbstractGMOShopAPIClient shopClient
  ) {
    this.siteClient = siteClient;
    this.shopClient = shopClient;
  }

  public Map<String, Object> executeTransaction(
    String orderID,
    String token,
    String accessID,
    String accessPass,
    String memberID,
    Integer cardSeq,
    Integer securityCode
  ) {
    HttpResponse response = this.siteClient.doExecTran(
      accessID,
      accessPass,
      orderID,
      token,
      memberID,
      cardSeq,
      securityCode
    );
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      //TODO Need more error handling
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOException('Cound not execute transaction: ' + errorInfo);
    }
    return responseBody;
  }

  public Map<String, Object> saveMember(String memberId) {
    HttpResponse response = this.siteClient.doSaveMember(memberId);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> saveCard(String memberId, String token) {
    Map<String, Object> saveResult = saveMember(memberId);
    if (saveResult.containsKey('ErrCode')) {
      String errorInfo = (String) saveResult.get('ErrInfo');
      if (!errorInfo.contains('E01390010')) {
        // If error other than member already exsiet error
        // https://gmopg_docs:PF%cwa$GmCC@docs.mul-pay.jp/payment/credit/errorcode
        throw new GMOException('Cound not save member: ' + errorInfo);
      }
    }
    HttpResponse response = this.siteClient.doSaveCard(memberId, token);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> deleteCard(String memberId, Integer cardSeq) {
    HttpResponse response = this.siteClient.doDeleteCard(memberId, cardSeq);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> setDefaultCard(
    String memberId,
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    HttpResponse response = this.siteClient.doSetDefault(
      memberId,
      cardSeq,
      expire,
      holderName
    );
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> searchCard(String memberId) {
    HttpResponse response = this.siteClient.doSearchCard(memberId);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> searchTrade(String orderId) {
    HttpResponse response = this.shopClient.doSearchTrade(orderId);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> entryTransaction(String orderID, Integer amount) {
    HttpResponse response = this.shopClient.doEntryTran(
      orderID,
      amount,
      'AUTH'
    );
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      //TODO Need more error handling
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOException('Cound not entry transaction: ' + errorInfo);
    }
    return responseBody;
  }

  private Map<String, Object> alterTransaction(
    String accessID,
    String accessPass,
    Integer amount,
    String jobCd
  ) {
    // https://gmopg_docs:PF%cwa$GmCC@docs.mul-pay.jp/payment/credit/overview
    HttpResponse response = this.shopClient.doAlterTran(
      accessID,
      accessPass,
      amount,
      jobCd
    );
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      //TODO Need more error handling
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOException('Cound not alter transaction: ' + errorInfo);
    }
    return responseBody;
  }

  public Map<String, Object> captureOrChangeSalesTransaction(
    String accessID,
    String accessPass,
    Integer amount
  ) {
    return alterTransaction(accessID, accessPass, amount, 'SALES');
  }

  public Map<String, Object> cancelTransaction(
    String accessID,
    String accessPass,
    Integer amount
  ) {
    return alterTransaction(accessID, accessPass, amount, 'CANCEL');
  }

  public Map<String, Object> changeAuthTransaction(
    String accessID,
    String accessPass,
    Integer amount
  ) {
    return alterTransaction(accessID, accessPass, amount, 'AUTH');
  }

  public Map<String, Object> check3DResult(String accessID) {
    GMOSession__c gmoSession = GMOUtils.getGMOSessionByAccessId(accessID);
    Map<String, Object> searchMap = searchTrade(gmoSession.OrderID__c);
    String accessPass = (String) searchMap.get('AccessPass');
    HttpResponse response = this.siteClient.doSecureTran2(accessID, accessPass);
    Map<String, Object> resultMap = GMOUtils.convertParamToMap(
      response.getBody()
    );
    // Save pass to GMOSession__c record
    GMOUtils.saveGMOSessionPass(null, accessId, accessPass);
    resultMap.put('BillingAddressJsonStr', gmoSession.AddressJson__c);
    return resultMap;
  }
}
