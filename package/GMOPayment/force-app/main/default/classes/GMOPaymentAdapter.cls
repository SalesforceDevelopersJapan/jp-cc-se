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
    String tokenOrCardSeq = (String) altPaymentMethod.gatewayToken;
    String currencyIsoCode = request.currencyIsoCode;
    Integer intAmount = Math.ceil(request.amount).intValue();
    Double doubleAmount = Double.valueOf(intAmount);
    String memberId = UserInfo.getUserId();
    GMOPaymentService service = new GMOPaymentService();
    service.saveMember(memberId);
    //TODO Original id is used instead of order id. need to consider another way.
    String id = GMOUtils.generateId();
    Map<String, Object> entryMap = service.entryTransaction(id, intAmount);
    Map<String, Object> execMap = new Map<String, Object>();
    if (GMOUtils.isCardSeq(tokenOrCardSeq)) {
      execMap = service.executeTransaction(
        id,
        (String) null,
        (String) entryMap.get('AccessID'),
        (String) entryMap.get('AccessPass'),
        memberId,
        Integer.valueOf(tokenOrCardSeq)
      );
    } else {
      execMap = service.executeTransaction(
        id,
        tokenOrCardSeq,
        (String) entryMap.get('AccessID'),
        (String) entryMap.get('AccessPass'),
        (String) null,
        (Integer) null
      );
    }
    commercepayments.PostAuthorizationResponse response = new commercepayments.PostAuthorizationResponse();
    response.setGatewayDate(system.now());
    response.setGatewayAuthCode((String) execMap.get('TranID'));
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setSalesforceResultCodeInfo(RC_SUCCESS);
    response.setAmount(doubleAmount);
    response.setGatewayMessage((String) execMap.get('CheckString'));
    Map<String, Object> detail = new Map<String, Object>();
    detail.put('accessId', (String) entryMap.get('AccessID'));
    detail.put('accessPass', (String) entryMap.get('AccessPass'));
    detail.put('orderId', id);
    String detailString = JSON.Serialize(detail);
    response.setGatewayReferenceDetails(detailString);
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
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      paymentAuthorization.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Integer intAmount = Math.ceil(request.amount).intValue();
    Double doubleAmount = Double.valueOf(intAmount);
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.captureOrChangeSalesTransaction(
      accessId,
      accessPass,
      intAmount
    );
    commercepayments.CaptureResponse response = new commercepayments.CaptureResponse();
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setGatewayReferenceDetails(paymentAuthorization.GatewayRefDetails);
    response.setAmount(doubleAmount);
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
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      payment.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Integer intAmount = Math.ceil(request.amount).intValue();
    Double doubleAmount = Double.valueOf(intAmount);
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.cancelTransaction(
      accessId,
      accessPass,
      intAmount
    );
    // It is possible to be just changing amount.
    // Map<String, Object> execMap = service.captureOrChangeSalesTransaction(
    //   accessId,
    //   accessPass,
    //   intAmount
    // );
    commercepayments.ReferencedRefundResponse response = new commercepayments.ReferencedRefundResponse();
    response.setGatewayResultCode((String) execMap.get('Approve'));
    response.setGatewayReferenceDetails(payment.GatewayRefDetails);
    response.setAmount(doubleAmount);
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
    Map<String, Object> access = (Map<String, Object>) JSON.deserializeUntyped(
      paymentAuthorization.GatewayRefDetails
    );
    String accessId = (String) access.get('accessId');
    String accessPass = (String) access.get('accessPass');
    Integer intAmount = Math.ceil(request.amount).intValue();
    GMOPaymentService service = new GMOPaymentService();
    Map<String, Object> execMap = service.cancelTransaction(
      accessId,
      accessPass,
      intAmount
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
    Map<String, Object> error = new Map<String, Object>();
    error.put('error', 'Not Implemented.');
    return new commercepayments.ClientResponse('', error);
  }
}
