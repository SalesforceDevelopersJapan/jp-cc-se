Savepoint sp = Database.setSavepoint();
try {
  /**
   * Insert Location Group
   */
  Schema.LocationGroup locationGroup = new Schema.LocationGroup(
    LocationGroupName = 'サンプルロケーショングループ',
    ExternalReference = 'inventory_m',
    IsEnabled = true,
    ShouldSyncWithOci = true,
    Description = 'サンプルロケーショングループの説明文'
  );
  insert locationGroup;

  /**
   * Insert Locations for Osaka and Tokyo
   */
  Schema.Location locationOsaka = new Schema.Location(
    Name = '大阪倉庫',
    ExternalReference = 'inventory_m_osaka',
    LocationType = 'Warehouse',
    ShouldSyncWithOci = true,
    IsInventoryLocation = true,
    Description = '大阪倉庫ロケーションの説明文'
  );
  Schema.Location locationTokyo = new Schema.Location(
    Name = '東京倉庫',
    ExternalReference = 'inventory_m_tokyo',
    LocationType = 'Warehouse',
    ShouldSyncWithOci = true,
    IsInventoryLocation = true,
    Description = '東京倉庫ロケーションの説明文'
  );
  insert new List<Schema.Location>{ locationOsaka, locationTokyo };

  /**
   * Insert Assignment Table for Locations and Location Group
   */
  insert new List<Schema.LocationGroupAssignment>{
    new Schema.LocationGroupAssignment(
      LocationId = locationOsaka.Id,
      LocationGroupId = locationGroup.Id
    ),
    new Schema.LocationGroupAssignment(
      LocationId = locationTokyo.Id,
      LocationGroupId = locationGroup.Id
    )
  };

  /**
   * Insert Products
   */
  Schema.Product2 product1 = new Schema.Product2(
    StockKeepingUnit = 'TestProduct01',
    Description = 'description form Test Product 01',
    Name = 'Test Product 01',
    IsActive = true
  );
  Schema.Product2 product2 = new Schema.Product2(
    StockKeepingUnit = 'TestProduct02',
    Description = 'description form Test Product 02',
    Name = 'Test Product 02',
    IsActive = true
  );
  insert new List<Schema.Product2>{ product1, product2 };

  /**
   * Insert Product Items for locations
   */
  Schema.ProductItem productItem1 = new Schema.ProductItem(
    Product2Id = product1.Id,
    LocationId = locationOsaka.Id,
    QuantityOnHand = 30
  );
  Schema.ProductItem productItem2 = new Schema.ProductItem(
    Product2Id = product1.Id,
    LocationId = locationTokyo.Id,
    QuantityOnHand = 20
  );
  Schema.ProductItem productItem3 = new Schema.ProductItem(
    Product2Id = product2.Id,
    LocationId = locationTokyo.Id,
    QuantityOnHand = 10
  );
  insert new List<Schema.ProductItem>{
    productItem1,
    productItem2,
    productItem3
  };
} catch (Exception e) {
  Database.rollback(sp);
  System.debug('An unexpected error has occurred: ' + e.getMessage());
}
