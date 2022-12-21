public abstract class AbstractGMOSiteAPIClient {


    public HttpResponse doExecTran(String accessID, String accessPass, String orderID, String token, String memberID, Integer cardSeq){
        // https://docs.mul-pay.jp/payment/credit/api#exectran
        Map<String, Object> params = new Map<String, Object>();
        params.put('AccessID', accessID);
        params.put('AccessPass', accessPass);
        params.put('OrderID', orderID);
        params.put('Method',  1);
        if(!String.isEmpty(token)){
            params.put('TokenType',  1);
            params.put('Token',  token);
        }else{
            params.put('MemberID',  memberID);
            params.put('CardSeq',  cardSeq);
        }
        return post('/ExecTran.idPass', params);
    }

    public HttpResponse doSaveMember(String memberId){
        // https://docs.mul-pay.jp/payment/credit/apimember#savemember
        Map<String, String> params = new Map<String, String>();
        params.put('MemberID', memberId);
        return post('/SaveMember.idPass', params);
    }

    public HttpResponse doSearchMember(String memberId){
        // https://docs.mul-pay.jp/payment/credit/apimember#searchmember
        Map<String, String> params = new Map<String, String>();
        params.put('MemberID', memberId);
        return post('/SearchMember.idPass', params);
    }

    public HttpResponse doSaveCard(String memberID,String token){
        // https://docs.mul-pay.jp/payment/credit/apimember#savecard
        Map<String, String> params = new Map<String, String>();
        params.put('MemberID', memberID);
        params.put('Token', token);
        return post('/SaveCard.idPass', params);
    }

    public HttpResponse doSearchCard(String memberID){
        // https://docs.mul-pay.jp/payment/credit/apimember#searchcard
        Map<String, String> params = new Map<String, String>();
        params.put('MemberID', memberID);
        return post('/SearchCard.idPass', params);
    }

    protected virtual String buildRequestBody(Map<String, Object> params){
        String body = GMOUtils.urlEncodedParams(params);
        if(!String.isEmpty(body)){
            body += '&';
        }
        body += 'SiteID' + '=' + '{!$Credential.Username}';
        body += '&SitePass' + '=' + '{!$Credential.Password}';
        return body;
    }

    private abstract HttpResponse post(String path, Map<String, Object> params);
}
