public class JapanTaxService {
  public class OrderSummaryRecords {
    @AuraEnabled
    public OrderSummary orderSummary { get; set; }
    @AuraEnabled
    public List<OrderItemAdjustmentLineSummary> orderItemAdjustmentLineSummaryList {
      get;
      set;
    }
    @AuraEnabled
    public List<OrderItemSummary> orderItemSummaryList { get; set; }
    @AuraEnabled
    public List<OrderItemTaxLineItemSummary> orderItemTaxLineItemSummaryList {
      get;
      set;
    }
  }

  public class OrderSummaryTotals {
    @AuraEnabled
    public Map<String, Object> summary { get; set; }
    @AuraEnabled
    public Map<String, Object> account { get; set; }
    @AuraEnabled
    public List<Map<String, Object>> products { get; set; }
  }

  public static void addAccount(
    OrderSummaryTotals total,
    OrderSummaryRecords records
  ) {
    total.account = new Map<String, Object>();
    total.account.put('id', records.orderSummary.Account.Id);
    total.account.put(
      'name',
      String.isBlank(records.orderSummary.Account.Name)
        ? ''
        : records.orderSummary.Account.Name
    );
    total.account.put(
      'postalCode',
      String.isBlank(records.orderSummary.Account.BillingPostalCode)
        ? ''
        : records.orderSummary.Account.BillingPostalCode
    );
    total.account.put(
      'state',
      String.isBlank(records.orderSummary.Account.BillingState)
        ? ''
        : records.orderSummary.Account.BillingState
    );
    total.account.put(
      'city',
      String.isBlank(records.orderSummary.Account.BillingCity)
        ? ''
        : records.orderSummary.Account.BillingCity
    );
    total.account.put(
      'street',
      String.isBlank(records.orderSummary.Account.BillingStreet)
        ? ''
        : records.orderSummary.Account.BillingStreet
    );
    total.account.put(
      'fax',
      String.isBlank(records.orderSummary.Account.Fax)
        ? ''
        : records.orderSummary.Account.Fax
    );
    total.account.put(
      'phone',
      String.isBlank(records.orderSummary.Account.Phone)
        ? ''
        : records.orderSummary.Account.Phone
    );
  }

  public static void addSummary(
    OrderSummaryTotals total,
    OrderSummaryRecords records
  ) {
    total.summary = new Map<String, Object>();
    total.summary.put('orderNumber', records.orderSummary.OrderNumber);
    total.summary.put('orderedDate', records.orderSummary.OrderedDate);
    total.summary.put('subtotal', records.orderSummary.TotalAmount);
    total.summary.put('tax', records.orderSummary.TotalTaxAmount);
    total.summary.put('total', records.orderSummary.GrandTotalAmount);
    total.summary.put('currency', records.orderSummary.CurrencyIsoCode);
    total.summary.put(
      'totalAdjustment',
      records.orderSummary.TotalAdjDistAmount
    );
    total.summary.put('taxByRate', new Map<String, Object>());
    total.summary.put(
      'productSubtotal',
      records.orderSummary.TotalAdjustedProductAmount
    );
    total.summary.put(
      'shippingSubtotal',
      records.orderSummary.TotalAdjustedDeliveryAmount
    );
    total.summary.put('otherTaxAdjustmentAmount', 0);
    for (
      OrderItemTaxLineItemSummary tax : records.orderItemTaxLineItemSummaryList
    ) {
      OrderItemSummary item;
      for (OrderItemSummary orderItem : records.orderItemSummaryList) {
        if (orderItem.Id == tax.OrderItemSummaryId) {
          item = orderItem;
          break;
        }
      }
      if (tax.Rate == 8 || tax.Rate == 10) {
        String rate = String.valueOf(tax.Rate.intValue());
        Map<String, Object> taxByRate = (Map<String, Object>) total.summary.get(
          'taxByRate'
        );
        Map<String, Object> rateObj = (Map<String, Object>) taxByRate.get(rate);
        if (rateObj == null) {
          rateObj = new Map<String, Object>();
          rateObj.put('taxBasisAmount', (Decimal) item.TotalLineAmount);
          rateObj.put(
            'taxAdjustmentAmount',
            (Decimal) item.TotalAdjustmentAmount
          );
          rateObj.put('taxAmount', (Decimal) tax.Amount);
          taxByRate.put(rate, rateObj);
        } else {
          rateObj.put(
            'taxBasisAmount',
            (Decimal) rateObj.get('taxBasisAmount') +
            (Decimal) item.TotalLineAmount
          );
          rateObj.put(
            'taxAdjustmentAmount',
            (Decimal) rateObj.get('taxAdjustmentAmount') +
            (Decimal) item.TotalAdjustmentAmount
          );
          rateObj.put(
            'taxAmount',
            (Decimal) rateObj.get('taxAmount') + (Decimal) tax.Amount
          );
        }
      } else {
        Decimal otherTaxAdjustmentAmount = (Decimal) total.summary.get(
          'otherTaxAdjustmentAmount'
        );
        if (otherTaxAdjustmentAmount == null) {
          total.summary.put('otherTaxAdjustmentAmount', (Decimal) tax.Amount);
        } else {
          total.summary.put(
            'otherTaxAdjustmentAmount',
            otherTaxAdjustmentAmount + (Decimal) tax.Amount
          );
        }
      }
    }
  }

