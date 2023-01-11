declare module "@salesforce/apex/B2BOrderPadController.searchProducts" {
  export default function searchProducts(param: {webstoreId: any, effectiveAccountId: any, productSearchInput: any}): Promise<any>;
}
declare module "@salesforce/apex/B2BOrderPadController.addToCart" {
  export default function addToCart(param: {webstoreId: any, effectiveAccountId: any, activeCartOrId: any, cartItemInput: any}): Promise<any>;
}
declare module "@salesforce/apex/B2BOrderPadController.getWebStores" {
  export default function getWebStores(param: {accountId: any}): Promise<any>;
}
declare module "@salesforce/apex/B2BOrderPadController.getCarts" {
  export default function getCarts(param: {webstoreId: any, effectiveAccountId: any, contactId: any}): Promise<any>;
}
