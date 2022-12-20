public class GMOUtils {

    public static String urlEncodedParams(Map<String, Object> params) {
        String body = '';
        Boolean first = true;
        for (String key: params.keySet()) {
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

    public static Map<String, Object> convertParamToMap(String body){
        Map<String, Object> keyMap = new Map<String, Object>();
        try{
            String[] params = body.split('&');
            for(String p: params) {
                String[] keyValue = p.split('=');
                keyMap.put(keyValue[0], keyValue.size() > 1 ? keyValue[1]: '');
            }
            return keyMap;
        }catch(System.Exception e){
            keyMap.put('error', body);
            return keyMap;
        }
    }

    public static GMO_Configuration__mdt getMetadata(){
        Cache.OrgPartition partition = Cache.Org.getPartition('local.gmo');
        if(partition.contains('configulation')){
            return (GMO_Configuration__mdt)partition.get('configulation');
        }
        GMO_Configuration__mdt config = [SELECT jsUrl__c, shopId__c, shopNC__c, siteNC__c FROM GMO_Configuration__mdt][0];
        partition.put('configulation', config, 3600);
        return config;
    }
}
