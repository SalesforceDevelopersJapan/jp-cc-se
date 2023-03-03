import { RestContext } from '../../interface/rest-context';
import CustomFetchWithAuth from '../../rest/fetch-with-auth';
import UserAuth from '../auth/user-auth';

export type FutureQuantity = {
    expectedDate: string;
    quantity: number;
};

export type InventoryRecord = {
    availableToFulfill: number;
    availableToOrder: number;
    effectiveDate: string;
    onHand: number;
    reserved: number;
    safetyStockCount: number;
    stockKeepingUnit: string;
    futures: FutureQuantity[];
};

type Location = {
    inventoryRecords: InventoryRecord[];
    locationIdentifier?: string;
};

type LocationGroup = {
    inventoryRecords: InventoryRecord[];
    locationGroupIdentifier?: string;
};

type ResponseBase = {
    success: boolean;
    errors: object[];
    locationGroups: LocationGroup[];
    locations: Location[];
};

export type GetAvailabilityResponse = ResponseBase & {
    locationGroups: LocationGroup[];
    locations: Location[];
};

export type GetAvailabilityRequest = {
    locationGroupIdentifier: string;
    useCache: boolean;
    stockKeepingUnit: string;
};

export type UpdateAvailabilityRequestOperation = {
    location: string;
    mode: 'UPDATE';
};

export type UpdateAvailabilityRequestDetail = {
    recordId: string;
    onHand: number;
    sku: string;
    effectiveDate: string;
    futures: FutureQuantity[];
    safetyStockCount: number;
};

export type UpdateAvailabilityRequest = (UpdateAvailabilityRequestDetail | UpdateAvailabilityRequestOperation)[];

export type UpdateAvailabilityResponse = ResponseBase & {
    uploadId: string;
};

export type UpdateAvailabilityStatusResponse = ResponseBase & {
    endTimeUTC: string;
    recordsProcessedCount: number;
    recordsReadCount: number;
    recordsSkippedCount: number;
    startTimeUTC: string;
    status: string;
    validationErrors: any[];
    validationStatus: string;
};

export default class OCIAvailabilityService {
    client: CustomFetchWithAuth;

    constructor(aliasOrUsename: string, apiVersion: string = 'v57.0') {
        const user = UserAuth.getUser(aliasOrUsename);
        const context: RestContext = {
            user,
            apiVersion,
        };
        this.client = new CustomFetchWithAuth(context);
    }

    public async get(request: GetAvailabilityRequest): Promise<GetAvailabilityResponse> {
        return await this.client.post(
            new URL(
                this.client.context.user.instanceUrl +
                    `/services/data/${this.client.context.apiVersion}/commerce/oci/availability/availability-records/actions/get-availability`
            ),
            request
        );
    }

    public async update(jsonList: UpdateAvailabilityRequest): Promise<UpdateAvailabilityResponse> {
        let jsonListString = '';
        for (let o of jsonList) {
            jsonListString += JSON.stringify(o).replace(/(\s+|\n)/g, '') + '\n';
        }
        const form = new FormData();
        form.append('fileUpload', new Blob([jsonListString], { type: 'application/json' }), 'data.json');
        return await this.client.postForm(
            new URL(
                this.client.context.user.instanceUrl +
                    `/services/data/${this.client.context.apiVersion}/commerce/oci/availability-records/uploads`
            ),
            form
        );
    }

    public async getUpdateStatus(uploadId: string): Promise<UpdateAvailabilityStatusResponse> {
        return await this.client.get(
            new URL(
                this.client.context.user.instanceUrl +
                    `/services/data/${this.client.context.apiVersion}/commerce/oci/availability-records/uploads/${uploadId}`
            )
        );
    }
}
