import { Args, Command, Flags } from '@oclif/core';
import { createReadStream } from 'node:fs';
import { extname, join } from 'node:path';
import { HTTPResponseError } from '../../../../../lib/rest/custom-server-fetch';
import LightningAvailabilityService from '../../../../../lib/service/oci/lightning-availability';
import CSVUtils from '../../../../../lib/utils/common/csv';
import AvailabilityUtils from '../../../../../lib/utils/oci/availability';
import { COMMON_FLAGS, LIGHTNING_COMMON_FLAGS } from '../../../../../shared/flags';

export default class OciLightningAvailabilityUpload extends Command {
    static description = 'Upload CSV or JSON file to update availability records';

    static examples = ['<%= config.bin %> <%= command.id %> sample/test.csv -o som-sdo'];

    static flags = {
        ...COMMON_FLAGS,
        ...LIGHTNING_COMMON_FLAGS,
        onlyBase: Flags.boolean({
            char: 'b',
            description: 'Upload only base type. This value is available only when uploadin CSV file',
            required: false,
        }),
        maxRecords: Flags.string({
            env: 'MAX_RECORDS',
            char: 'm',
            description: 'Max number of CSV redords. This value is availabale at NOT only base mode.',
            required: false,
            default: '10000',
        }),
    };

    static args = {
        file: Args.string({ description: 'JSON or CSV file to read', required: true }),
    };

    static MAX_RECORDS = process.env['MAX_RECORDS'] || 10000;

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(OciLightningAvailabilityUpload);
        const filePath = join(process.cwd(), args.file);
        const maxRecords = Number(flags.maxRecords);
        const ext = extname(filePath);
        if (ext !== '.csv' && ext !== '.json') {
            throw 'File is not CSV or JSON file';
        }
        try {
            const service = new LightningAvailabilityService(flags.org);

            console.log('Uploading file...');
            let response: any;

            if (ext === '.csv') {
                if (flags.onlyBase) {
                    console.log('Only Base Mode...');
                    const parser = AvailabilityUtils.getOnlyBaseAvailabilityStream(filePath);
                    response = await service.uploadFile(parser);
                } else {
                    const records = await CSVUtils.getAsJson(filePath);
                    if (maxRecords < records.length) {
                        throw Error(
                            `Max CSV record count exceed. Actual count:${records.length}, Max count:${maxRecords}`
                        );
                    }
                    const request = AvailabilityUtils.makeUpdateAvailabilityRequest(records);
                    response = await service.upload(request);
                }
            }

            if (ext === '.json') {
                const stream = createReadStream(filePath);
                response = await service.uploadFile(stream);
            }

            console.log('Finish uploading file.');
            await service.checkUpdate(response.uploadId);
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.json());
            } else {
                console.log(e);
            }
        }
    }
}
