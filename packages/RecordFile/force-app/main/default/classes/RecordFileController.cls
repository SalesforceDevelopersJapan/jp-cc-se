public with sharing class RecordFileController {
  final static Integer MAX_FILE_COUNT = 10;

  @AuraEnabled(cacheable=false)
  public static ContentVersion uploadFile(
    String base64,
    String fileName,
    String recordId
  ) {
    if (isOverMaxFileCount(recordId)) {
      throw new AuraHandledException(
        String.format(
          'Max file count is {0}',
          new List<String>{ String.valueOf(MAX_FILE_COUNT) }
        )
      );
    }
    ContentVersion cv = createContentVersion(base64, fileName);
    ContentDocumentLink cdl = createContentLink(cv.Id, recordId);
    return cv;
  }

  @AuraEnabled(cacheable=false)
  public static String deleteFile(String recordId) {
    String id = [
      SELECT ContentDocumentId
      FROM ContentVersion
      WHERE Id = :recordId
      LIMIT 1
    ]
    .ContentDocumentId;
    delete [SELECT Id FROM ContentDocument WHERE Id = :id];
    return recordId;
  }

  @AuraEnabled(cacheable=false)
  public static ContentVersion[] getFileList(String recordId) {
    List<ContentDocumentLink> cdlList = [
      SELECT ContentDocumentId
      FROM ContentDocumentLink
      WHERE LinkedEntityId = :recordId
    ];
    List<String> cdlIdList = new List<String>();
    for (ContentDocumentLink cdl : cdlList) {
      cdlIdList.add(cdl.ContentDocumentId);
    }
    List<ContentVersion> cvList = [
      SELECT Id, Title, PathOnClient, FileExtension
      FROM ContentVersion
      WHERE ContentDocumentId IN :cdlIdList
    ];
    return cvList;
  }

  private static Boolean isOverMaxFileCount(String recordId) {
    Integer count = [
      SELECT COUNT()
      FROM ContentDocumentLink
      WHERE LinkedEntityId = :recordId
    ];
    return count >= MAX_FILE_COUNT;
  }

  private static ContentVersion createContentVersion(
    String base64,
    String fileName
  ) {
    ContentVersion cv = new ContentVersion();
    cv.VersionData = EncodingUtil.base64Decode(base64);
    cv.Title = fileName;
    cv.PathOnClient = fileName;
    insert cv;
    return cv;
  }

  private static ContentDocumentLink createContentLink(
    String contentVersionId,
    String recordId
  ) {
    ContentDocumentLink cdl = new ContentDocumentLink();
    cdl.ContentDocumentId = [
      SELECT ContentDocumentId
      FROM ContentVersion
      WHERE Id = :contentVersionId
    ]
    .ContentDocumentId;
    cdl.LinkedEntityId = recordId;
    cdl.ShareType = 'V';
    insert cdl;
    return cdl;
  }
}
