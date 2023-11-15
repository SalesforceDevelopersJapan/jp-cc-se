import { Args, Command, Flags } from '@oclif/core';
import { COMMON_FLAGS, LIGHTNING_COMMON_FLAGS } from '../../../shared/flags';
import { extname, join } from 'node:path';
import { createReadStream, readFileSync } from 'node:fs';
import LightningBulkService from '../../../lib/service/common/lightning-bulk';
import { HTTPResponseError } from '../../../lib/rest/custom-server-fetch';

export default class LightningBulkJob extends Command {
    static description = 'Bulk Salesforce Object Oparation';

    static examples = ['<%= config.bin %> <%= command.id %> sample/test.csv -o som-sdo -n Account'];

    static flags = {
        ...COMMON_FLAGS,
        ...LIGHTNING_COMMON_FLAGS,
        objectName: Flags.string({
            char: 'n',
            description: 'Name of object',
            required: true,
        }),
    };

    static args = {
        file: Args.string({ description: 'CSV file to upload', required: true }),
    };

    public async run(): Promise<void> {
        try {
            const { args, flags } = await this.parse(LightningBulkJob);
            const filePath = join(process.cwd(), args.file);
            const ext = extname(filePath);
            if (ext !== '.csv') {
                throw 'File is not CSV file';
            }
            const stream = createReadStream(filePath);
            const service = new LightningBulkService(flags.org);
            await service.doCSVInsertBulk(flags.objectName, stream);
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                console.log(e.message);
                console.log(e.response);
                console.log(await e.response.text());
            } else {
                console.log(e);
            }
        }
    }
}
