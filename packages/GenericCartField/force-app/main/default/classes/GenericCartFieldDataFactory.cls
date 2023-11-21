public with sharing class GenericCartFieldDataFactory {
  private static Schema.DisplayType toDisplayType(String typeStr) {
    for (Schema.DisplayType type : Schema.DisplayType.values()) {
      if (type.name().equalsIgnoreCase(typeStr))
        return type;
    }
    throw new AuraHandledException(
      String.format(
        'No Schema.DisplayType found for {0}',
        new List<String>{ typeStr }
      )
    );
  }

  public static Object create(String typeStr, String valueStr) {
    // https://developer.salesforce.com/docs/atlas.ja-jp.apexcode.meta/apexcode/apex_enum_Schema_DisplayType.htm
    // https://docs.informatica.com/data-integration/powerexchange-adapters-for-informatica/10-5/powerexchange-for-salesforce-user-guide/appendix-a--data-type-reference/salesforce-data-types-and-transformation-data-types.html
    Schema.DisplayType type = toDisplayType(typeStr);
    try {
      switch on type {
        when String,
          TextArea,
          URL,
          Phone,
          Picklist,
          Email,
          EncryptedString,
          MultiPicklist {
          // 'Apple;Orange' for multi-select picklist
          return valueStr;
        }
        when Date {
          return Date.valueOf(valueStr);
        }
        when DateTime {
          return Datetime.valueOfGmt(valueStr);
        }
        when Double, Currency, Percent {
          return Decimal.valueOf(valueStr);
        }
        when Integer {
          return Integer.valueOf(valueStr);
        }
        when Boolean {
          return Boolean.valueOf(valueStr);
        }
        when else {
          throw new AuraHandledException(
            String.format(
              'Unsupported type: {0}',
              new List<String>{ type.name() }
            )
          );
        }
      }
    } catch (Exception e) {
      throw new AuraHandledException(
        String.format(
          'Fail to convert {0} for type {1} : {2}',
          new List<String>{ valueStr, type.name(), e.getMessage() }
        )
      );
    }
  }
}
