global with sharing class GMOPaymentAdapter implements commercepayments.PaymentGatewayAdapter, commercepayments.ClientSidePaymentAdapter {

    private static final commercepayments.SalesforceResultCodeInfo RC_SUCCESS = toCodeInfo(commercepayments.SalesforceResultCode.Success);
    private static final commercepayments.SalesforceResultCodeInfo RC_DECLINE = toCodeInfo(commercepayments.SalesforceResultCode.Decline);
    private static final commercepayments.SalesforceResultCodeInfo RC_REQUIRES_REVIEW = toCodeInfo(commercepayments.SalesforceResultCode.RequiresReview);
    private static final commercepayments.SalesforceResultCodeInfo RC_VALIDATION_ERROR = toCodeInfo(commercepayments.SalesforceResultCode.ValidationError);
    private static commercepayments.SalesforceResultCodeInfo toCodeInfo(commercepayments.SalesforceResultCode code) {
        return new commercepayments.SalesforceResultCodeInfo(code);
    }

    global GMOPaymentAdapter() {
    }

    global commercepayments.GatewayResponse processRequest(commercepayments.paymentGatewayContext gatewayContext) {
        commercepayments.RequestType requestType = gatewayContext.getPaymentRequestType();
        commercepayments.PaymentGatewayRequest paymentRequest = gatewayContext.getPaymentRequest();
        commercepayments.GatewayResponse response;
        try {
            if (requestType == commercepayments.RequestType.PostAuth) {
                response = createPostAuthResponse((commercepayments.PostAuthorizationRequest)paymentRequest);
            } 
            return response;
        } catch (GMOValidationException e) {
             return new commercepayments.GatewayErrorResponse('400', e.getMessage());
        }
    }

    public commercepayments.GatewayResponse createPostAuthResponse(commercepayments.PostAuthorizationRequest postAuthRequest) {
        commercepayments.PostAuthApiPaymentMethodRequest apiPaymentMethod =(commercepayments.PostAuthApiPaymentMethodRequest) postAuthRequest.paymentMethod;
        commercepayments.AlternativePaymentMethodRequest altPaymentMethod= (commercepayments.AlternativePaymentMethodRequest) apiPaymentMethod.alternativePaymentMethod;
        String gatewayToken = (String)altPaymentMethod.gatewayToken;
        String currencyIsoCode = postAuthRequest.currencyIsoCode;
        String cartId = getCartId();
        Integer amount = Math.round(postAuthRequest.amount);
        String amountStr = String.valueOf(amount);
        try{
            // if(entryMap.containsKey('ErrCode')){
            //     return new commercepayments.GatewayErrorResponse((String)entryMap.get('ErrCode'), (String)entryMap.get('ErrInfo'));
            // }
            // GMOSiteAPIClient siteClient = GMOSiteAPIClient.getInstance();
            // // Using cart id as order id for GMO.
            // HttpResponse execResponse = siteClient.doExecTran((String)entryMap.get('AccessID'), (String)entryMap.get('AccessPass'), cartId, gatewayToken, null, null);
            // String execBody = execResponse.getBody();
            // Map<String, Object> execMap = GMOUtils.convertParamToMap(execBody);
            // if(execMap.containsKey('ErrCode')){
            //     return new commercepayments.GatewayErrorResponse((String)execMap.get('ErrCode'), (String)execMap.get('ErrInfo'));
            // }

            commercepayments.PostAuthorizationResponse postAuthResponse = new commercepayments.PostAuthorizationResponse();
            postAuthResponse.setGatewayDate(system.now());
            // postAuthResponse.setGatewayAuthCode((String)execMap.get('TranID'));
            // postAuthResponse.setGatewayResultCode((String)execMap.get('Approve'));
            // postAuthResponse.setSalesforceResultCodeInfo(RC_SUCCESS);
            // postAuthResponse.setAmount(Double.valueOf(amount));
            // postAuthResponse.setGatewayMessage((String)execMap.get('CheckString'));
            // Map<String, Object> detail = new Map<String, Object>();
            // detail.put('accessId', entryMap.get('AccessID'));
            // detail.put('accessPass', entryMap.get('AccessPass'));
            // String detailString = JSON.Serialize(detail);
            // postAuthResponse.setGatewayReferenceDetails(detailString);
            postAuthResponse.setGatewayAuthCode('TranID');
            postAuthResponse.setGatewayResultCode('Test');
            postAuthResponse.setSalesforceResultCodeInfo(RC_SUCCESS);
            postAuthResponse.setAmount(Double.valueOf(1000));
            postAuthResponse.setGatewayMessage('CheckString');
            return postAuthResponse;
        }catch(Exception e){
            System.debug(e);
            return new commercepayments.GatewayErrorResponse(e.getMessage(), '');
        }
    }


    /**
    * Client side
    **/
    global String getClientComponentName(){
        return 'c/gmoCardElement';
    }

    global Map<String, String> getClientConfiguration(){
        GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
        Map<String, String> configuration = new Map<String, String>();
        configuration.put('gmoShopId', metadata.shopId__c);
        configuration.put('gmoJsUrl', metadata.jsUrl__c);
        return configuration;
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> entryTransaction(String webstoreId) {
        ConnectApi.CartSummary cart = ConnectApi.CommerceCart.getCartSummary(webstoreId, null, 'active');
        GMOShopAPIClient shopClient = GMOShopAPIClient.getInstance();
        // Using cart id as order id for GMO.
        HttpResponse entryResponse = shopClient.doEntryTran(cart.cartId, Integer.valueOf(cart.totalChargeAmount));
        String entryBody = entryResponse.getBody();
        Map<String, Object> entryMap = GMOUtils.convertParamToMap(entryBody);
        return GMOUtils.convertParamToMap(entryBody);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> saveCard(String token) {
        String userId = UserInfo.getUserId();
        GMOSiteAPIClient client = GMOSiteAPIClient.getInstance();
        HttpResponse response = client.doSaveCard(userId, token);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> searchCard() {
        String userId = UserInfo.getUserId();
        GMOSiteAPIClient client = GMOSiteAPIClient.getInstance();
        HttpResponse response = client.doSearchCard(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> saveMember() {
        String userId = UserInfo.getUserId();
        GMOSiteAPIClient client = GMOSiteAPIClient.getInstance();
        HttpResponse response = client.doSaveMember(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> searchMember() {
        String userId = UserInfo.getUserId();
        GMOSiteAPIClient client = GMOSiteAPIClient.getInstance();
        HttpResponse response = client.doSearchMember(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    global commercepayments.ClientResponse processClientRequest(commercepayments.ClientRequestContext context, Map<String, Object> paymentsData){
        // https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_cardpaymentmethod.htm
        Map<String, Object> error = new Map<String, Object>();
        error.put('error', 'Not Implemented.');
        return new commercepayments.ClientResponse('', error);
    }

    private static String getCartId(){
        return [SELECT WebCartId FROM CartCheckoutSession Where CreatedById = :UserInfo.getUserId() and IsArchived=false ][0].WebCartId;
    }


}