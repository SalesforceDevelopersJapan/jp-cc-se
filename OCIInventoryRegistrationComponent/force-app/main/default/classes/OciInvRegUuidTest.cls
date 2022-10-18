@IsTest
public class OciInvRegUuidTest {
  private static List<OciInvRegUuid> getUuids() {
    List<OciInvRegUuid> uuids = new List<OciInvRegUuid>();
    for (Integer i = 0; i < 100; i++) {
      uuids.add(new OciInvRegUuid());
    }
    return uuids;
  }

  @isTest
  private static void shouldGenerateValidUuids() {
    Test.startTest();

    List<OciInvRegUuid> uuids = getUuids();
    Pattern uuidPattern = Pattern.compile(OciInvRegUuid.UUID_V4_REGEX);
    Test.stopTest();

    for (OciInvRegUuid id : uuids) {
      System.assert(
        uuidPattern.matcher(id.value).matches(),
        'Invalid UUID: ' + id.value
      );
    }
  }

  @IsTest
  private static void shouldGenerateShortUuids() {
    Test.startTest();
    List<OciInvRegUuid> uuids = getUuids();
    Pattern uuidPattern = Pattern.compile(OciInvRegUuid.UUID_SHORT_REGEX);
    Test.stopTest();

    for (OciInvRegUuid id : uuids) {
      System.assert(
        uuidPattern.matcher(id.shortValue).matches(),
        'Invalid short UUID: ' + id.shortValue
      );
    }
  }

  @IsTest
  private static void shouldValidateUuids() {
    System.assert(
      OciInvRegUuid.validate('73b82667-99bf-4564-82bb-9f95a08ca306')
    ); // Valid
    System.assert(!OciInvRegUuid.validate('73b8266799bf456482bb9f95a08ca306')); // Missing hyphens
    System.assert(
      !OciInvRegUuid.validate('73b82667-99bf-4564-82bb-9f95a08ca30')
    ); // Not enough characters
    System.assert(!OciInvRegUuid.validate('')); // Empty String
  }

  @IsTest
  private static void stringRepresentationShouldMatchFormattedValue() {
    Test.startTest();
    List<OciInvRegUuid> uuids = getUuids();
    Test.stopTest();

    for (OciInvRegUuid id : uuids) {
      System.assertEquals(id.value, id.toString());
    }
  }
}
