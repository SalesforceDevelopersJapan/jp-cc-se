/**
 * 文字コード変換処理をまとめたユーティリティクラス
 * https://qiita.com/kaku10/items/3e88fdb9db89d66112b3
 */
public with sharing class GMOCharacterEncodingUtil {
  public enum NewlineSeparator {
    CR,
    LF,
    CRLF
  }

  private enum ByteOrder {
    BE,
    LE
  }

  public static NewlineSeparator defaultNewLineSeparator = NewlineSeparator.CRLF;
  private static final Integer CR_CODE_POINT = 13;
  private static final Integer LF_CODE_POINT = 10;

  /**
   * @param s 変換する文字列
   *
   * @return EUC-JP エンコードされたBlob型の文字列
   */
  public static Blob encodeToEucJp(String s) {
    return encodeToEucJp(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return EUC-JP エンコードされたBlob型の文字列
   */
  public static Blob encodeToEucJp(String s, NewlineSeparator sep) {
    return encode(s, 'EUC-JP', sep, 0, ByteOrder.BE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return Shift_JIS エンコードされたBlob型の文字列
   */
  public static Blob encodeToShiftJis(String s) {
    return encodeToShiftJis(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return Shift_JIS エンコードされたBlob型の文字列
   */
  public static Blob encodeToShiftJis(String s, NewlineSeparator sep) {
    return encode(s, 'Shift_JIS', sep, 0, ByteOrder.BE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return ISO-2022-JP エンコードされたBlob型の文字列
   */
  public static Blob encodeToIso2022Jp(String s) {
    return encodeToIso2022Jp(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return ISO-2022-JP エンコードされたBlob型の文字列
   */
  public static Blob encodeToIso2022Jp(String s, NewlineSeparator sep) {
    return encode(s, 'ISO-2022-JP', sep, 0, ByteOrder.BE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return UTF-16 エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf16(String s) {
    return encodeToUtf16(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return UTF-16 エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf16(String s, NewlineSeparator sep) {
    return encode(s, 'UTF-16BE', sep, 2, ByteOrder.BE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return UTF-16LE エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf16LE(String s) {
    return encodeToUtf16LE(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return UTF-16LE エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf16LE(String s, NewlineSeparator sep) {
    return encode(s, 'UTF-16LE', sep, 2, ByteOrder.LE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return UTF-32 エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf32(String s) {
    return encodeToUtf32(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return UTF-32 エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf32(String s, NewlineSeparator sep) {
    return encode(s, 'UTF-32BE', sep, 4, ByteOrder.BE);
  }

  /**
   * @param s 変換する文字列
   *
   * @return UTF-32LE エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf32LE(String s) {
    return encodeToUtf32LE(s, defaultNewLineSeparator);
  }

  /**
   * @param s 変換する文字列
   * @param sep 変換する際の改行コード
   *
   * @return UTF-32LE エンコードされたBlob型の文字列
   */
  public static Blob encodeToUtf32LE(String s, NewlineSeparator sep) {
    return encode(s, 'UTF-32LE', sep, 4, ByteOrder.LE);
  }

  /**
   * @param s 変換する文字列
   * @param enc エンコード方式(cf. https://www.iana.org/assignments/character-sets/character-sets.xhtml)
   * @param sep 変換する際の改行コード
   * @param fixedByte `enc` の固定バイト長（可変であれば0を入力）
   * @param bo エンディアン
   *
   * @return enc 形式でエンコードされたBlob型の文字列
   */
  private static Blob encode(
    String s,
    String enc,
    NewlineSeparator sep,
    Integer fixedByte,
    ByteOrder bo
  ) {
    String hexString = EncodingUtil.urlEncode(
        convertAsciiToHex(s, sep, fixedByte, bo),
        enc
      )
      .replaceAll('%', '')
      .toLowerCase();
    return EncodingUtil.convertFromHex(hexString);
  }

  /**
   * @param s 変換する文字列
   * @param sep 改行コード
   * @param fixedByte エンコード方式の固定バイト長（可変であれば0を入力）
   * @param bo エンディアン
   *
   * @return ASCII文字のみ16進数に変換された文字列
   */
  private static String convertAsciiToHex(
    String s,
    NewlineSeparator sep,
    Integer fixedByte,
    ByteOrder bo
  ) {
    List<String> partiallyEncodedStrings = new List<String>();
    String newline = getNewLineHex(sep, fixedByte, bo);
    for (Integer i = 0; i < s.length(); i++) {
      if (s.codePointAt(i) == LF_CODE_POINT) {
        // \n(改行)の場合
        partiallyEncodedStrings.add(newline);
      } else if (s.codePointAt(i) <= 127) {
        // その他ASCIIの場合
        partiallyEncodedStrings.add(
          padZeros(
            EncodingUtil.convertToHex(Blob.valueOf(s.substring(i, i + 1))),
            fixedByte,
            bo
          )
        );
      } else {
        partiallyEncodedStrings.add(s.substring(i, i + 1));
      }
    }
    return String.join(partiallyEncodedStrings, '');
  }

  /**
   * @param sep 改行コード
   * @param fixedByte エンコード方式の固定バイト長（可変であれば0を入力）
   * @param bo エンディアン
   *
   * @return 16進数表記の改行コード文字列
   */
  private static String getNewLineHex(
    NewlineSeparator sep,
    Integer fixedByte,
    ByteOrder bo
  ) {
    if (sep == NewlineSeparator.CRLF) {
      return padZeros(
          EncodingUtil.convertToHex(
            Blob.valueOf(
              String.fromCharArray(new List<Integer>{ CR_CODE_POINT })
            )
          ),
          fixedByte,
          bo
        ) +
        padZeros(
          EncodingUtil.convertToHex(
            Blob.valueOf(
              String.fromCharArray(new List<Integer>{ LF_CODE_POINT })
            )
          ),
          fixedByte,
          bo
        );
    } else if (sep == NewlineSeparator.CR) {
      return padZeros(
        EncodingUtil.convertToHex(
          Blob.valueOf(String.fromCharArray(new List<Integer>{ CR_CODE_POINT }))
        ),
        fixedByte,
        bo
      );
    }
    return padZeros(
      EncodingUtil.convertToHex(
        Blob.valueOf(String.fromCharArray(new List<Integer>{ LF_CODE_POINT }))
      ),
      fixedByte,
      bo
    );
  }

  /**
   * @param hex 16進数表記の文字列
   * @param fixedByte 固定バイト長
   * @param bo エンディアン
   *
   * @return 0埋めされた16進数表記の文字列
   */
  private static String padZeros(String hex, Integer fixedByte, ByteOrder bo) {
    if (bo == ByteOrder.LE) {
      return hex.rightPad(fixedByte * 2, '00');
    }
    return hex.leftPad(fixedByte * 2, '00');
  }
}
