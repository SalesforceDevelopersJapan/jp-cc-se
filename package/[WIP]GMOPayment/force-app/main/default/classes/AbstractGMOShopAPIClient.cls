public abstract class AbstractGMOShopAPIClient {

    public HttpResponse doEntryTran(String orderID, Integer amount){
        // https://docs.mul-pay.jp/payment/credit/api#entrytran
        Map<String, Object> params = new Map<String, Object>();
        params.put('OrderID', orderID);
        params.put('JobCd', 'AUTH');
        params.put('Amount', amount);
        return post('/EntryTran.idPass', params);
    }

    public HttpResponse doAlterTran(String accessID, String accessPass, Integer amount){
        // https://docs.mul-pay.jp/payment/credit/api#altertran
        Map<String, Object> params = new Map<String, Object>();
        params.put('AccessID', accessID);
        params.put('AccessPass', accessPass);
        params.put('JobCd', 'SALES');
        params.put('Amount', amount);
        return post('/AlterTran.idPass', params);
    }

    protected String buildRequestBody(Map<String, Object> params){
        String body = GMOUtils.urlEncodedParams(params);
        if(!String.isEmpty(body)){
            body += '&';
        }
        body += 'ShopID' + '=' + '{!$Credential.Username}';
        body += '&ShopPass' + '=' + '{!$Credential.Password}';
        return body;
    }

    private abstract HttpResponse post(String path, Map<String, Object> params);
}
