public with sharing class OciInvRegController {
  public class OperationRequest {
    public String location;
    public String mode;
  }

  public class UpdateRequestFuture {
    @AuraEnabled
    public Integer quantity { get; set; }
    @AuraEnabled
    public String expectedDate { get; set; }
  }

  public class UpdateRequest {
    String recordId;
    @AuraEnabled
    public Integer onHand { get; set; }
    @AuraEnabled
    public String sku { get; set; }
    @AuraEnabled
    public String effectiveDate { get; set; }
    @AuraEnabled
    public Integer safetyStockCount { get; set; }
    @AuraEnabled
    public List<UpdateRequestFuture> futures { get; set; }
    @AuraEnabled
    public String locationId { get; set; }
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.OCIUploadInventoryAvailabilityOutputRepresentation uploadInventoryAvailability(
    OciInvRegController.UpdateRequest request,
    String locationId
  ) {
    OciInvRegController.OperationRequest operation = new OciInvRegController.OperationRequest();
    operation.location = locationId;
    operation.mode = 'UPDATE';
    request.recordId = new OciInvRegUuid().toString();
    String jsonsStr =
      JSON.serialize(operation, true) +
      '\n' +
      JSON.serialize(request, true);
    return ConnectApi.OmnichannelInventoryService.submitInventoryAvailabilityUpload(
      new ConnectApi.BinaryInput(
        Blob.valueof(jsonsStr),
        'application/json',
        'test.json'
      )
    );
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.OCIUploadInventoryAvailabilityStatusOutputRepresentation getInventoryAvailabilityUploadStatus(
    String uploadId
  ) {
    return ConnectApi.OmnichannelInventoryService.getInventoryAvailabilityUploadStatus(
      uploadId
    );
  }

  @AuraEnabled(cacheable=true)
  public static List<LocationGroup> getLocationGroups(Integer limitNum) {
    return [
      SELECT Id, LocationGroupName, ExternalReference
      FROM LocationGroup
      WITH SECURITY_ENFORCED
      LIMIT :limitNum
    ];
  }

  @AuraEnabled(cacheable=false)
  public static ConnectApi.OCIGetInventoryAvailabilityOutputRepresentation getInventoryAvailability(
    ConnectApi.OCIGetInventoryAvailabilityInputRepresentation request
  ) {
    return ConnectApi.OmnichannelInventoryService.getInventoryAvailability(
      request
    );
  }
}