  public static void addItems(
    OrderSummaryTotals total,
    OrderSummaryRecords records
  ) {
    total.products = new List<Map<String, Object>>();

    for (OrderItemSummary orderItem : records.orderItemSummaryList) {
      Map<String, Object> item = new Map<String, Object>();
      item.put('name', orderItem.Name);
      item.put(
        'code',
        String.isBlank(orderItem.Product2.ProductCode)
          ? ''
          : orderItem.Product2.ProductCode
      );
      item.put('totalLineAmount', orderItem.TotalLineAmount);
      item.put('totalAdjustmentAmount', orderItem.TotalAdjustmentAmount);
      item.put(
        'totalAdjustedAmount',
        (Decimal) orderItem.TotalLineAmount +
        (Decimal) orderItem.TotalAdjustmentAmount
      );
      item.put('quantity', orderItem.Quantity);
      item.put('listPrice', orderItem.ListPrice);
      item.put('unitPrice', orderItem.UnitPrice);
      item.put('isReducedTaxRate', false);
      item.put('productType', orderItem.Type);

      // extract tax list for this item
      List<Map<String, Object>> taxList = new List<Map<String, Object>>();
      for (
        OrderItemTaxLineItemSummary tax : records.orderItemTaxLineItemSummaryList
      ) {
        if (tax.OrderItemSummaryId == orderItem.Id) {
          Map<String, Object> taxMap = new Map<String, Object>();
          taxMap.put('amount', tax.Amount);
          taxMap.put('rate', tax.Rate);
          taxList.add(taxMap);
          if (tax.Rate == 8) {
            item.put('isReducedTaxRate', true);
          }
        }
      }
      item.put('taxList', taxList);

      // extract adjustment list for this item
      List<Map<String, Object>> adjustmentList = new List<Map<String, Object>>();
      for (
        OrderItemAdjustmentLineSummary adjustment : records.orderItemAdjustmentLineSummaryList
      ) {
        if (adjustment.OrderItemSummaryId == orderItem.Id) {
          Map<String, Object> adjustmentMap = new Map<String, Object>();
          adjustmentMap.put('id', adjustment.AdjustmentCause.Id);
          adjustmentMap.put('name', adjustment.AdjustmentCause.Name);
          adjustmentList.add(adjustmentMap);
        }
      }
      item.put('adjustmentList', adjustmentList);
      total.products.add(item);
    }
  }

  public static User getUser(String userId) {
    return [
      SELECT
        Id,
        Name,
        Contact.Id,
        Contact.Name,
        Account.Id,
        Account.Name,
        Account.Fax,
        Account.Phone,
        Account.BillingStreet,
        Account.BillingCity,
        Account.BillingState,
        Account.BillingPostalCode,
        Account.BillingCountry
      FROM User
      WHERE Id = :userId
      LIMIT 1
    ];
  }

  public static OrderSummaryRecords getOrderSummaryRecords(
    String orderSummaryId
  ) {
    OrderSummaryRecords orderSummaryRecords = new OrderSummaryRecords();
    orderSummaryRecords.orderSummary = [
      SELECT
        Id,
        OrderNumber,
        CurrencyIsoCode,
        OrderedDate,
        GrandTotalAmount,
        TotalTaxAmount,
        TotalAmount,
        TotalAdjDistAmount,
        TotalAdjustedProductAmount,
        TotalAdjustedDeliveryAmount,
        Account.Id,
        Account.Name,
        Account.Fax,
        Account.Phone,
        Account.BillingStreet,
        Account.BillingCity,
        Account.BillingState,
        Account.BillingPostalCode,
        Account.BillingCountry
      FROM OrderSummary
      WHERE Id = :orderSummaryId
      LIMIT 1
    ];
    orderSummaryRecords.orderItemAdjustmentLineSummaryList = [
      SELECT
        Id,
        OrderSummaryId,
        OrderItemSummaryId,
        AdjustmentCause.Id,
        AdjustmentCause.Name
      FROM OrderItemAdjustmentLineSummary
      WHERE OrderSummaryId = :orderSummaryId
    ];
    orderSummaryRecords.orderItemSummaryList = [
      SELECT
        Id,
        Type,
        Name,
        Product2.Name,
        Product2.ProductCode,
        OrderSummaryId,
        Quantity,
        TotalAdjustmentAmount,
        TotalLineAmount,
        ListPrice,
        UnitPrice
      FROM OrderItemSummary
      WHERE OrderSummaryId = :orderSummaryId
    ];
    orderSummaryRecords.orderItemTaxLineItemSummaryList = [
      SELECT Id, Name, OrderItemSummaryId, Amount, Rate
      FROM OrderItemTaxLineItemSummary
      WHERE OrderSummaryId = :orderSummaryId
    ];
    return orderSummaryRecords;
  }

  public static OrderSummaryTotals getOrderSummaryTotals(
    String orderSummaryId
  ) {
    OrderSummaryTotals total = new OrderSummaryTotals();
    OrderSummaryRecords records = getOrderSummaryRecords(orderSummaryId);
    addSummary(total, records);
    addAccount(total, records);
    addItems(total, records);
    return total;
  }
}
