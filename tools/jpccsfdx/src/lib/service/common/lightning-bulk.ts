import { RequestInit } from 'node-fetch';
import { Readable } from 'stream';
import LightningRESTService from '../lightning-rest-service';

export default class LightningBulkService extends LightningRESTService {
    constructor(aliasOrUsename: string) {
        super(aliasOrUsename);
    }

    public async createJob(request: {
        operation: 'insert' | 'update' | 'upsert' | 'delete' | 'hardDelete';
        object: string;
        contentType: 'CSV';
        lineEnding: 'CRLF';
    }): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/create_job.htm
        return await this.client.post(
            new URL(this.context.sfUser!.instanceUrl + `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest`),
            request
        );
    }

    public async getJobs(): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/get_all_jobs.htm
        return await this.client.get(
            new URL(this.context.sfUser!.instanceUrl + `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest`)
        );
    }

    public async deleteJob(jobID: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/delete_job.htm
        return await this.client.delete(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest/${jobID}`
            )
        );
    }

    public async uploadFile(jobID: string, stream: Readable): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/upload_job_data.htm
        const options: RequestInit = {
            method: 'put',
            body: stream,
            headers: { 'Content-Type': 'text/csv', Accept: 'application/json' },
        };
        return await this.client.genericPlainCall(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest/${jobID}/batches`
            ),
            options
        );
    }

    public async updateJob(jobID: string, state: 'UploadComplete' | 'Aborted'): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/close_job.htm
        const options: RequestInit = {
            method: 'PATCH',
            body: JSON.stringify({ state }),
            headers: { 'Content-Type': 'application/json' },
        };
        return await this.client.genericPlainCall(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest/${jobID}/`
            ),
            options
        );
    }

    public async checkJobStatus(jobID: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.api_bulk_v2.meta/api_bulk_v2/get_job_info.htm
        return await this.client.get(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/jobs/ingest/${jobID}/`
            )
        );
    }

    public async doCSVInsertBulk(objectName: string, stream: Readable): Promise<any> {
        const jobs = await this.getJobs();
        console.log(jobs);
        const found = jobs.records.find((job: any) => job.object === objectName && job.state === 'Open');
        let jobId = '';
        if (found) {
            jobId = found.id;
        } else {
            const createRes = await this.createJob({
                operation: 'insert',
                object: objectName,
                contentType: 'CSV',
                lineEnding: 'CRLF',
            });
            console.log(createRes);
            jobId = createRes.id;
        }
        const uploadRes = await this.uploadFile(jobId, stream);
        console.log(uploadRes);
        const startRes = await this.updateJob(jobId, 'UploadComplete');
        console.log(startRes);
        return await this.checkUpdate(jobId);
    }

    public async checkUpdate(jobID: string) {
        const sleep = (n: number) => new Promise((resolve) => setTimeout(resolve, n));
        let status = 'InProgress';
        let result;
        while (status === 'InProgress') {
            await sleep(10000);
            console.log('Checking update status.....');
            result = await this.checkJobStatus(jobID);
            status = result.state;
            console.log(`Update status is ${status}`);
        }
        switch (status) {
            case 'Aborted':
                console.log(result);
                break;
            case 'JobComplete':
                console.log(result);
                break;
            case 'Failed':
                console.log(result);
                break;
            default:
                console.log(result);
        }
    }
}
