public with sharing class GMOPaymentService {
  public Map<String, Object> executeTransaction(
    String orderID,
    String token,
    String accessID,
    String accessPass,
    String memberID,
    Integer cardSeq
  ) {
    GMOSiteAPICredentialClient client = GMOSiteAPICredentialClient.getInstance();
    HttpResponse response = client.doExecTran(
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

  public void saveMember(String userId) {
    GMOSiteAPICredentialClient client = GMOSiteAPICredentialClient.getInstance();
    HttpResponse response = client.doSaveMember(userId);
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      String errorInfo = (String) responseBody.get('ErrInfo');
      if (!errorInfo.contains('E01390010')) {
        // If error other than member already exsiet error
        // https://gmopg_docs:PF%cwa$GmCC@docs.mul-pay.jp/payment/credit/errorcode
        throw new GMOException('Cound not save member: ' + errorInfo);
      }
    }
  }

  public Map<String, Object> entryTransaction(String orderID, Integer amount) {
    GMOShopAPICredentialClient client = GMOShopAPICredentialClient.getInstance();
    HttpResponse response = client.doEntryTran(orderID, amount, 'AUTH');
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
    GMOShopAPICredentialClient client = GMOShopAPICredentialClient.getInstance();
    HttpResponse response = client.doAlterTran(
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
