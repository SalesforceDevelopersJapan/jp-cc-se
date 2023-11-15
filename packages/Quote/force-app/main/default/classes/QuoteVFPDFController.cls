public with sharing class QuoteVFPDFController {
  public ConnectApi.CartSummary summary { get; set; }
  public Account account { get; set; }
  public List<ConnectApi.CartItem> items { get; set; }
  public String today { get; set; }
  public String language { get; set; }
  public String currencyFormat { get; set; }

  public QuoteVFPDFController() {
    String webstoreId = ApexPages.currentPage()
      .getParameters()
      .get('webstoreId');
    String activeCartOrId = ApexPages.currentPage()
      .getParameters()
      .get('activeCartOrId');
    String language = ApexPages.currentPage().getParameters().get('language');

    // Let this use context account data for security
    ConnectApi.CartItemCollection cart = ConnectApi.CommerceCart.getCartItems(
      webstoreId,
      null,
      activeCartOrId
    );
    this.summary = cart.cartSummary;
    this.currencyFormat = this.summary.currencyIsoCode == 'JPY'
      ? '¥{0, number, ###,###}'
      : '{0, number, currency}';

    List<ConnectApi.CartItem> cartItems = new List<ConnectApi.CartItem>();
    for (ConnectApi.CartItemResult item : cart.cartItems) {
      cartItems.add((ConnectApi.CartItem) item.cartItem);
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
    this.language = language == null ? UserInfo.getLanguage() : language;
  }

  @AuraEnabled(cacheable=false)
  public static String getPDF(
    String webstoreId,
    String activeCartOrId,
    String language
  ) {
    try {
      PageReference pageRef = new PageReference('/apex/QuoteVFPDF');
      pageRef.getParameters().put('webstoreId', webstoreId);
      pageRef.getParameters().put('activeCartOrId', activeCartOrId);
      pageRef.getParameters().put('language', language);
      Blob PDF = pageRef.getContent();
      return EncodingUtil.base64Encode(PDF);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
