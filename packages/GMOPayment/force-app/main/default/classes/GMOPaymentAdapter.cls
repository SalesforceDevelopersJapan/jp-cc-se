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

  global commercepayments.GatewayResponse processRequest(
    commercepayments.paymentGatewayContext gatewayContext
  ) {
    commercepayments.RequestType requestType = gatewayContext.getPaymentRequestType();
    commercepayments.PaymentGatewayRequest request = gatewayContext.getPaymentRequest();
    commercepayments.GatewayResponse response;
    try {
      if (requestType == commercepayments.RequestType.PostAuth) {
        response = createPostAuthResponse(
          (commercepayments.PostAuthorizationRequest) request
        );
      } else if (requestType == commercepayments.RequestType.Capture) {
        response = createCaptureResponse(
          (commercepayments.CaptureRequest) request
        );
      } else if (requestType == commercepayments.RequestType.Sale) {
        response = createSaleResponse((commercepayments.SaleRequest) request);
      } else if (requestType == commercepayments.RequestType.ReferencedRefund) {
        response = createRefundResponse(
          (commercepayments.ReferencedRefundRequest) request
        );
      } else if (
        requestType == commercepayments.RequestType.AuthorizationReversal
      ) {
        response = createAuthReversalResponse(
          (commercepayments.AuthorizationReversalRequest) request
        );
      } else if (requestType == commercepayments.RequestType.Authorize) {
        response = createAuthResponse(
          (commercepayments.AuthorizationRequest) request
        );
      }
      return response;
    } catch (GMOException e) {
      return new commercepayments.GatewayErrorResponse('400', e.getMessage());
    } catch (Exception e) {
      return new commercepayments.GatewayErrorResponse('500', e.getMessage());
    }
  }

  public commercepayments.GatewayResponse createPostAuthResponse(
    commercepayments.PostAuthorizationRequest request
  ) {
    commercepayments.PostAuthApiPaymentMethodRequest apiPaymentMethod = (commercepayments.PostAuthApiPaymentMethodRequest) request.paymentMethod;
    commercepayments.AlternativePaymentMethodRequest altPaymentMethod = (commercepayments.AlternativePaymentMethodRequest) apiPaymentMethod.alternativePaymentMethod;

    // This logic is used to avoid token validation
    String orderId = (String) altPaymentMethod.gatewayToken;
    String currencyIsoCode = request.currencyIsoCode;
    Double amount = GMOUtils.convertProperAmount(request.amount, null);
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> searchMap = service.searchTrade(orderId);
    if ((String) searchMap.get('Status') == 'AUTHENTICATED') {
      // Check if 3DSecure is required
      // https://mp-faq.gmo-pg.com/s/article/D00007
      service.doSecureTran2(
        (String) searchMap.get('AccessID'),
        (String) searchMap.get('AccessPass')
      );
    }
    commercepayments.PostAuthorizationResponse response = new commercepayments.PostAuthorizationResponse();
    response.setGatewayDate(system.now());
    response.setGatewayAuthCode((String) searchMap.get('TranID'));
    response.setGatewayResultCode((String) searchMap.get('Approve'));
    response.setSalesforceResultCodeInfo(RC_SUCCESS);
    response.setAmount(amount);
    String accessId = (String) searchMap.get('AccessID');
    String accessPass = (String) searchMap.get('AccessPass');
    Map<String, Object> detail = new Map<String, Object>();
    detail.put('accessId', accessId);
    detail.put('accessPass', accessPass);
    detail.put('orderId', orderId);
    response.setGatewayReferenceDetails(JSON.Serialize(detail));
    return response;
  }

  public commercepayments.GatewayResponse createCaptureResponse(
    commercepayments.CaptureRequest request
  ) {
    sObject s = [
      SELECT Id, GatewayRefDetails
      FROM PaymentAuthorization
      WHERE Id = :request.paymentAuthorizationId
      LIMIT 1
    ];
    PaymentAuthorization paymentAuthorization = (PaymentAuthorization) s;
    String currencyIsoCode = null;
    // if (UserInfo.isMultiCurrencyOrganization()) {
    //   currencyIsoCode = String.valueOf(
    //     paymentAuthorization.get('CurrencyIsoCode')
    //   );
    // } else {
    //   currencyIsoCode = UserInfo.getDefaultCurrency();
    // }
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      paymentAuthorization.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Double amount = GMOUtils.convertProperAmount(
      request.amount,
      currencyIsoCode
    );
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.captureOrChangeSalesTransaction(
      accessId,
      accessPass,
      amount.intValue()
    );
    commercepayments.CaptureResponse response = new commercepayments.CaptureResponse();
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setGatewayReferenceDetails(paymentAuthorization.GatewayRefDetails);
    response.setAmount(amount);
    response.setGatewayDate(system.now());
    response.setSalesforceResultCodeInfo(RC_SUCCESS);
    return response;
  }

  public commercepayments.GatewayResponse createRefundResponse(
    commercepayments.ReferencedRefundRequest request
  ) {
    sObject s = [
      SELECT Id, GatewayRefDetails
      FROM Payment
      WHERE Id = :request.paymentId
      LIMIT 1
    ];
    Payment payment = (Payment) s;
    String currencyIsoCode = null;
    // if (UserInfo.isMultiCurrencyOrganization()) {
    //   currencyIsoCode = String.valueOf(payment.get('CurrencyIsoCode'));
    // } else {
    //   currencyIsoCode = UserInfo.getDefaultCurrency();
    // }
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      payment.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Double amount = GMOUtils.convertProperAmount(
      request.amount,
      currencyIsoCode
    );
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.cancelTransaction(
      accessId,
      accessPass,
      amount.intValue()
    );
    // It is possible to be just changing amount.
    // Map<String, Object> execMap = service.captureOrChangeSalesTransaction(
    //   accessId,
    //   accessPass,
    //   amount.intValue()
    // );
    commercepayments.ReferencedRefundResponse response = new commercepayments.ReferencedRefundResponse();
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setGatewayReferenceDetails(payment.GatewayRefDetails);
    response.setAmount(amount);
    response.setGatewayDate(system.now());
    response.setSalesforceResultCodeInfo(RC_SUCCESS);
    return response;
  }

  public commercepayments.GatewayResponse createAuthReversalResponse(
    commercepayments.AuthorizationReversalRequest request
  ) {
    sObject s = [
      SELECT Id, GatewayRefDetails
      FROM PaymentAuthorization
      WHERE Id = :request.PaymentAuthorizationId
      LIMIT 1
    ];
    PaymentAuthorization paymentAuthorization = (PaymentAuthorization) s;
    String currencyIsoCode = null;
    // if (UserInfo.isMultiCurrencyOrganization()) {
    //   currencyIsoCode = String.valueOf(
    //     paymentAuthorization.get('CurrencyIsoCode')
    //   );
    // } else {
    //   currencyIsoCode = UserInfo.getDefaultCurrency();
    // }
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      paymentAuthorization.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Double amount = GMOUtils.convertProperAmount(
      request.amount,
      currencyIsoCode
    );
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.cancelTransaction(
      accessId,
      accessPass,
      amount.intValue()
    );
    // It is possible to be just changing amount.
    // Map<String, Object> execMap = service.changeAuthTransaction(
    //   accessId,
    //   accessPass,
    //   intAmount
    // );
    commercepayments.AuthorizationReversalResponse response = new commercepayments.AuthorizationReversalResponse();
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setGatewayReferenceDetails(paymentAuthorization.GatewayRefDetails);
    response.setGatewayDate(system.now());
    response.setSalesforceResultCodeInfo(RC_SUCCESS);
    return response;
  }

  public commercepayments.GatewayResponse createSaleResponse(
    commercepayments.SaleRequest request
  ) {
    throw new GMOException('TODO: createSaleResponse');
  }

  public commercepayments.GatewayResponse createAuthResponse(
    commercepayments.AuthorizationRequest request
  ) {
    throw new GMOException('TODO: createAuthResponse');
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
    String securityCode = (String) paymentsData.get('securityCode');
    if (
      String.isNotBlank(securityCode) &&
      !GMOUtils.isValidSecurityCode(securityCode)
    ) {
      throw new GMOException('Security code is invalid');
    }

    // String currencyCode = context.getCurrencyCode();
    Double amount = GMOUtils.convertProperAmount(
      context.getAmount().doubleValue(),
      null
    );
    String orderId = GMOUtils.generateId();
    GMOPaymentNCService service = new GMOPaymentNCService();
    Map<String, Object> entryMap = service.entryTransaction(
      orderId,
      amount.intValue()
    );
    String accessID = (String) entryMap.get('AccessID');
    String accessPass = (String) entryMap.get('AccessPass');
    String tokenOrCardSeq = (String) paymentsData.get('tokenOrCardSeq');

    Map<String, Object> execMap = new Map<String, Object>();
    if (GMOUtils.isCardSeq(tokenOrCardSeq)) {
      String memberId = GMOUtils.getGMOMemberId();
      execMap = service.executeTransaction(
        orderId,
        (String) null,
        accessID,
        accessPass,
        memberId,
        Integer.valueOf(tokenOrCardSeq),
        String.isNotBlank(securityCode)
          ? Integer.valueOf(securityCode)
          : (Integer) null
      );
    } else {
      execMap = service.executeTransaction(
        orderId,
        tokenOrCardSeq,
        accessID,
        accessPass,
        (String) null,
        (Integer) null,
        (Integer) null
      );
    }
    execMap.put('AccessID', accessID);
    execMap.put('OrderID', orderId);
    return new commercepayments.ClientResponse(orderId, execMap);
  }
}
