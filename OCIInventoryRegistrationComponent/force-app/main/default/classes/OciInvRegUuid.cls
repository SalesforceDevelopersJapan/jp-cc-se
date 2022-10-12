/**
 * A UUID generator that can construct unique IDs in a variety of formats.
 *
 * A UUID is generated immediately upon instantiation of this class. The UUID can be retrieved in its normal form
 * (e.g. f111b8c5-ca2f-4a1a-8d0d-a8dd5f37c05f) or as a shortened web-safe form (e.g. jp64hwPZ-Lh7vY8INQA7ImQPbQE), which
 * is constructed by converting the UUID to Base64 and replacing '/' and '+' with '-' and '_', respectively.
 */
public class OciInvRegUuid {
  private static final String HEX_PREFIX = '0x';
  private static final String HEX_ALPHABET = '0123456789abcdef';
  private static final String[] HEX_CHARACTERS = HEX_ALPHABET.split('');

  public static final Integer UUID_V4_LENGTH = 36;
  public static final String UUID_V4_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  public static final String UUID_SHORT_REGEX = '[0-9a-zA-Z-_]{27}';

  // UUID value in its normal form
  public final String value { get; private set; }

  // UUID value in its web-safe short-form
  public final String shortValue { get; private set; }

  /*
   * Constructs a new UUID.
   */
  public OciInvRegUuid() {
    this.value = generate();
    this.shortValue = getShortValue(this);
  }

  /*
   * Overrides the toString() method to return the formatted UUID value.
   * @return Formatted UUID value
   */
  public override String toString() {
    return value;
  }

  //==================================================================================================================
  // Private
  //==================================================================================================================

  /*
   * Generates a UUID string according to the UUID v4 spec.
   * @return A newly generated UUID
   */
  private String generate() {
    String hexValue = EncodingUtil.convertToHex(Crypto.generateAesKey(128));

    // Version Calculation: (i & 0x0f) | 0x40
    // Version Format: Always begins with 4
    String versionShiftedHexBits = getShiftedHexBits(
      hexValue.substring(14, 16),
      convertHexToInteger('0x0f'),
      convertHexToInteger('0x40')
    );

    // Variant Calculation: (i & 0x3f) | 0x80
    // Variant Format: Always begins with 8, 9, A or B
    String variantShiftedHexBits = getShiftedHexBits(
      hexValue.substring(18, 20),
      convertHexToInteger('0x3f'),
      convertHexToInteger('0x80')
    );

    String uuid =
      hexValue.substring(0, 8) + // time-low
      '-' +
      hexValue.substring(8, 12) + // time-mid
      '-' +
      versionShiftedHexBits +
      hexValue.substring(14, 16) + // time-high-and-version
      '-' +
      variantShiftedHexBits +
      hexValue.substring(18, 20) + // clock-seq-and-reserved + clock-seq-low
      '-' +
      hexValue.substring(20); // node

    return uuid;
  }

  private String getShiftedHexBits(
    String hexSubstring,
    Integer lowerThreshold,
    Integer upperThreshold
  ) {
    Integer shiftedIntegerBits =
      (convertHexToInteger(hexSubstring) & lowerThreshold) | upperThreshold;
    return convertIntegerToHex(shiftedIntegerBits);
  }

  /*
   * Converts a given hexadecimal string to an integer value.
   * @param hexValue {String} Value to be converted
   * @return Integer equivalent to the given string
   */
  private Integer convertHexToInteger(String hexValue) {
    Integer hexBase = HEX_ALPHABET.length();
    hexValue = hexValue.toLowerCase();

    if (hexValue.startsWith(HEX_PREFIX)) {
      hexValue = hexValue.substringAfter(HEX_PREFIX);
    }

    Integer integerValue = 0;
    for (String hexCharacter : hexValue.split('')) {
      Integer hexCharacterIndex = HEX_CHARACTERS.indexOf(hexCharacter);

      integerValue = hexBase * integerValue + hexCharacterIndex;
    }
    return integerValue;
  }

  /*
   * Converts a given integer to a hexadecimal string.
   * @param integerValue {Integer} Value to be converted
   * @return Hexadecimal equivalent to the given integer
   */
  private String convertIntegerToHex(Integer integerValue) {
    Integer hexBase = HEX_ALPHABET.length();
    String hexValue = '';
    while (integerValue > 0) {
      Integer hexCharacterIndex = Math.mod(integerValue, hexBase);

      hexValue = HEX_CHARACTERS[hexCharacterIndex] + hexValue;
      integerValue = integerValue / hexBase;
    }
    return hexValue;
  }

  //==================================================================================================================
  // Static
  //==================================================================================================================

  /*
   * Determines whether a given string is a valid UUID.
   * @param uuid {String} A UUID string
   * @return True if the given string represents a valid UUID; false otherwise
   */
  public static Boolean validate(String uuid) {
    // Should not be an empty string
    if (String.isBlank(uuid)) {
      return false;
    }

    // Should be of appropriate length
    if (uuid.length() != UUID_V4_LENGTH) {
      return false;
    }

    // Should match UUID regex
    Pattern uuidPattern = Pattern.compile(UUID_V4_REGEX.toLowerCase());
    Matcher uuidMatcher = uuidPattern.matcher(uuid.toLowerCase());
    return !!uuidMatcher.matches();
  }

  /*
   * Generates a hashed and base64-encoded representation of the UUID, with '/' and '+' characters will be replaced by '-'
   * and '_', respectively, to avoid compatibility issues.
   * @param A UUID to convert
   * @return UUID value encoded as a base64 string
   */
  public static String getShortValue(OciInvRegUuid uuid) {
    // Remove hyphens
    String value = uuid.value.replace('-', '');

    // Hash the UUID and convert to a base-64 string and replace '/' and '+'
    Blob digest = Crypto.generateDigest('SHA1', Blob.valueOf(value));
    String encoded = EncodingUtil.base64Encode(digest);

    // Drop trailing '=' and replace '/' and '+'
    return encoded.substring(0, encoded.length() - 1)
      .replace('/', '-')
      .replace('+', '_');
  }
}
