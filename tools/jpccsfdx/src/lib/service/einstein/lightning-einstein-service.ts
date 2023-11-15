import { PathLike } from 'node:fs';
import LightningRESTService from '../lightning-rest-service';

export default class LightningEinsteinService extends LightningRESTService {
    constructor(aliasOrUsename: string) {
        super(aliasOrUsename);
    }

    public async downloadActivity(webstoreId: string, jobId: string, path: PathLike): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.chatterapi.meta/chatterapi/connect_resources_commerce_webstore_ai_activities_export_file.htm
        return await this.client.download(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/webstores/${webstoreId}/ai/activities/export-jobs/${jobId}/file-content`
            ),
            path
        );
    }

    public async requestExportActivity(webstoreId: string, userId: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.chatterapi.meta/chatterapi/connect_resources_commerce_webstore_ai_activities_export.htm
        return await this.client.post(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/webstores/${webstoreId}/ai/activities/export-jobs`
            ),
            {
                userId,
            }
        );
    }

    public async getExportActivityStatus(webstoreId: string, jobId: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.chatterapi.meta/chatterapi/connect_resources_commerce_webstore_ai_activities_export_status.htm
        return await this.client.get(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/webstores/${webstoreId}/ai/activities/export-jobs/${jobId}`
            )
        );
    }

    public async getDeployStatus(webstoreId: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.chatterapi.meta/chatterapi/connect_resources_commerce_webstore_ai_status.htm
        return await this.client.get(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/commerce/webstores/${webstoreId}/ai/status`
            )
        );
    }

    public async getConfiguration(webstoreId: string): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.ja-jp.chatterapi.meta/chatterapi/connect_resources_commerce_webstore_ai_config.htm
        return await this.client.get(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${
                        this.context.sfUser!.apiVersion
                    }/commerce/webstores/${webstoreId}/ai/configuration`
            )
        );
    }

    public async checkExportStatus(
        webstoreId: string,
        jobId: string
    ): Promise<void> {
        const sleep = (n: number) => new Promise((resolve) => setTimeout(resolve, n));
        let status = 'Pending';
        let result;
        while (status === 'Pending') {
            await sleep(10000);
            console.log('Checking export status.....');
            result = await this.getExportActivityStatus(webstoreId, jobId);
            console.log(result);
            status = result.statusCode;
            console.log(`Export status is ${status}`);
        }
        switch (status) {
            case 'Completed':
                console.log(result);
                break;
            case 'NoData':
                console.log(result);
                break;
            default:
                console.log(result);
        }
        return result;
    }
}
