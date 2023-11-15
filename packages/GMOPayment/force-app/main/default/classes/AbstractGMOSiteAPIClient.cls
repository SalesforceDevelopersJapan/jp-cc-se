public abstract class AbstractGMOSiteAPIClient {
  public HttpResponse doExecTranWithCardDetails(
    String accessID,
    String accessPass,
    String orderID,
    String cardNo,
    String expire,
    String holderName,
    String securityCode
  ) {
    // https://docs.mul-pay.jp/payment/credit/api#exectran
    Map<String, Object> params = new Map<String, Object>();
    addBasicParamForExecTran(params, accessID, accessPass, orderID);
    add3ds2ParamsForExecTran(params);
    params.put('CardNo', cardNo);
    params.put('Expire', expire);
    params.put('HolderName', holderName);
    params.put('SecurityCode', securityCode);
    return post('/ExecTran.idPass', params);
  }

  public HttpResponse doExecTran(
    String accessID,
    String accessPass,
    String orderID,
    String token,
    String memberID,
    Integer cardSeq,
    Integer securityCode
  ) {
    // https://docs.mul-pay.jp/payment/credit/api#exectran
    Map<String, Object> params = new Map<String, Object>();
    addBasicParamForExecTran(params, accessID, accessPass, orderID);
    add3ds2ParamsForExecTran(params);
    if (!String.isEmpty(token)) {
      params.put('TokenType', 1);
      params.put('Token', token);
    } else {
      params.put('MemberID', memberID);
      params.put('CardSeq', cardSeq);
      params.put('SeqMode', 1);
      if (securityCode != null) {
        params.put('SecurityCode', securityCode);
      }
    }
    return post('/ExecTran.idPass', params);
  }

  private void addBasicParamForExecTran(
    Map<String, Object> params,
    String accessID,
    String accessPass,
    String orderID
  ) {
    params.put('AccessID', accessID);
    params.put('AccessPass', accessPass);
    params.put('OrderID', orderID);
    params.put('Method', 1);
  }

  private void add3ds2ParamsForExecTran(Map<String, Object> params) {
    GMO_Configuration__mdt metadata = GMOUtils.getMetadata();
    params.put('RetUrl', metadata.retUrl__c);
    params.put(
      'Tds2ChallengeIndType',
      Integer.valueOf(metadata.tds2ChallengeIndType__c)
    );
    params.put('CallbackType', 3);
  }

  public HttpResponse doSecureTran2(String accessID, String accessPass) {
    // https://docs.mul-pay.jp/payment/credit/api3ds2#securetran2
    Map<String, Object> params = new Map<String, Object>();
    params.put('AccessID', accessID);
    params.put('AccessPass', accessPass);
    return post('/SecureTran2.idPass', params);
  }

  public HttpResponse doSaveMember(String memberId) {
    // https://docs.mul-pay.jp/payment/credit/apimember#savemember
    Map<String, String> params = new Map<String, String>();
    params.put('MemberID', memberId);
    return post('/SaveMember.idPass', params);
  }

  public HttpResponse doSearchMember(String memberId) {
    // https://docs.mul-pay.jp/payment/credit/apimember#searchmember
    Map<String, String> params = new Map<String, String>();
    params.put('MemberID', memberId);
    return post('/SearchMember.idPass', params);
  }

  public HttpResponse doSaveCard(String memberID, String token) {
    // https://docs.mul-pay.jp/payment/credit/apimember#savecard
    Map<String, Object> params = new Map<String, Object>();
    params.put('MemberID', memberID);
    params.put('Token', token);
    params.put('SeqMode', 1);
    return post('/SaveCard.idPass', params);
  }

  public HttpResponse doSetDefault(
    String memberID,
    Integer cardSeq,
    String expire,
    String holderName
  ) {
    // https://docs.mul-pay.jp/payment/credit/apimember#savecard
    Map<String, Object> params = new Map<String, Object>();
    params.put('MemberID', memberID);
    params.put('CardSeq', cardSeq);
    params.put('Expire', expire);
    params.put('HolderName', holderName);
    params.put('DefaultFlag', 1);
    params.put('SeqMode', 1);
    params.put('UpdateType', 2);
    return post('/SaveCard.idPass', params);
  }

  public HttpResponse doDeleteCard(String memberID, Integer cardSeq) {
    // https://docs.mul-pay.jp/payment/credit/apimember#savecard
    Map<String, Object> params = new Map<String, Object>();
    params.put('MemberID', memberID);
    params.put('CardSeq', cardSeq);
    params.put('SeqMode', 1);
    return post('/DeleteCard.idPass', params);
  }

  public HttpResponse doSearchCard(String memberID) {
    // https://docs.mul-pay.jp/payment/credit/apimember#searchcard
    Map<String, Object> params = new Map<String, Object>();
    params.put('MemberID', memberID);
    params.put('SeqMode', 1);
    params.put('ValidFlag', 1);
    return post('/SearchCard.idPass', params);
  }

  protected virtual String buildRequestBody(Map<String, Object> params) {
    String body = GMOUtils.urlEncodedParams(params);
    if (!String.isEmpty(body)) {
      body += '&';
    }
    body += 'SiteID' + '=' + '{!$Credential.Username}';
    body += '&SitePass' + '=' + '{!$Credential.Password}';
    return body;
  }

  private abstract HttpResponse post(String path, Map<String, Object> params);
}
