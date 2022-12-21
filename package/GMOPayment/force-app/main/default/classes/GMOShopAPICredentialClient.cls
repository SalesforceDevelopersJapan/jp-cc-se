public class GMOShopAPICredentialClient extends AbstractGMOShopAPIClient {

    private static GMOShopAPICredentialClient instance = null;
    private final String id;
    private final String pass;

    private GMOShopAPICredentialClient(String id, String pass){
        this.id = id;
        this.pass = pass;
    }

    public static GMOShopAPICredentialClient getInstance(){
        GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
        if(instance == null){
            instance = new GMOShopAPICredentialClient(metadata.shopId__c, metadata.shopPass__c);
        }
        return instance;
    }

    protected override String buildRequestBody(Map<String, Object> params){
        String body = GMOUtils.urlEncodedParams(params);
        if(!String.isEmpty(body)){
            body += '&';
        }
        body += 'ShopID' + '=' + this.id;
        body += '&ShopPass' + '=' + this.pass;
        return body;
    }

    private HttpResponse post(String path, Map<String, Object> params) {
        commercepayments.PaymentsHttp http = new commercepayments.PaymentsHttp();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('/payment' + path);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded;charset=windows-31j');
        request.setBody(buildRequestBody(params));
        return http.send(request);
    }
}
