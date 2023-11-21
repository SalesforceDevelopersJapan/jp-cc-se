global class GenericCartFieldPickupList extends VisualEditor.DynamicPickList {
  global final static List<Schema.DisplayType> supportedTypes = new List<Schema.DisplayType>{
    Schema.DisplayType.String,
    Schema.DisplayType.Picklist,
    Schema.DisplayType.MultiPicklist,
    Schema.DisplayType.Email,
    Schema.DisplayType.Phone,
    Schema.DisplayType.Url,
    Schema.DisplayType.TextArea,
    Schema.DisplayType.EncryptedString,
    Schema.DisplayType.Currency,
    Schema.DisplayType.Double,
    Schema.DisplayType.Integer,
    Schema.DisplayType.Percent,
    Schema.DisplayType.Date,
    Schema.DisplayType.DateTime,
    Schema.DisplayType.Boolean
  };

  global override VisualEditor.DataRow getDefaultValue() {
    return new VisualEditor.DataRow('None', 'none');
  }

  global override VisualEditor.DynamicPickListRows getValues() {
    VisualEditor.DynamicPickListRows opts = new VisualEditor.DynamicPickListRows();
    Schema.SObjectType s = Schema.getGlobalDescribe().get('WebCart');
    Schema.DescribeSObjectResult sd = s.getDescribe();
    for (Schema.SObjectField ss : sd.fields.getMap().values()) {
      DescribeFieldResult field = ss.getDescribe();
      if (
        supportedTypes.indexOf(field.getType()) > -1 &&
        field.isCustom() &&
        field.isUpdateable()
      ) {
        opts.addRow(
          new VisualEditor.DataRow(field.getLabel(), field.getName())
        );
      }
    }
    return opts;
  }
}
