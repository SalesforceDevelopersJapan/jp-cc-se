public class GMOUtils {
  public static String urlEncodedParams(Map<String, Object> params) {
    String body = '';
    Boolean first = true;
    for (String key : params.keySet()) {
      if (first) {
        first = false;
      } else {
        body += '&';
      }
      // NOTE: do not encode values to allow PaymentsNamedConnection to replace the secure fields
      // values that need to be encoded should be encoded by this method's caller
      body += GMOUtils.urlEncode(key) + '=' + params.get(key);
    }
    return body;
  }

  public static String urlEncode(String str) {
    return EncodingUtil.urlEncode(str, 'UTF-8');
  }

  public static Map<String, Object> convertParamToMap(String body) {
    Map<String, Object> keyMap = new Map<String, Object>();
    try {
      if (body.contains('RedirectUrl')) {
        /**
         * Sample:
         * ACS=2&RedirectUrl=https://manage.tds2gw.gmopg.jp/api/v2/brw/callback?transId=6e48e31f-2940-48e1-a702-ebba2f3373ee&t=dccc8a7ed85372c9accff576bff59b3a
         * */
        String[] redirectParams = body.split('&', 2);
        keyMap.put('ACS', redirectParams[0].split('=')[1]);
        keyMap.put('RedirectUrl', redirectParams[1].split('=', 2)[1]);
        return keyMap;
      }
      String[] params = body.split('&');
      for (String p : params) {
        String[] keyValue = p.split('=');
        keyMap.put(keyValue[0], keyValue.size() > 1 ? keyValue[1] : '');
      }
      return keyMap;
    } catch (System.Exception e) {
      keyMap.put('error', body);
      return keyMap;
    }
  }

  public static GMO_Configuration__mdt getMetadata() {
    return [
      SELECT
        jsUrl__c,
        shopId__c,
        shopNC__c,
        siteNC__c,
        shopPass__c,
        siteId__c,
        sitePass__c,
        useUserId__c,
        retUrl__c,
        tdTenantName__c,
        tdFlag__c,
        tds2Type__c,
        tdRequired__c,
        tds2ChallengeIndType__c
      FROM GMO_Configuration__mdt
    ][0];
  }

  public static String generateId() {
    Double d = Math.random() * 10000000;
    String seed = String.valueOf(d.intValue());
    return seed + String.valueOf(Datetime.now().formatGMT('yyyyMMddHHmmssSSS'));
  }

  public static String makeYYMM(Integer year, Integer month) {
    return Datetime.newInstance(year, month, 1).format('YYMM');
  }

  public static boolean isCardSeq(String tokenOrCardSeq) {
    return tokenOrCardSeq.length() < 5 && tokenOrCardSeq.isNumeric();
  }

  public static boolean isValidSecurityCode(String securityCode) {
    return securityCode.length() < 5 && securityCode.isNumeric();
  }

  public static Double convertProperAmount(Double amount) {
    return Math.ceil(amount);
  }

  public static String getGMOMemberId(String effectiveAccountId) {
    GMO_Configuration__mdt config = GMOUtils.getMetadata();
    if (config.useUserId__c) {
      return UserInfo.getUserId();
    } else {
      User user = [
        SELECT AccountId
        FROM User
        WHERE Id = :UserInfo.getUserId()
      ];
      return user.AccountId;
    }
  }

  public static GMOSession__c saveGMOSession(
    String orderID,
    String accessID,
    String accessPass,
    String billingAddressJsonStr
  ) {
    GMOSession__c gmoSession = new GMOSession__c();
    gmoSession.AccessId__c = accessID;
    gmoSession.AccessPass__c = accessPass;
    gmoSession.OrderId__c = orderID;
    gmoSession.AddressJson__c = billingAddressJsonStr;
    insert gmoSession;
    return gmoSession;
  }

  public static GMOSession__c saveGMOSessionPass(
    String orderID,
    String accessID,
    String accessPass
  ) {
    GMOSession__c gmoSession = [
      SELECT AccessPass__c
      FROM GMOSession__c
      WHERE AccessId__c = :accessID OR OrderId__c = :orderID
      LIMIT 1
    ];
    gmoSession.AccessPass__c = accessPass;
    update gmoSession;
    return gmoSession;
  }

  public static GMOSession__c getGMOSessionByAccessId(String accessID) {
    return [
      SELECT AccessId__c, AccessPass__c, OrderId__c, AddressJson__c
      FROM GMOSession__c
      WHERE AccessId__c = :accessID
    ];
  }

  public static GMOSession__c getGMOSessionByOrderId(String orderID) {
    return [
      SELECT AccessId__c, AccessPass__c, OrderId__c, AddressJson__c
      FROM GMOSession__c
      WHERE OrderId__c = :orderID
    ];
  }
}
