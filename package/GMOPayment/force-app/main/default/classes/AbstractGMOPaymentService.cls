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
    Integer cardSeq
  ) {
    HttpResponse response = this.siteClient.doExecTran(
      accessID,
      accessPass,
      orderID,
      token,
      memberID,
      cardSeq
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

  public Map<String, Object> saveMember(String userId) {
    HttpResponse response = this.siteClient.doSaveMember(userId);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> saveCard(String userId, String token) {
    Map<String, Object> saveResult = saveMember(userId);
    if (saveResult.containsKey('ErrCode')) {
      String errorInfo = (String) saveResult.get('ErrInfo');
      if (!errorInfo.contains('E01390010')) {
        // If error other than member already exsiet error
        // https://gmopg_docs:PF%cwa$GmCC@docs.mul-pay.jp/payment/credit/errorcode
        throw new GMOException('Cound not save member: ' + errorInfo);
      }
    }
    HttpResponse response = this.siteClient.doSaveCard(userId, token);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> deleteCard(String userId, Integer cardSeq) {
    HttpResponse response = this.siteClient.doDeleteCard(userId, cardSeq);
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> setDefaultCard(
    String userId,
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    HttpResponse response = this.siteClient.doSetDefault(
      userId,
      cardSeq,
      expire,
      holderName
    );
    return GMOUtils.convertParamToMap(response.getBody());
  }

  public Map<String, Object> searchCard(String userId) {
    HttpResponse response = this.siteClient.doSearchCard(userId);
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
}
