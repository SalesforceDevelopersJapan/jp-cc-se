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
        sitePass__c
      FROM GMO_Configuration__mdt
    ][0];
  }

  public static String generateId() {
    String seed = String.valueOf(Crypto.getRandomInteger());
    if (seed.length() > 7) {
      seed = seed.SubString(0, 7);
    }
    return seed +
      '-' +
      String.valueOf(Datetime.now().formatGMT('yyyyMMddHHmmssSSS'));
  }

  public static String makeYYMM(Integer year, Integer month) {
    return Datetime.newInstance(year, month, 1).format('YYMM');
  }

  public static boolean isCardSeq(String tokenOrCardSeq) {
    return tokenOrCardSeq.length() < 5 && tokenOrCardSeq.isNumeric();
  }
}
