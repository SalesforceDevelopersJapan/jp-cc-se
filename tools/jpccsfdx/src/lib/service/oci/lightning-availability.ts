import { Readable } from 'stream';
import LightningRESTService from '../lightning-rest-service';
import {
    LightningGetAvailabilityRequest,
    LightningGetAvailabilityResponse,
    LightningUpdateAvailabilityResponse,
    LightningUpdateAvailabilityStatusResponse,
    UpdateAvailabilityRequest
} from './availability';
import FormData = require('form-data');

export default class LightningAvailabilityService extends LightningRESTService {
    constructor(aliasOrUsename: string) {
        super(aliasOrUsename);
    }

    public async get(request: LightningGetAvailabilityRequest): Promise<LightningGetAvailabilityResponse> {
        // https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_oci_availability_records_get_availability.htm
        return await this.client.post(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/oci/availability/availability-records/actions/get-availability`
            ),
            request
        );
    }

    public async upload(jsonList: UpdateAvailabilityRequest): Promise<LightningUpdateAvailabilityResponse> {
        // https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_oci_availability_records_upload.htm#UploadResource
        let jsonListString = '';
        for (let o of jsonList) {
            jsonListString += JSON.stringify(o).replace(/(\s+|\n)/g, '') + '\n';
        }
        return await this.uploadFile(Readable.from(jsonListString));
    }

    public async uploadFile(stream: Readable): Promise<LightningUpdateAvailabilityResponse> {
        // https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_oci_availability_records_upload.htm#UploadResource
        const form = new FormData();
        form.append('fileUpload', stream, 'data.json');
        return await this.client.postMultiForm(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/commerce/oci/availability-records/uploads`
            ),
            form
        );
    }

    public async getUpdateStatus(uploadId: string): Promise<LightningUpdateAvailabilityStatusResponse> {
        // https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_oci_availability_records_upload.htm#GetStatusResource
        return await this.client.get(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/oci/availability-records/uploads/${uploadId}`
            )
        );
    }

    public async checkUpdate(uploadId: string) {
        const sleep = (n: number) => new Promise((resolve) => setTimeout(resolve, n));
        let status = 'SUBMITTED';
        let result;
        while (status === 'RUNNING' || status === 'SUBMITTED' || status === 'STAGING' || status === 'PENDING') {
            await sleep(10000);
            console.log('Checking update status.....');
            result = await this.getUpdateStatus(uploadId);
            status = result.status;
            console.log(`Update status is ${status}`);
        }
        switch (status) {
            case 'FAILED':
                console.log(result);
                break;
            case 'COMPLETED':
                console.log(result);
                break;
            default:
                console.log(result);
        }
    }
}
