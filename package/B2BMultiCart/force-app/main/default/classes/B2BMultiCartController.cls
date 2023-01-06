public with sharing class B2BMultiCartController {
    
    @AuraEnabled(cacheable=true)
    public static List<Webcart> getCarts(String webstoreId, String effectiveAccountId, String ownerId){
        return [
            SELECT Id, Name, Status, IsSecondary, UniqueProductCount, TotalProductCount 
            FROM Webcart 
            WHERE 
                OwnerId = :ownerId
                AND AccountId = :effectiveAccountId
                AND WebStoreId = :webStoreId
                AND Status = 'Active'
            WITH SECURITY_ENFORCED
        ];
    }
    
    @AuraEnabled(cacheable=false)
    public static ConnectApi.CartSummary createCart(String webstoreId, String effectiveAccountId, String cartName) {
        ConnectApi.CartInput cart = new ConnectApi.CartInput();
        cart.effectiveAccountId = effectiveAccountId;
        cart.isSecondary = true;
        cart.name = cartName;
        
        ConnectApi.CartSummary cartSummary = ConnectApi.CommerceCart.createCart(webstoreId, cart);
        
        return cartSummary;
    } 
    
    @AuraEnabled(cacheable=false)
    public static void deleteCart(String webstoreId, String effectiveAccountId, String cartId) {
        ConnectApi.CommerceCart.deleteCart(webstoreId, effectiveAccountId, cartId);
    }
    
    @AuraEnabled(cacheable=false)
    public static ConnectApi.CommerceActionResult setPrimaryCart(String webstoreId, String effectiveAccountId, String cartId) {
        ConnectApi.CommerceActionResult result = ConnectApi.CommerceCart.makeCartPrimary(webstoreId, cartId, effectiveAccountId);
        return result;
    }

}
