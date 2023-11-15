import { Readable } from 'stream';
import LightningRESTService from '../lightning-rest-service';
import FormData = require('form-data');

export class ImageUploadRequest {
    readonly contentSpaceOrFolderId: string;
    readonly title: string;
    readonly fileName: string;
    readonly urlName: string;
    readonly imageFile: Readable;

    constructor(imageFile: Readable, contentSpaceOrFolderId: string, title: string, fileName: string, urlName: string) {
        this.imageFile = imageFile;
        this.contentSpaceOrFolderId = contentSpaceOrFolderId;
        this.title = title;
        this.fileName = fileName;
        this.urlName = this._convertToProperUrlName(urlName);
    }

    private _convertToProperUrlName(urlName: string): string {
        return urlName.replace(/[^a-zA-Z-]+/g, '-').toLowerCase();
    }
}

export default class LightningCMSService extends LightningRESTService {
    constructor(aliasOrUsename: string) {
        super(aliasOrUsename);
    }

    public async uploadImage(request: ImageUploadRequest): Promise<any> {
        // https://developer.salesforce.com/docs/atlas.en-us.chatterapi.meta/chatterapi/connect_resources_cms_contents.htm
        const form = new FormData();
        form.append(
            'ManagedContentInputParam',
            JSON.stringify({
                contentSpaceOrFolderId: request.contentSpaceOrFolderId,
                title: request.title,
                contentType: 'sfdc_cms__image',
                urlName: request.urlName,
                contentBody: {
                    'sfdc_cms:media': {
                        source: {
                            type: 'file',
                        },
                    },
                },
            }),
            {
                contentType: 'application/json; charset=UTF-8',
            }
        );
        form.append('contentData', request.imageFile, {
            filename: request.fileName,
            contentType: 'application/octet-stream; charset=ISO-8859-1',
        });
        return await this.client.postMultiForm(
            new URL(
                this.context.sfUser!.instanceUrl +
                    `/services/data/${this.context.sfUser!.apiVersion}/connect/cms/contents`
            ),
            form
        );
    }
}
