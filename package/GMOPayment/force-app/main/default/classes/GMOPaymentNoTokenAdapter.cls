global with sharing class GMOPaymentNoTokenAdapter implements commercepayments.PaymentGatewayAdapter {
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

  global GMOPaymentNoTokenAdapter() {
  }

  global commercepayments.GatewayResponse processRequest(
    commercepayments.paymentGatewayContext gatewayContext
  ) {
    commercepayments.RequestType requestType = gatewayContext.getPaymentRequestType();
    commercepayments.PaymentGatewayRequest paymentRequest = gatewayContext.getPaymentRequest();
    commercepayments.GatewayResponse response;
    try {
      if (requestType == commercepayments.RequestType.Authorize) {
        response = createAuthResponse(
          (commercepayments.AuthorizationRequest) paymentRequest
        );
      } else if (requestType == commercepayments.RequestType.Tokenize) {
        response = createTokenizeResponse(
          (commercepayments.PaymentMethodTokenizationRequest) paymentRequest
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
      //TODO Need more error handling
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOValidationException(
        'Cound not entry transaction: ' + errorInfo
      );
    }
    return responseBody;
  }

  private Map<String, Object> executeTransaction(
    String accessID,
    String accessPass,
    String orderID,
    String cardNo,
    String expire,
    String holderName,
    String securityCode
  ) {
    GMOSiteAPICredentialClient client = GMOSiteAPICredentialClient.getInstance();
    HttpResponse response = client.doExecTranWithCardDetails(
      accessID,
      accessPass,
      orderID,
      cardNo,
      expire,
      holderName,
      securityCode
    );
    Map<String, Object> responseBody = GMOUtils.convertParamToMap(
      response.getBody()
    );
    if (responseBody.containsKey('ErrCode')) {
      //TODO Need more error handling
      String errorInfo = (String) responseBody.get('ErrInfo');
      throw new GMOValidationException(
        'Cound not execute transaction: ' + errorInfo
      );
    }
    return responseBody;
  }

  public commercepayments.GatewayResponse createTokenizeResponse(
    commercepayments.PaymentMethodTokenizationRequest tokenizeRequest
  ) {
    commercepayments.PaymentMethodTokenizationResponse tokenizeResponse = new commercepayments.PaymentMethodTokenizationResponse();
    tokenizeResponse.setGatewayDate(system.now());
    tokenizeResponse.setGatewayTokenEncrypted('dummy');
    tokenizeResponse.setSalesforceResultCodeInfo(RC_SUCCESS);
    return tokenizeResponse;
  }

  public commercepayments.GatewayResponse createAuthResponse(
    commercepayments.AuthorizationRequest authRequest
  ) {
    commercepayments.AuthApiPaymentMethodRequest paymentMethod = authRequest.paymentMethod;
    if (paymentMethod == null) {
      throw new GMOValidationException(
        'Cound not authorize. paymentMethod is null'
      );
    }

    // if (paymentMethod.cardPaymentMethod == null) {
    //   throw new GMOValidationException(
    //     'Cound not authorize. cardPaymentMethod is null'
    //   );
    // }

    QueryUtils q = new QueryUtils(CardPaymentMethod.SObjectType);
    q.getSelectClause().addField('InputCardNumber', false);
    q.getSelectClause().addField('DisplayCardNumber', false);
    q.getSelectClause().addField('CardBin', false);
    q.getSelectClause().addField('CardPaymentMethodNumber', false);
    q.getSelectClause().addField('GatewayToken', false);
    q.getSelectClause().addField('GatewayTokenEncrypted', false);
    q.setWhereClause(' WHERE Id =' + '\'' + paymentMethod.id + '\'');
    CardPaymentMethod cp = (CardPaymentMethod)Database.query(q.buildSOQL())[0];
    System.debug(cp);


    commercepayments.CardPaymentMethodRequest cardPaymentMethod = paymentMethod.cardPaymentMethod;
    String currencyIsoCode = authRequest.currencyIsoCode;
    Integer amount = Math.round(authRequest.amount);
    String userId = UserInfo.getUserId();
    saveMember(userId);
    //TODO Original id is used instead of order id. need to consider another way.
    String id = GMOUtils.generateId();
    Map<String, Object> entryMap = entryTransaction(id, amount);
    Map<String, Object> execMap = executeTransaction(
      (String) entryMap.get('AccessID'),
      (String) entryMap.get('AccessPass'),
      id,
      cardPaymentMethod.CardNumber,
      GMOUtils.makeYYMM(cardPaymentMethod.expiryYear, cardPaymentMethod.expiryMonth),
      cardPaymentMethod.cardHolderName,
      cardPaymentMethod.cvv
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
}
