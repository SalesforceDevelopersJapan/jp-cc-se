trigger QuoteCartItem on CartItem(before update, before delete) {
  if (Trigger.isUpdate) {
    for (CartItem newItem : Trigger.new) {
      WebCart cart = [
        SELECT Id, Quote__c
        FROM WebCart
        WHERE Id = :newItem.CartId
        LIMIT 1
      ];
      CartItem oldItem = Trigger.oldMap.get(newItem.Id);
      if (cart.Quote__c != null) {
        if (
          newItem.SalesPrice != oldItem.SalesPrice ||
          newItem.Quantity != oldItem.Quantity
        ) {
          newItem.addError(
            'You cannot change quantity or sales price of an item in a cart that is associated with a quote.'
          );
        }
      }
    }
  }
  // if (Trigger.isDelete) {
  //   for (CartItem oldItem : Trigger.old) {
  //     WebCart cart = [
  //       SELECT Id, Quote__c
  //       FROM WebCart
  //       WHERE Id = :oldItem.CartId
  //       LIMIT 1
  //     ];
  //     if (cart.Quote__c != null) {
  //       oldItem.addError(
  //         'You cannot delete an item in a cart that is associated with a quote.'
  //       );
  //     }
  //   }
  // }
}
