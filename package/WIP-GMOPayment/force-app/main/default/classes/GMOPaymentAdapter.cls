global with sharing class GMOPaymentAdapter implements commercepayments.PaymentGatewayAdapter, commercepayments.ClientSidePaymentAdapter {
  private static final commercepayments.SalesforceResultCodeInfo RC_SUCCESS = toCodeInfo(
    commercepayments.SalesforceResultCode.Success
  );
  private static final commercepayments.SalesforceResultCodeInfo RC_DECLINE = toCodeInfo(
    commercepayments.SalesforceResultCode.Decline
  );
  private static final commercepayments.SalesforceResultCodeInfo RC_REQUIRES_REVIEW = toCodeInfo(
    commercepayments.SalesforceResultCode.RequiresReview
  );
  private static final commercepayments.SalesforceResultCodeInfo RC_VALIDATION_ERROR = toCodeInfo(
    commercepayments.SalesforceResultCode.ValidationError
  );
  private static commercepayments.SalesforceResultCodeInfo toCodeInfo(
    commercepayments.SalesforceResultCode code
  ) {
    return new commercepayments.SalesforceResultCodeInfo(code);
  }

  global GMOPaymentAdapter() {
  }

  global commercepayments.GatewayResponse processRequest(
    commercepayments.paymentGatewayContext gatewayContext
  ) {
    commercepayments.RequestType requestType = gatewayContext.getPaymentRequestType();
    commercepayments.PaymentGatewayRequest paymentRequest = gatewayContext.getPaymentRequest();
    commercepayments.GatewayResponse response;
    try {
      if (requestType == commercepayments.RequestType.PostAuth) {
        response = createPostAuthResponse(
          (commercepayments.PostAuthorizationRequest) paymentRequest
        );
      }
      return response;
    } catch (GMOValidationException e) {
      return new commercepayments.GatewayErrorResponse('400', e.getMessage());
    } catch (Exception e) {
      return new commercepayments.GatewayErrorResponse('500', e.getMessage());
    }
  }

  private void saveMember(String userId) {
    GMOSiteAPICredentialClient client = GMOSiteAPICredentialClient.getInstance();
    HttpResponse response = client.doSaveMember(userId);
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      String errorInfo = (String) responseBody.get('ErrInfo');
      if (!errorInfo.contains('E01390010')) {
        // If error other than member already exsiet error
        // https://gmopg_docs:PF%cwa$GmCC@docs.mul-pay.jp/payment/credit/errorcode
        throw new GMOValidationException('Cound not save member: ' + errorInfo);
      }
    }
  }

  private Map<String, Object> entryTransaction(String orderID, Integer amount) {
    GMOShopAPICredentialClient client = GMOShopAPICredentialClient.getInstance();
    HttpResponse response = client.doEntryTran(orderID, amount);
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOValidationException(
        'Cound not entry transaction: ' + errorInfo
      );
    }
    return responseBody;
  }

  private Map<String, Object> executeTransaction(
    String orderID,
    String token,
    String accessID,
    String accessPass
  ) {
    GMOSiteAPICredentialClient client = GMOSiteAPICredentialClient.getInstance();
    HttpResponse response = client.doExecTran(
      accessID,
      accessPass,
      orderID,
      token,
      null,
      null
    );
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOValidationException(
        'Cound not execute transaction: ' + errorInfo
      );
    }
    return responseBody;
  }

  public commercepayments.GatewayResponse createPostAuthResponse(
    commercepayments.PostAuthorizationRequest postAuthRequest
  ) {
    commercepayments.PostAuthApiPaymentMethodRequest apiPaymentMethod = (commercepayments.PostAuthApiPaymentMethodRequest) postAuthRequest.paymentMethod;
    commercepayments.AlternativePaymentMethodRequest altPaymentMethod = (commercepayments.AlternativePaymentMethodRequest) apiPaymentMethod.alternativePaymentMethod;
    String gatewayToken = (String) altPaymentMethod.gatewayToken;
    String currencyIsoCode = postAuthRequest.currencyIsoCode;
    Integer amount = Math.round(postAuthRequest.amount);
    String userId = UserInfo.getUserId();
    saveMember(userId);
    // TODO: original id is used instead of order id. need to consider another way.
    String id = GMOUtils.generateId();
    Map<String, Object> entryMap = entryTransaction(id, amount);
    Map<String, Object> execMap = executeTransaction(
      id,
      gatewayToken,
      (String) entryMap.get('AccessID'),
      (String) entryMap.get('AccessPass')
    );
    commercepayments.PostAuthorizationResponse postAuthResponse = new commercepayments.PostAuthorizationResponse();
    postAuthResponse.setGatewayDate(system.now());
    postAuthResponse.setGatewayAuthCode((String) execMap.get('TranID'));
    postAuthResponse.setGatewayResultCode((String) execMap.get('Approve'));
    postAuthResponse.setSalesforceResultCodeInfo(RC_SUCCESS);
    postAuthResponse.setAmount(Double.valueOf(amount));
    postAuthResponse.setGatewayMessage((String) execMap.get('CheckString'));
    Map<String, Object> detail = new Map<String, Object>();
    detail.put('accessId', (String) entryMap.get('AccessID'));
    detail.put('accessPass', (String) entryMap.get('AccessPass'));
    String detailString = JSON.Serialize(detail);
    postAuthResponse.setGatewayReferenceDetails(detailString);
    return postAuthResponse;
  }

  /**
   * Client side
   **/
  global String getClientComponentName() {
    return 'c/gmoCardElement';
  }

  global Map<String, String> getClientConfiguration() {
    GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
    Map<String, String> configuration = new Map<String, String>();
    configuration.put('gmoShopId', metadata.shopId__c);
    configuration.put('gmoJsUrl', metadata.jsUrl__c);
    return configuration;
  }

  global commercepayments.ClientResponse processClientRequest(
    commercepayments.ClientRequestContext context,
    Map<String, Object> paymentsData
  ) {
    // https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_cardpaymentmethod.htm
    Map<String, Object> error = new Map<String, Object>();
    error.put('error', 'Not Implemented.');
    return new commercepayments.ClientResponse('', error);
  }
}
