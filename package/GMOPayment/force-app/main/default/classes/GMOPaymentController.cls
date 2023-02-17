public with sharing class GMOPaymentController {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> saveCard(String token) {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doSaveCard(userId, token);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> setDefaultCard(Integer cardSeq, String expire, String holderName) {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doSetDefault(userId, cardSeq, expire, holderName);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> deleteCard(Integer cardSeq) {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doDeleteCard(userId, cardSeq);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> searchCard() {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doSearchCard(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> saveMember() {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doSaveMember(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> searchMember() {
        String userId = UserInfo.getUserId();
        GMOSiteAPINCClient client = GMOSiteAPINCClient.getInstance();
        HttpResponse response = client.doSearchMember(userId);
        String body = response.getBody();
        return GMOUtils.convertParamToMap(body);
    }
}
