public with sharing class QuotationPDFController {
  public ConnectApi.CartSummary summary { get; set; }
  public Account account { get; set; }
  public List<ConnectApi.CartItem> items { get; set; }
  public String today { get; set; }

  public QuotationPDFController() {
    String webstoreId = ApexPages.currentPage()
      .getParameters()
      .get('webstoreId');
    String activeCartOrId = ApexPages.currentPage()
      .getParameters()
      .get('activeCartOrId');

    // Let this use context account data for security
    ConnectApi.CartItemCollection cart = ConnectApi.CommerceCart.getCartItems(
      webstoreId,
      null,
      activeCartOrId
    );
    this.summary = cart.cartSummary;

    List<ConnectApi.CartItem> cartItems = new List<ConnectApi.CartItem>();
    for (ConnectApi.CartItemResult item : cart.cartItems) {
        cartItems.add((ConnectApi.CartItem)item.cartItem);
    }
    this.items = cartItems;
    sObject accountSObj = [
      SELECT
        Id,
        Name,
        ShippingPostalCode,
        ShippingState,
        ShippingCity,
        ShippingStreet,
        Phone,
        Fax
      FROM Account
      WHERE Id = :this.summary.accountId
      LIMIT 1
    ];
    this.account = (Account) accountSObj;
    this.today = System.now().format('yyyy/MM/dd HH:mm', 'JST');
  }

  @AuraEnabled(cacheable=false)
  public static String getPDF(String webstoreId, String activeCartOrId) {
    try {
      PageReference pageRef = new PageReference(
        '/apex/QuotationPDF?webstoreId=' +
          webstoreId +
          '&activeCartOrId=' +
          activeCartOrId
      );
      Blob PDF = pageRef.getContent();
      return EncodingUtil.base64Encode(PDF);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
