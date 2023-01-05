@isTest
private class OciInvRegControllerTest {
  @IsTest
  static void shouldUploadInventoryAvailability() {
    OciInvRegController.UpdateRequest updateRequest = new OciInvRegController.UpdateRequest();
    updateRequest.onHand = 10;
    updateRequest.sku = 'TestSKU';
    updateRequest.effectiveDate = '2020-12-08T14:05:22.790896-07:00';
    updateRequest.safetyStockCount = 10;
    updateRequest.futures = new List<OciInvRegController.UpdateRequestFuture>();
    OciInvRegController.OperationRequest operationRequest = new OciInvRegController.OperationRequest();
    operationRequest.location = 'TestLocationID';
    operationRequest.mode = 'UPDATE';
    Test.startTest();
    System.assert(operationRequest.mode == 'UPDATE');
    System.assert(updateRequest.sku == 'TestSKU');
    Test.stopTest();
  }

  @testSetup
  static void setup() {
    Schema.LocationGroup locationGroup = new Schema.LocationGroup(
      LocationGroupName = 'サンプルロケーショングループ',
      ExternalReference = 'inventory_m',
      IsEnabled = true,
      ShouldSyncWithOci = true,
      Description = 'サンプルロケーショングループの説明文'
    );
    insert locationGroup;
  }

  @IsTest
  static void shouldGetLocationGroups() {
    Test.startTest();
    List<LocationGroup> lgs = OciInvRegController.getLocationGroups(1);
    System.assert(lgs.size() > 0);
    Test.stopTest();
  }
}
