public with sharing class QuotationPDFController {
  private final ConnectApi.CartSummary summary;
  private final Account account;
  private final List<ConnectApi.CartItemResult> items;

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
    this.items = cart.cartItems;
    sObject accountSObj = [
      SELECT Id, Name
      FROM Account
      WHERE Id = :this.summary.accountId
      LIMIT 1
    ];
    this.account = (Account) accountSObj;
  }

  public ConnectApi.CartSummary getSummary() {
    return this.summary;
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


