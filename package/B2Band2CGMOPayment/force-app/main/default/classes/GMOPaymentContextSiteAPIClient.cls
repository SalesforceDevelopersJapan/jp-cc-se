public class GMOPaymentContextSiteAPIClient extends AbstractGMOSiteAPIClient {

    private static GMOPaymentContextSiteAPIClient instance = null;

    private GMOPaymentContextSiteAPIClient(){

    }

    public static GMOPaymentContextSiteAPIClient getInstance(){
        if(instance == null){
            instance = new GMOPaymentContextSiteAPIClient();
        }
        return instance;
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
