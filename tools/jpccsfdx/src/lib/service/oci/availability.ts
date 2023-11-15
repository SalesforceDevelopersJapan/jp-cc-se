/**
 * BASE
 */
export type UpdateAvailabilityRequestOperation = {
    location: string;
    mode: 'UPDATE';
};

export type AvailabilityBase = {
    onHand?: number;
    sku: string;
    effectiveDate?: string;
    futures?: FutureQuantity[];
    safetyStockCount?: number;
};

export type UpdateAvailabilityRequestDetail = {
    recordId: string;
} & AvailabilityBase;

export type UpdateAvailabilityRequest = (UpdateAvailabilityRequestDetail | UpdateAvailabilityRequestOperation)[];

export type FutureQuantity = {
    expectedDate: string;
    quantity: number;
};

type BatchStatus =
    | 'RUNNING'
    | 'STAGING'
    | 'PENDING'
    | 'COMPLETED'
    | 'COMPLETED_WITHOUT_ERRORS'
    | 'COMPLETED_WITH_PARTIAL_FAILURES'
    | 'FAILED';

/**
 * LIGHTNING
 */
export type LightningInventoryRecord = {
    availableToFulfill: number;
    availableToOrder: number;
    effectiveDate: string;
    onHand: number;
    reserved: number;
    safetyStockCount: number;
    stockKeepingUnit: string;
    futures: FutureQuantity[];
};

type LightningLocation = {
    inventoryRecords: LightningInventoryRecord[];
    locationIdentifier: string;
  };

type LightningLocationGroup = {
    inventoryRecords: LightningInventoryRecord[];
    locationGroupIdentifier: string;
};

type LightningResponseBase = {
    success: boolean;
    errors: object[];
    locationGroups: LightningLocationGroup[];
    locations: LightningLocation[];
};

export type LightningGetAvailabilityResponse = LightningResponseBase & {
    locationGroups: LightningLocationGroup[];
    locations: LightningLocation[];
};

export type LightningGetAvailabilityRequest = {
    locationGroupIdentifier: string;
    useCache: boolean;
    stockKeepingUnit: string;
};

export type LightningUpdateAvailabilityResponse = LightningResponseBase & {
    uploadId: string;
};

export type LightningUpdateAvailabilityStatusResponse = LightningResponseBase & {
    endTimeUTC: string;
    recordsProcessedCount: number;
    recordsReadCount: number;
    recordsSkippedCount: number;
    startTimeUTC: string;
    status: BatchStatus;
    validationErrors: any[];
    validationStatus: string;
};

/**
 * COMMERCE
 */
export type CommerceGetAvailabilityRequest = {
    sku?: string;
    group?: string;
    skus?: string[];
    locations?: string[];
    groups?: string[];
};

export type CommerceAvailabilityRecord = {
    atf: number;
    ato: number;
    reserved: number;
} & AvailabilityBase;

export type CommerceAvailabilityRecords = {
    id: string;
    records: CommerceAvailabilityRecord[];
};

export type CommerceGetAvailabilityResponse = {
    groups: CommerceAvailabilityRecords[];
    locations: CommerceAvailabilityRecords[];
};

export type CommerceInventoryImportRequest = {
    fileName: string;
    linkDuration: number;
    fileFormat: 'JSON';
    fileHashType?: 'SHA-256' | 'SHA-512';
    fileEncoding: 'GZIP';
    fileHash?: string;
};

export type CommerceInventoryImportResponse = {
    importId: string;
    importStatusLink: string;
    uploadLink: string;
    uploadMethod: string;
    uploadLinkExpirationUTC: string;
};

export type CommerceAvailabilityImportStatusResponse = {
    importId: string;
    status: BatchStatus;
    validation: {
        status: string;
        errors: string[];
    };
    upload: {
        fileName: string;
    };
    import: {
        startTimeUTC: string;
        endTimeUTC: string;
        recordsProcessedCount: number;
        recordsReadCount: number;
        recordsSkippedCount: number;
        fullResults: {
            href: string;
            exportResultExpirationUTC: string;
        };
    };
};
