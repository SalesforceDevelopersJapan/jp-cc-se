import { Readable } from 'stream';
import { CommerceClient } from '../../interface/rest-context';
import CustomFetchWithAuth from '../../rest/fetch-with-auth';
import CommerceRESTService from '../commerce-rest-service';
import {
    CommerceAvailabilityImportStatusResponse,
    CommerceGetAvailabilityRequest,
    CommerceGetAvailabilityResponse,
    CommerceInventoryImportRequest,
    CommerceInventoryImportResponse
} from './availability';
import FormData = require('form-data');

export default class SCAPIAvailabilityService extends CommerceRESTService {
    constructor(commerceClient: CommerceClient) {
        super(commerceClient);
        this.client = new CustomFetchWithAuth(this.context);
    }

    public async get(request: CommerceGetAvailabilityRequest): Promise<CommerceGetAvailabilityResponse> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/inventory-availability?meta=skuAvailabilityByLocationAndOrGroup
        return await this.client.post(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/availability/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/actions/get-availability`
            ),
            request
        );
    }

    public async requestUpload(request: CommerceInventoryImportRequest): Promise<CommerceInventoryImportResponse> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/impex?meta=submitInventoryImport
        return await this.client.post(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/impex/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/imports`
            ),
            request
        );
    }

    public async uploadFile(fileName: string, importId: string, file: Readable): Promise<any> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/impex?meta=Summary
        const form = new FormData();
        form.append('fileUpload', file, fileName);
        return await this.client.postMultiForm(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/impex/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/imports/uploadlink/${importId}`
            ),
            form
        );
    }

    public async getUploadStatus(importId: string): Promise<CommerceAvailabilityImportStatusResponse> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/impex?meta=getAvailabilityImportStatus
        return await this.client.get(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/impex/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/imports/${importId}/status`
            )
        );
    }

    public async getImportIds(): Promise<{ imports: string[] }> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/impex?meta=getAvailabilityImportStatus
        return await this.client.get(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/impex/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/imports`
            )
        );
    }

    public async deleteImport(importId: string): Promise<void> {
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/impex?meta=deleteInventoryImport
        return await this.client.delete(
            new URL(
                this.context.commerceClient?.ociUrl +
                    `/inventory/impex/${this.context.commerceClient?.apiVersion}/organizations/${this.context.commerceClient?.omniTenantGroupId}/availability-records/imports/${importId}`
            )
        );
    }

    public async checkSCAPIImport(importId: string) {
        const sleep = (n: number) => new Promise((resolve) => setTimeout(resolve, n));
        let status = 'SUBMITTED';
        let result;
        while (status === 'RUNNING' || status === 'SUBMITTED' || status === 'STAGING' || status === 'PENDING') {
            await sleep(10000);
            console.log('Checking update status.....');
            result = await this.getUploadStatus(importId);
            status = result.status;
            console.log(`Update status is ${status}`);
        }
        switch (status) {
            case 'COMPLETED':
                console.log(result);
                break;
            case 'COMPLETED_WITHOUT_ERRORS':
                console.log(result);
                break;
            case 'COMPLETED_WITH_PARTIAL_FAILURES':
                console.log(result);
                break;
            case 'FAILED':
                console.log(result);
                break;
            default:
                console.log(result);
        }
    }

    public async displayImportStatus() {
        const ids = await this.getImportIds();
        const promises = [];
        for (const id of ids.imports) {
            promises.push(this.getUploadStatus(id));
        }
        const results = await Promise.all(promises);
        const display = [];
        for (const result of results) {
            display.push({
                importId: result.importId,
                status: result.status,
                startTimeUTC: result.import.startTimeUTC,
                endTimeUTC: result.import.endTimeUTC,
                recordsProcessedCount: result.import.recordsProcessedCount,
                recordsReadCount: result.import.recordsReadCount,
                recordsSkippedCount: result.import.recordsSkippedCount,
            });
        }
        console.table(display);
    }
}
