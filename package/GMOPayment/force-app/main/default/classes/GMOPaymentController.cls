public with sharing class GMOPaymentController {

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> entryTransaction(String webstoreId) {
        ConnectApi.CartSummary cart = ConnectApi.CommerceCart.getCartSummary(webstoreId, null, 'active');
        GMOShopAPINCClient client = GMOShopAPINCClient.getInstance();
        // Using cart id as order id for GMO.
        HttpResponse entryResponse = client.doEntryTran(cart.cartId, Integer.valueOf(cart.totalChargeAmount));
        String entryBody = entryResponse.getBody();
        Map<String, Object> entryMap = GMOUtils.convertParamToMap(entryBody);
        return GMOUtils.convertParamToMap(entryBody);
    }

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
