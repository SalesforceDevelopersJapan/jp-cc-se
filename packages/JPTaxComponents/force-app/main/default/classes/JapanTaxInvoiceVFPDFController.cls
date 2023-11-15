public with sharing class JapanTaxInvoiceVFPDFController {
  public JapanTaxService.OrderSummaryTotals orderSummaryTotals { get; set; }
  public User user { get; set; }
  public String today { get; set; }
  public String orderDate { get; set; }
  public String language { get; set; }
  public Map<String, Object> eightTax { get; set; }
  public Map<String, Object> tenTax { get; set; }
  public String currencyFormat { get; set; }

  public JapanTaxInvoiceVFPDFController() {
    String orderSummaryId = ApexPages.currentPage()
      .getParameters()
      .get('orderSummaryId');
    String language = ApexPages.currentPage().getParameters().get('language');
    this.orderSummaryTotals = JapanTaxService.getOrderSummaryTotals(
      orderSummaryId
    );
    Map<String, Object> zeroValue = new Map<String, Object>{
      'taxBasisAmount' => 0,
      'taxAmount' => 0,
      'taxAdjustmentAmount' => 0
    };
    Map<String, Object> taxByRate = (Map<String, Object>) this.orderSummaryTotals.summary.get(
      'taxByRate'
    );
    Map<String, Object> ten = (Map<String, Object>) taxByRate.get('10');
    Map<String, Object> eight = (Map<String, Object>) taxByRate.get('8');
    this.tenTax = ten == null ? zeroValue : ten;
    this.eightTax = eight == null ? zeroValue : eight;
    this.today = System.now().format('yyyy/MM/dd HH:mm', 'JST');
    Datetime orderDateObj = (Datetime) this.orderSummaryTotals.summary.get(
      'orderedDate'
    );
    this.orderDate = orderDateObj.format('yyyy/MM/dd HH:mm', 'JST');
    this.language = language == null ? UserInfo.getLanguage() : language;
    String currencyStr = (String) this.orderSummaryTotals.summary.get(
      'currency'
    );
    this.currencyFormat = currencyStr == 'JPY'
      ? '¥{0, number, ###,###}'
      : '{0,number,currency}';
  }

  @AuraEnabled(cacheable=false)
  public static String getPDF(String orderSummaryId, String language) {
    try {
      PageReference pageRef = new PageReference('/apex/JapanTaxInvoiceVFPDF');
      pageRef.getParameters().put('orderSummaryId', orderSummaryId);
      pageRef.getParameters().put('language', language);
      Blob PDF = pageRef.getContent();
      return EncodingUtil.base64Encode(PDF);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }
}
