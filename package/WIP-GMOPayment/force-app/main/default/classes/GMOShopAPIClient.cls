public class GMOShopAPIClient extends AbstractGMOShopAPIClient{

    private static GMOShopAPIClient instance = null;
    private String namedCredential;

    private GMOShopAPIClient(String namedCredential){
        this.namedCredential = namedCredential;
    }

    public static GMOShopAPIClient getInstance(){
        GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
        if(instance == null || instance.namedCredential != metadata.shopNC__C){
            instance = new GMOShopAPIClient(metadata.shopNC__C);
        }
        return instance;
    }

    private HttpResponse post(String path, Map<String, Object> params) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:' + this.namedCredential + '/payment' + path);
        request.setMethod('POST');
        request.setHeader('Content-Type', 'application/x-www-form-urlencoded;charset=windows-31j');
        request.setBody(buildRequestBody(params));
        return http.send(request);
    }

}
