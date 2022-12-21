public class GMOShopAPINCClient extends AbstractGMOShopAPIClient{

    private static GMOShopAPINCClient instance = null;
    private String namedCredential;

    private GMOShopAPINCClient(String namedCredential){
        this.namedCredential = namedCredential;
    }

    public static GMOShopAPINCClient getInstance(){
        GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
        if(instance == null || instance.namedCredential != metadata.shopNC__C){
            instance = new GMOShopAPINCClient(metadata.shopNC__C);
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
