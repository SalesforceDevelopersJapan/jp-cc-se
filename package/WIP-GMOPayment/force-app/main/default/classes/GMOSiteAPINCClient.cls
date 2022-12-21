public class GMOSiteAPINCClient extends AbstractGMOSiteAPIClient {

    private static GMOSiteAPINCClient instance = null;
    private String namedCredential;

    private GMOSiteAPINCClient(String namedCredential){
        this.namedCredential = namedCredential;
    }

    public static GMOSiteAPINCClient getInstance(){
        GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
        if(instance == null || instance.namedCredential != metadata.siteNC__c){
            instance = new GMOSiteAPINCClient(metadata.siteNC__c);
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
