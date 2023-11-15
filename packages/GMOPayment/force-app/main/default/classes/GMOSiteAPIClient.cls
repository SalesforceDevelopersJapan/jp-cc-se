public class GMOSiteAPIClient extends AbstractGMOSiteAPIClient {
  private static GMOSiteAPIClient instance = null;
  private final String id;
  private final String pass;

  private GMOSiteAPIClient(String id, String pass) {
    this.id = id;
    this.pass = pass;
  }

  public static GMOSiteAPIClient getInstance() {
    if (instance == null) {
      GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
      instance = new GMOSiteAPIClient(metadata.siteId__c, metadata.sitePass__c);
    }
    return instance;
  }

  protected override String buildRequestBody(Map<String, Object> params) {
    String body = GMOUtils.urlEncodedParams(params);
    if (!String.isEmpty(body)) {
      body += '&';
    }
    body += 'SiteID' + '=' + this.id;
    body += '&SitePass' + '=' + this.pass;
    return body;
  }

  private HttpResponse post(String path, Map<String, Object> params) {
    commercepayments.PaymentsHttp http = new commercepayments.PaymentsHttp();
    HttpRequest request = new HttpRequest();
    request.setEndpoint('/payment' + path);
    request.setMethod('POST');
    request.setHeader(
      'Content-Type',
      'application/x-www-form-urlencoded;charset=windows-31j'
    );
    request.setBody(buildRequestBody(params));
    return http.send(request);
  }
}
