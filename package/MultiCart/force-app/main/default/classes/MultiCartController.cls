public with sharing class MultiCartController {
    
    @AuraEnabled(cacheable=true)
    public static List<Webcart> getCarts(String webstoreId, String effectiveAccountId, String ownerId, Boolean useForB2BCommerce){
        if (useForB2BCommerce) {
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
        } else {
            return [
                SELECT Id, Name, Status, IsSecondary, UniqueProductCount, TotalProductCount 
                FROM Webcart 
                WHERE 
                    OwnerId = :ownerId
                    AND WebStoreId = :webStoreId
                    AND Status = 'Active'
                WITH SECURITY_ENFORCED
            ];
        }
    }
    
    @AuraEnabled(cacheable=false)
    public static ConnectApi.CartSummary createCart(String webstoreId, String effectiveAccountId, String cartName, Boolean useForB2BCommerce) {
        ConnectApi.CartInput cart = new ConnectApi.CartInput();
        if (useForB2BCommerce) {
            cart.effectiveAccountId = effectiveAccountId;
        }
        cart.isSecondary = true;
        cart.name = cartName;
        ConnectApi.CartSummary cartSummary = ConnectApi.CommerceCart.createCart(webstoreId, cart);
        return cartSummary;
    } 
    
    @AuraEnabled(cacheable=false)
    public static void deleteCart(String webstoreId, String effectiveAccountId, String cartId, Boolean useForB2BCommerce) {
        if (!useForB2BCommerce) {
            effectiveAccountId = null;
        }
        ConnectApi.CommerceCart.deleteCart(webstoreId, effectiveAccountId, cartId);
    }
    
    @AuraEnabled(cacheable=false)
    public static ConnectApi.CommerceActionResult setPrimaryCart(String webstoreId, String effectiveAccountId, String cartId, Boolean useForB2BCommerce) {
        if (!useForB2BCommerce) {
            effectiveAccountId = null;
        }
        ConnectApi.CommerceActionResult result = ConnectApi.CommerceCart.makeCartPrimary(webstoreId, cartId, effectiveAccountId);
        return result;
    }

}
