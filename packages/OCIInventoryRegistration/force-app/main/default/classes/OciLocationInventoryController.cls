public with sharing class OciLocationInventoryController {
    public class InventoryLocation {
        @AuraEnabled public String locationId;
        @AuraEnabled public String locationName;
        @AuraEnabled public Decimal quantity;
    }

    public class InventoryViewModel {
        @AuraEnabled public String sourceType;
        @AuraEnabled public String sourceId;
        @AuraEnabled public Decimal groupTotal;
        @AuraEnabled public Decimal reservedTotal;
        @AuraEnabled public List<InventoryLocation> locations;
        @AuraEnabled public String message;
    }

    private class LocationDetail {
        public String id;
        public String name;
        public String externalReference;
    }

    private class InventorySourceConfig {
        public String sourceType;
        public String sourceId;
        public String sourceExternalReference;
        public List<String> locationIds = new List<String>();
        public Map<String, LocationDetail> locationById = new Map<String, LocationDetail>();
    }

    // PDP context for external users can lack direct Product2 record access.
    // Resolve SKU via a narrow without-sharing reader to avoid false "SKU not found" errors.
    private without sharing class Product2Reader {
        SObject queryById(Id productId, String fields) {
            List<SObject> rows = Database.query(
                'SELECT ' + fields + ' FROM Product2 WHERE Id = :productId LIMIT 1'
            );
            return rows.isEmpty() ? null : rows[0];
        }
    }

    @AuraEnabled(cacheable=true)
    public static InventoryViewModel getInventory(
        Id productId,
        Boolean groupTotalOnly
    ) {
        if (productId == null) {
            throw new AuraHandledException('productId is required.');
        }

        InventorySourceConfig sourceConfig = resolveSourceConfig();
        String sku = resolveSkuForProduct(productId);
        if (String.isBlank(sku)) {
            throw new AuraHandledException(
                'SKU was not found on the product. Set Product2.StockKeepingUnit (or ProductCode) and retry.'
            );
        }

        InventoryViewModel vm = new InventoryViewModel();
        vm.sourceType = sourceConfig.sourceType;
        vm.sourceId = sourceConfig.sourceId;
        vm.locations = buildConfiguredLocations(sourceConfig.locationIds, sourceConfig.locationById);
        vm.groupTotal = 0;
        vm.reservedTotal = 0;

        if ('LOCATION_GROUP'.equalsIgnoreCase(sourceConfig.sourceType)) {
            Map<String, Object> groupRoot = callInventoryAvailability(
                sku,
                sourceConfig.sourceExternalReference
            );

            Map<String, Decimal> qtyByLocationRef = extractLocationQuantities(groupRoot, sku);
            Integer updatedCount = applyLocationQuantities(vm.locations, sourceConfig.locationById, qtyByLocationRef);
            if (updatedCount == 0 && !qtyByLocationRef.isEmpty()) {
                // External users can miss Location record access, so build rows directly from OCI location identifiers.
                vm.locations = buildLocationsFromQuantities(qtyByLocationRef, sourceConfig.locationById);
            }

            vm.groupTotal = extractGroupTotal(groupRoot, sku);
            if (vm.groupTotal == null) {
                vm.groupTotal = sumLocationQuantities(vm.locations);
            }
            vm.reservedTotal = extractReservedTotal(groupRoot, sku);
            if (vm.reservedTotal == null) {
                vm.reservedTotal = 0;
            }

            // Some orgs return only group summary rows. In that case, location rows stay 0.
        } else {
            Map<String, Object> locationRoot = callInventoryAvailability(sku, null);
            Decimal qty = extractSingleQuantity(locationRoot, sku);
            if (!vm.locations.isEmpty()) {
                vm.locations[0].quantity = qty == null ? 0 : qty;
            }
            vm.groupTotal = qty == null ? 0 : qty;
            vm.reservedTotal = extractReservedTotal(locationRoot, sku);
            if (vm.reservedTotal == null) {
                vm.reservedTotal = 0;
            }
        }

        if (groupTotalOnly == true) {
            vm.locations = new List<InventoryLocation>();
        }

        return vm;
    }

    @AuraEnabled(cacheable=true)
    public static InventoryViewModel getInventoryContext() {
        InventorySourceConfig sourceConfig = resolveSourceConfig();
        InventoryViewModel vm = new InventoryViewModel();
        vm.sourceType = sourceConfig.sourceType;
        vm.sourceId = sourceConfig.sourceId;
        vm.groupTotal = 0;
        vm.reservedTotal = 0;
        vm.locations = buildConfiguredLocations(sourceConfig.locationIds, sourceConfig.locationById);
        return vm;
    }

    private static InventorySourceConfig resolveSourceConfig() {
        Id webStoreId = resolveCurrentWebStoreId();
        if (webStoreId == null) {
            throw new AuraHandledException('Could not resolve WebStore from current site/network context.');
        }

        InventorySourceConfig cfg = new InventorySourceConfig();

        List<String> objectCandidates = new List<String>{
            'WebStoreInventorySource',
            'WebStoreInventorySetting'
        };

        for (String objName : objectCandidates) {
            if (!Schema.getGlobalDescribe().containsKey(objName)) {
                continue;
            }

            Schema.DescribeSObjectResult dsr = Schema.getGlobalDescribe().get(objName).getDescribe();
            Map<String, Schema.SObjectField> fieldMap = dsr.fields.getMap();

            String webStoreField = firstExistingField(fieldMap, new List<String>{'WebStoreId', 'StoreId'});
            String sourceTypeField = firstExistingField(fieldMap, new List<String>{'LocationSourceType', 'SourceType'});
            String sourceIdField = firstExistingField(fieldMap, new List<String>{'LocationSourceId', 'SourceId'});

            if (webStoreField == null || sourceIdField == null) {
                continue;
            }

            String soqlFields = sourceIdField;
            if (sourceTypeField != null) {
                soqlFields += ', ' + sourceTypeField;
            }

            List<SObject> rows = Database.query(
                'SELECT ' + soqlFields +
                ' FROM ' + objName +
                ' WHERE ' + webStoreField + ' = :webStoreId LIMIT 1'
            );
            if (rows.isEmpty()) {
                continue;
            }

            SObject row = rows[0];
            String resolvedSourceId = (String) row.get(sourceIdField);
            String resolvedType = null;
            if (sourceTypeField != null) {
                resolvedType = normalizeSourceType((String) row.get(sourceTypeField));
            }
            if (String.isBlank(resolvedType)) {
                resolvedType = inferSourceTypeFromId(resolvedSourceId);
            }

            if (String.isBlank(resolvedType) || String.isBlank(resolvedSourceId)) {
                continue;
            }

            cfg.sourceType = resolvedType;
            cfg.sourceId = resolvedSourceId;

            if ('LOCATION_GROUP'.equalsIgnoreCase(cfg.sourceType)) {
                cfg.sourceExternalReference = resolveLocationGroupExternalReference(cfg.sourceId);
                cfg.locationIds = resolveLocationIdsFromGroup(cfg.sourceId);
            } else {
                cfg.locationIds.add(cfg.sourceId);
            }

            cfg.locationById = resolveLocationDetails(cfg.locationIds);
            if ('LOCATION'.equalsIgnoreCase(cfg.sourceType)) {
                LocationDetail detail = cfg.locationById.get(cfg.sourceId);
                cfg.sourceExternalReference = detail == null ? null : detail.externalReference;
            }

            if (String.isBlank(cfg.sourceExternalReference)) {
                throw new AuraHandledException(
                    'Inventory source external reference was not found. Set ExternalReference on source records.'
                );
            }

            return cfg;
        }

        throw new AuraHandledException(
            'Inventory source configuration was not found. Check Commerce settings > Store > Inventory.'
        );
    }

    private static Map<String, Object> callInventoryAvailability(
        String sku,
        String locationGroupExternalReference
    ) {
        ConnectApi.OCIGetInventoryAvailabilityInputRepresentation request =
            new ConnectApi.OCIGetInventoryAvailabilityInputRepresentation();
        request.useCache = false;
        request.stockKeepingUnit = sku;
        if (!String.isBlank(locationGroupExternalReference)) {
            request.locationGroupIdentifier = locationGroupExternalReference;
        }

        ConnectApi.OCIGetInventoryAvailabilityOutputRepresentation response;
        try {
            response = ConnectApi.OmnichannelInventoryService.getInventoryAvailability(request);
        } catch (Exception ex) {
            throw new AuraHandledException('OCI inventory retrieval failed: ' + ex.getMessage());
        }

        Object raw = JSON.deserializeUntyped(JSON.serialize(response));
        if (!(raw instanceof Map<String, Object>)) {
            return new Map<String, Object>();
        }
        return (Map<String, Object>) raw;
    }

    private static Decimal extractSingleQuantity(Map<String, Object> root, String sku) {
        Map<String, Decimal> qtyByLocation = extractLocationQuantities(root, sku);
        if (!qtyByLocation.isEmpty()) {
            for (Decimal qty : qtyByLocation.values()) {
                return qty == null ? 0 : qty;
            }
        }

        List<Object> groupRows = listFromRoot(root, 'locationGroups');
        for (Object groupObj : groupRows) {
            Map<String, Object> groupRow = asMap(groupObj);
            Decimal qty = extractFromInventoryRecords(listFromMap(groupRow, 'inventoryRecords'), sku);
            if (qty != null) {
                return qty;
            }
        }

        return null;
    }

    private static Decimal extractGroupTotal(Map<String, Object> root, String sku) {
        for (String key : new List<String>{'groupTotal', 'totalAvailableToSell', 'availableToSell', 'quantity'}) {
            Decimal direct = decimalFrom(root.get(key));
            if (direct != null) {
                return direct;
            }
        }

        List<Object> groupRows = listFromRoot(root, 'locationGroups');
        for (Object groupObj : groupRows) {
            Map<String, Object> groupRow = asMap(groupObj);
            Decimal qty = extractFromInventoryRecords(listFromMap(groupRow, 'inventoryRecords'), sku);
            if (qty != null) {
                return qty;
            }
            Decimal fallback = decimalFrom(groupRow.get('availableToOrder'));
            if (fallback != null) {
                return fallback;
            }
        }

        return null;
    }

    private static Decimal extractReservedTotal(Map<String, Object> root, String sku) {
        for (String key : new List<String>{'reserved', 'reservedTotal', 'reservedQuantity', 'reservedQty'}) {
            Decimal direct = decimalFrom(root.get(key));
            if (direct != null) {
                return direct;
            }
        }

        List<Object> groupRows = listFromRoot(root, 'locationGroups');
        for (Object groupObj : groupRows) {
            Map<String, Object> groupRow = asMap(groupObj);
            Decimal direct = decimalFrom(
                groupRow.get('reserved'),
                groupRow.get('reservedTotal'),
                groupRow.get('reservedQuantity'),
                groupRow.get('reservedQty')
            );
            if (direct != null) {
                return direct;
            }
            Decimal byRecord = extractReservedFromInventoryRecords(listFromMap(groupRow, 'inventoryRecords'), sku);
            if (byRecord != null) {
                return byRecord;
            }
        }

        List<Object> locationRows = listFromRoot(root, 'locations');
        Decimal sum = 0;
        Boolean found = false;
        for (Object locationObj : locationRows) {
            Map<String, Object> locationRow = asMap(locationObj);
            Decimal direct = decimalFrom(
                locationRow.get('reserved'),
                locationRow.get('reservedTotal'),
                locationRow.get('reservedQuantity'),
                locationRow.get('reservedQty')
            );
            if (direct == null) {
                direct = extractReservedFromInventoryRecords(listFromMap(locationRow, 'inventoryRecords'), sku);
            }
            if (direct != null) {
                sum += direct;
                found = true;
            }
        }

        return found ? sum : null;
    }

    private static Map<String, Decimal> extractLocationQuantities(Map<String, Object> root, String sku) {
        Map<String, Decimal> qtyByLocationRef = new Map<String, Decimal>();
        List<Object> locations = listFromRoot(root, 'locations');

        for (Object locationObj : locations) {
            Map<String, Object> location = asMap(locationObj);
            String locationRef = stringFrom(
                location.get('locationIdentifier'),
                location.get('externalReference'),
                location.get('locationId'),
                location.get('id')
            );
            if (String.isBlank(locationRef)) {
                continue;
            }

            Decimal qty = extractFromInventoryRecords(listFromMap(location, 'inventoryRecords'), sku);
            if (qty == null) {
                qty = decimalFrom(location.get('availableToOrder'));
            }
            if (qty == null) {
                qty = 0;
            }
            qtyByLocationRef.put(locationRef, qty);
        }

        return qtyByLocationRef;
    }

    private static Decimal extractFromInventoryRecords(List<Object> rows, String sku) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }

        for (Object rowObj : rows) {
            Map<String, Object> row = asMap(rowObj);
            String rowSku = stringFrom(
                row.get('stockKeepingUnit'),
                row.get('sku'),
                row.get('productCode')
            );
            if (!String.isBlank(sku) && !String.isBlank(rowSku) && rowSku != sku) {
                continue;
            }

            Decimal qty = decimalFrom(
                row.get('availableToOrder')
            );
            if (qty == null) {
                qty = decimalFrom(row.get('availableToFulfill'));
            }
            if (qty == null) {
                qty = decimalFrom(row.get('quantity'));
            }
            if (qty != null) {
                return qty;
            }
        }

        if (rows.size() == 1) {
            Map<String, Object> only = asMap(rows[0]);
            Decimal qty = decimalFrom(only.get('availableToOrder'));
            if (qty == null) {
                qty = decimalFrom(only.get('quantity'));
            }
            return qty;
        }

        return null;
    }

    private static Decimal extractReservedFromInventoryRecords(List<Object> rows, String sku) {
        if (rows == null || rows.isEmpty()) {
            return null;
        }

        for (Object rowObj : rows) {
            Map<String, Object> row = asMap(rowObj);
            String rowSku = stringFrom(
                row.get('stockKeepingUnit'),
                row.get('sku'),
                row.get('productCode')
            );
            if (!String.isBlank(sku) && !String.isBlank(rowSku) && rowSku != sku) {
                continue;
            }

            Decimal reserved = decimalFrom(
                row.get('reserved'),
                row.get('reservedTotal'),
                row.get('reservedQuantity'),
                row.get('reservedQty')
            );
            if (reserved != null) {
                return reserved;
            }
        }
        return null;
    }

    private static Integer applyLocationQuantities(
        List<InventoryLocation> rows,
        Map<String, LocationDetail> locationById,
        Map<String, Decimal> qtyByLocationRef
    ) {
        Integer updated = 0;
        for (InventoryLocation row : rows) {
            LocationDetail detail = locationById.get(row.locationId);
            String locationRef = detail == null ? null : detail.externalReference;
            if (String.isBlank(locationRef) || !qtyByLocationRef.containsKey(locationRef)) {
                continue;
            }
            row.quantity = qtyByLocationRef.get(locationRef);
            if (row.quantity == null) {
                row.quantity = 0;
            }
            updated += 1;
        }
        return updated;
    }

    private static List<InventoryLocation> buildLocationsFromQuantities(
        Map<String, Decimal> qtyByLocationRef,
        Map<String, LocationDetail> locationById
    ) {
        Map<String, LocationDetail> detailByExternalRef = new Map<String, LocationDetail>();
        for (LocationDetail detail : locationById.values()) {
            if (detail != null && !String.isBlank(detail.externalReference)) {
                detailByExternalRef.put(detail.externalReference, detail);
            }
        }

        List<String> refs = new List<String>(qtyByLocationRef.keySet());
        refs.sort();

        List<InventoryLocation> rows = new List<InventoryLocation>();
        for (String ref : refs) {
            InventoryLocation row = new InventoryLocation();
            LocationDetail detail = detailByExternalRef.get(ref);
            row.locationId = detail == null ? ref : detail.id;
            row.locationName = detail == null ? ref : detail.name;
            row.quantity = qtyByLocationRef.get(ref);
            if (row.quantity == null) {
                row.quantity = 0;
            }
            rows.add(row);
        }
        return rows;
    }

    private static Decimal sumLocationQuantities(List<InventoryLocation> rows) {
        Decimal total = 0;
        for (InventoryLocation row : rows) {
            total += (row == null || row.quantity == null) ? 0 : row.quantity;
        }
        return total;
    }

    private static String resolveLocationGroupExternalReference(String locationGroupId) {
        Set<Id> ids = toValidIdSet(new List<String>{locationGroupId});
        if (ids.isEmpty() || !Schema.getGlobalDescribe().containsKey('LocationGroup')) {
            return null;
        }

        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get('LocationGroup').getDescribe().fields.getMap();
        String extField = firstExistingField(fieldMap, new List<String>{'ExternalReference', 'DeveloperName', 'LocationGroupName'});
        if (extField == null) {
            return null;
        }

        List<SObject> rows = Database.query(
            'SELECT ' + extField + ' FROM LocationGroup WHERE Id IN :ids LIMIT 1'
        );
        if (rows.isEmpty()) {
            return null;
        }

        String value = (String) rows[0].get(extField);
        return String.isBlank(value) ? null : value.trim();
    }

    private static Map<String, LocationDetail> resolveLocationDetails(List<String> locationIds) {
        Map<String, LocationDetail> detailById = new Map<String, LocationDetail>();
        Set<Id> idSet = toValidIdSet(locationIds);
        if (idSet.isEmpty()) {
            return detailById;
        }

        collectLocationDetails('Location', idSet, detailById);
        Set<Id> missing = new Set<Id>();
        for (Id idVal : idSet) {
            if (!detailById.containsKey((String) idVal)) {
                missing.add(idVal);
            }
        }
        if (!missing.isEmpty()) {
            collectLocationDetails('InventoryLocation', missing, detailById);
        }

        for (String locationId : locationIds) {
            if (String.isBlank(locationId)) {
                continue;
            }
            if (!detailById.containsKey(locationId)) {
                LocationDetail fallback = new LocationDetail();
                fallback.id = locationId;
                fallback.name = locationId;
                fallback.externalReference = null;
                detailById.put(locationId, fallback);
            }
        }

        return detailById;
    }

    private static void collectLocationDetails(
        String objectName,
        Set<Id> ids,
        Map<String, LocationDetail> detailById
    ) {
        if (!Schema.getGlobalDescribe().containsKey(objectName) || ids.isEmpty()) {
            return;
        }

        Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();
        if (!fieldMap.containsKey('Id')) {
            return;
        }

        String nameField = firstExistingField(fieldMap, new List<String>{'Name', 'LocationName'});
        String extField = firstExistingField(fieldMap, new List<String>{'ExternalReference', 'LocationIdentifier', 'DeveloperName'});

        String queryFields = 'Id';
        if (nameField != null) {
            queryFields += ', ' + nameField;
        }
        if (extField != null) {
            queryFields += ', ' + extField;
        }

        List<SObject> rows = Database.query(
            'SELECT ' + queryFields + ' FROM ' + objectName + ' WHERE Id IN :ids'
        );

        for (SObject row : rows) {
            LocationDetail detail = new LocationDetail();
            detail.id = (String) row.get('Id');
            detail.name = nameField == null ? detail.id : (String) row.get(nameField);
            detail.externalReference = extField == null ? null : (String) row.get(extField);

            if (String.isBlank(detail.name)) {
                detail.name = detail.id;
            }
            if (!String.isBlank(detail.externalReference)) {
                detail.externalReference = detail.externalReference.trim();
            }

            detailById.put(detail.id, detail);
        }
    }

    private static List<InventoryLocation> buildConfiguredLocations(
        List<String> locationIds,
        Map<String, LocationDetail> locationById
    ) {
        List<InventoryLocation> rows = new List<InventoryLocation>();
        if (locationIds == null || locationIds.isEmpty()) {
            return rows;
        }

        for (String locationId : locationIds) {
            if (String.isBlank(locationId)) {
                continue;
            }
            LocationDetail detail = locationById.get(locationId);
            InventoryLocation row = new InventoryLocation();
            row.locationId = locationId;
            row.locationName = detail == null ? locationId : detail.name;
            row.quantity = 0;
            rows.add(row);
        }
        return rows;
    }

    private static Id resolveCurrentWebStoreId() {
        Id networkId = Network.getNetworkId();
        if (networkId == null || !Schema.getGlobalDescribe().containsKey('WebStoreNetwork')) {
            return null;
        }

        Schema.DescribeSObjectResult dsr = Schema.getGlobalDescribe().get('WebStoreNetwork').getDescribe();
        Map<String, Schema.SObjectField> fieldMap = dsr.fields.getMap();
        if (!fieldMap.containsKey('WebStoreId') || !fieldMap.containsKey('NetworkId')) {
            return null;
        }

        List<SObject> rows = Database.query(
            'SELECT WebStoreId FROM WebStoreNetwork WHERE NetworkId = :networkId LIMIT 1'
        );
        if (rows.isEmpty()) {
            return null;
        }

        return (Id) rows[0].get('WebStoreId');
    }

    private static List<String> resolveLocationIdsFromGroup(String locationGroupId) {
        List<String> locationIds = new List<String>();

        List<String> relationObjects = new List<String>{
            'LocationGroupAssignment',
            'LocationGroupLocation',
            'InventoryLocationGroupMember'
        };

        for (String objName : relationObjects) {
            if (!Schema.getGlobalDescribe().containsKey(objName)) {
                continue;
            }

            Schema.DescribeSObjectResult dsr = Schema.getGlobalDescribe().get(objName).getDescribe();
            Map<String, Schema.SObjectField> fieldMap = dsr.fields.getMap();
            String groupField = firstExistingField(fieldMap, new List<String>{'LocationGroupId', 'GroupId'});
            String locationField = firstExistingField(fieldMap, new List<String>{'LocationId', 'InventoryLocationId'});

            if (groupField == null || locationField == null) {
                continue;
            }

            for (SObject row : Database.query(
                'SELECT ' + locationField + ' FROM ' + objName + ' WHERE ' + groupField + ' = :locationGroupId'
            )) {
                String lid = (String) row.get(locationField);
                if (!String.isBlank(lid)) {
                    locationIds.add(lid);
                }
            }

            if (!locationIds.isEmpty()) {
                break;
            }
        }

        return locationIds;
    }

    private static String resolveSkuForProduct(Id productId) {
        Map<String, Schema.SObjectField> fieldMap = Product2.SObjectType.getDescribe().fields.getMap();
        Boolean hasStockKeepingUnit = fieldMap.containsKey('StockKeepingUnit');
        Boolean hasProductCode = fieldMap.containsKey('ProductCode');
        if (!hasStockKeepingUnit && !hasProductCode) {
            return null;
        }

        String soqlFields = '';
        if (hasStockKeepingUnit) {
            soqlFields += 'StockKeepingUnit';
        }
        if (hasProductCode) {
            soqlFields += (String.isBlank(soqlFields) ? '' : ', ') + 'ProductCode';
        }

        SObject row = new Product2Reader().queryById(productId, soqlFields);
        if (row == null) {
            return null;
        }

        String sku = null;
        if (hasStockKeepingUnit) {
            sku = (String) row.get('StockKeepingUnit');
        }
        if (String.isBlank(sku) && hasProductCode) {
            sku = (String) row.get('ProductCode');
        }
        return String.isBlank(sku) ? null : sku.trim();
    }

    private static List<Object> listFromRoot(Map<String, Object> root, String key) {
        if (root != null && root.containsKey(key) && root.get(key) instanceof List<Object>) {
            return (List<Object>) root.get(key);
        }
        return new List<Object>();
    }

    private static List<Object> listFromMap(Map<String, Object> source, String key) {
        if (source != null && source.containsKey(key) && source.get(key) instanceof List<Object>) {
            return (List<Object>) source.get(key);
        }
        return new List<Object>();
    }

    private static Map<String, Object> asMap(Object obj) {
        return obj instanceof Map<String, Object>
            ? (Map<String, Object>) obj
            : new Map<String, Object>();
    }

    private static String stringFrom(Object first, Object second, Object third, Object fourth) {
        for (Object value : new List<Object>{first, second, third, fourth}) {
            if (value != null) {
                String str = String.valueOf(value).trim();
                if (!String.isBlank(str)) {
                    return str;
                }
            }
        }
        return null;
    }

    private static String stringFrom(Object first, Object second, Object third) {
        return stringFrom(first, second, third, null);
    }

    private static Decimal decimalFrom(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Decimal) {
            return (Decimal) value;
        }
        try {
            return Decimal.valueOf(String.valueOf(value));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static Decimal decimalFrom(Object first, Object second, Object third, Object fourth) {
        for (Object value : new List<Object>{first, second, third, fourth}) {
            Decimal parsed = decimalFrom(value);
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private static Set<Id> toValidIdSet(List<String> values) {
        Set<Id> ids = new Set<Id>();
        for (String value : values) {
            if (isSalesforceId(value)) {
                ids.add((Id) value.trim());
            }
        }
        return ids;
    }

    private static String normalizeSourceType(String rawType) {
        if (String.isBlank(rawType)) {
            return null;
        }

        String value = rawType.trim().toUpperCase();
        if (value.contains('GROUP')) {
            return 'LOCATION_GROUP';
        }
        if (value.contains('LOCATION')) {
            return 'LOCATION';
        }
        return null;
    }

    private static String inferSourceTypeFromId(String sourceId) {
        if (String.isBlank(sourceId)) {
            return null;
        }
        String normalized = sourceId.trim();

        String locationGroupPrefix = getKeyPrefix('LocationGroup');
        if (!String.isBlank(locationGroupPrefix) && normalized.startsWith(locationGroupPrefix)) {
            return 'LOCATION_GROUP';
        }

        String locationPrefix = getKeyPrefix('Location');
        if (!String.isBlank(locationPrefix) && normalized.startsWith(locationPrefix)) {
            return 'LOCATION';
        }

        return null;
    }

    private static String getKeyPrefix(String objectApiName) {
        if (!Schema.getGlobalDescribe().containsKey(objectApiName)) {
            return null;
        }
        return Schema.getGlobalDescribe().get(objectApiName).getDescribe().getKeyPrefix();
    }

    private static String firstExistingField(
        Map<String, Schema.SObjectField> fieldMap,
        List<String> candidates
    ) {
        for (String fieldName : candidates) {
            if (fieldMap.containsKey(fieldName)) {
                return fieldName;
            }
        }
        return null;
    }

    private static Boolean isSalesforceId(String value) {
        if (String.isBlank(value)) {
            return false;
        }
        String normalized = value.trim();
        return Pattern.matches('^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$', normalized);
    }
}
