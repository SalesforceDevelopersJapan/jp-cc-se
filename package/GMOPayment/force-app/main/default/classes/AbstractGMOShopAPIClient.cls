public abstract class AbstractGMOShopAPIClient {
  public HttpResponse doEntryTran(
    String orderID,
    Integer amount,
    String jobCd
  ) {
    // https://docs.mul-pay.jp/payment/credit/api#entrytran
    Map<String, Object> params = new Map<String, Object>();
    params.put('OrderID', orderID);
    // CHECK：有効性チェック
    // CAPTURE：即時売上
    // AUTH：仮売上
    // SAUTH：簡易オーソリ
    params.put('JobCd', jobCd);
    params.put('Amount', amount);
    return post('/EntryTran.idPass', params);
  }

  public HttpResponse doAlterTran(
    String accessID,
    String accessPass,
    Integer amount,
    String jobCd
  ) {
    // https://docs.mul-pay.jp/payment/credit/api#altertran
    Map<String, Object> params = new Map<String, Object>();
    params.put('AccessID', accessID);
    params.put('AccessPass', accessPass);
    // CAPTURE：即時売上
    // AUTH：仮売上
    // CANCEL：キャンセル
    // SALES：実売上
    params.put('JobCd', jobCd);
    params.put('Amount', amount);
    return post('/AlterTran.idPass', params);
  }

  public HttpResponse doSearchTrade(String orderId) {
    // https://docs.mul-pay.jp/payment/credit/api#searchtrade
    Map<String, Object> params = new Map<String, Object>();
    params.put('OrderID', orderId);
    return post('/SearchTrade.idPass', params);
  }

  protected virtual String buildRequestBody(Map<String, Object> params) {
    String body = GMOUtils.urlEncodedParams(params);
    if (!String.isEmpty(body)) {
      body += '&';
    }
    body += 'ShopID' + '=' + '{!$Credential.Username}';
    body += '&ShopPass' + '=' + '{!$Credential.Password}';
    return body;
  }

  private abstract HttpResponse post(String path, Map<String, Object> params);
}
