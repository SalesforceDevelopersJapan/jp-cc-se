public with sharing class GenericCartFieldController {
  class CustomField {
    @AuraEnabled
    public String label { get; set; }
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String type { get; set; }
    @AuraEnabled
    public Map<String, String> picklistValues { get; set; }
    @AuraEnabled
    public Object defaultValue { get; set; }
    @AuraEnabled
    public String defaultValueFormula { get; set; }
    @AuraEnabled
    public Integer precision { get; set; }
    @AuraEnabled
    public Integer digits { get; set; }
    @AuraEnabled
    public Integer length { get; set; }
    @AuraEnabled
    public Integer scale { get; set; }
    @AuraEnabled
    public Boolean isRequired { get; set; }
  }

  private static Map<String, String> toPickupValueMap(
    List<Schema.PicklistEntry> ple
  ) {
    Map<String, String> pickupValueMap = new Map<String, String>();
    for (Schema.PicklistEntry pickListVal : ple) {
      pickupValueMap.put(pickListVal.getValue(), pickListVal.getLabel());
    }
    return pickupValueMap;
  }

  @AuraEnabled(cacheable=false)
  public static GenericCartFieldController.CustomField getCustomField(
    String fieldName
  ) {
    Schema.SObjectType s = Schema.getGlobalDescribe().get('WebCart');
    Schema.DescribeSObjectResult sd = s.getDescribe();
    for (Schema.SObjectField ss : sd.fields.getMap().values()) {
      DescribeFieldResult fieldResult = ss.getDescribe();
      if (fieldResult.getName() == fieldName) {
        // https://developer.salesforce.com/docs/atlas.ja-jp.apexcode.meta/apexcode/apex_methods_system_fields_describe.htm#apex_methods_system_fields_describe
        GenericCartFieldController.CustomField field = new GenericCartFieldController.CustomField();
        field.label = fieldResult.getLabel();
        field.name = fieldResult.getName();
        field.type = fieldResult.getType().name();
        field.picklistValues = toPickupValueMap(
          fieldResult.getPicklistValues()
        );
        field.defaultValue = fieldResult.getDefaultValue();
        field.defaultValueFormula = fieldResult.getDefaultValueFormula();
        field.precision = fieldResult.getPrecision();
        field.digits = fieldResult.getDigits();
        field.length = fieldResult.getLength();
        field.scale = fieldResult.getScale();
        field.isRequired =
          fieldResult.isCreateable() &&
          !fieldResult.isNillable() &&
          !fieldResult.isDefaultedOnCreate();
        return field;
      }
    }
    throw new AuraHandledException(
      String.format('Field not found: {0}', new List<String>{ fieldName })
    );
  }

  @AuraEnabled(cacheable=false)
  public static WebCart getCurrentValue(String cartId, String fieldName) {
    String soql =
      'SELECT Id, ' +
      String.escapeSingleQuotes(fieldName) +
      ' FROM WebCart WHERE Id=\'' +
      String.escapeSingleQuotes(cartId) +
      '\' LIMIT 1';
    WebCart cart = Database.query(soql);
    return cart;
  }

  @AuraEnabled(cacheable=false)
  public static WebCart updateField(
    String cartId,
    String fieldName,
    String value,
    String type
  ) {
    String soql =
      'SELECT Id, ' +
      String.escapeSingleQuotes(fieldName) +
      ' FROM WebCart WHERE Id=\'' +
      String.escapeSingleQuotes(cartId) +
      '\' LIMIT 1';
    WebCart cart = Database.query(soql);
    Object data = GenericCartFieldDataFactory.create(type, value);
    cart.put(fieldName, data);
    update cart;
    return cart;
  }
}
