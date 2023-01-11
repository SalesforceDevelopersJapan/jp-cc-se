declare module "@salesforce/apex/OrderPadController.searchProducts" {
  export default function searchProducts(param: {webstoreId: any, effectiveAccountId: any, productSearchInput: any}): Promise<any>;
}
declare module "@salesforce/apex/OrderPadController.addToCart" {
  export default function addToCart(param: {webstoreId: any, effectiveAccountId: any, activeCartOrId: any, cartItemInput: any}): Promise<any>;
}
declare module "@salesforce/apex/OrderPadController.getWebStores" {
  export default function getWebStores(param: {accountId: any}): Promise<any>;
}
declare module "@salesforce/apex/OrderPadController.getCarts" {
  export default function getCarts(param: {webstoreId: any, effectiveAccountId: any, contactId: any}): Promise<any>;
}
