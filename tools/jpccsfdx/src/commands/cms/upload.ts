import { Args, Command } from '@oclif/core';
import { extname, join } from 'node:path';
import { HTTPResponseError } from '../../lib/rest/custom-server-fetch';
import LightningCMSService, { ImageUploadRequest } from '../../lib/service/cms/lightning-cms';
import { COMMON_FLAGS, LIGHTNING_COMMON_FLAGS } from '../../shared/flags';
import FileUtils from '../../lib/utils/common/file';

export default class CmsUpload extends Command {
    static description = 'Uploead image file to CMS';

    static examples = ['<%= config.bin %> <%= command.id %> -o som-sdo -l inventory_m_oci_lg -s P0150M'];

    static flags = {
        ...COMMON_FLAGS,
        ...LIGHTNING_COMMON_FLAGS,
    };

    static args = {
        file: Args.string({ description: 'JSON or CSV file to read', required: true }),
    };

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(CmsUpload);

        try {

            // validate image files

            // validate csv files

            // Upload images

            // import products

            // create product media


            const filePath = join(process.cwd(), args.file);
            const ext = extname(filePath);
            if (['.jpg', '.gif', '.jpeg', '.png', '.bmp'].findIndex((e) => e === ext) === -1) {
                throw 'File is not image file';
            }
            const service = new LightningCMSService(flags.org);
            const image = FileUtils.getImage(filePath);
            const request = new ImageUploadRequest(
                image,
                '9Pu0l0000008OY3CAM',
                'Sample Title',
                'Salesforce.jpg',
                'salesforce'
            );
            const result = await service.uploadImage(request);
            this.logJson(result);
        } catch (e: any) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.text());
            } else {
                this.logJson(e.message);
            }
        }
    }
}
