public with sharing class QuotationPDFController {
    
    private final String test;
    private final ConnectApi.CartSummary summary;

    public QuotationPDFController() {
        // String webstoreId = ApexPages.currentPage().getParameters().get('webstoreId');
        // String effectiveAccountId = ApexPages.currentPage().getParameters().get('effectiveAccountId');
        // String activeCartOrId = ApexPages.currentPage().getParameters().get('activeCartOrId');
        // this.summary = ConnectApi.CommerceCart.getCartSummary(webstoreId, effectiveAccountId, activeCartOrId)
        test = ApexPages.currentPage().getParameters().get('test');
    }

    public String getTest() {
        return test;
    }

    @AuraEnabled(cacheable=false)
    public static String getPDF(){
        try {
            PageReference pageRef = new PageReference('/apex/QuotationPDF?test=12345');
            Blob PDF = pageRef.getContent();
            return EncodingUtil.base64Encode(PDF);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}
