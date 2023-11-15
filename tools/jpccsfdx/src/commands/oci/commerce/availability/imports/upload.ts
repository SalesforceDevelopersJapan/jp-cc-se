import { Args, Command, Flags } from '@oclif/core';
import { createReadStream } from 'node:fs';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { createGzip } from 'node:zlib';
import { HTTPResponseError } from '../../../../../lib/rest/custom-server-fetch';
import UserAuth from '../../../../../lib/service/auth/user-auth';
import { CommerceInventoryImportRequest } from '../../../../../lib/service/oci/availability';
import SCAPIAvailabilityService from '../../../../../lib/service/oci/scapi-availability';
import CSVUtils from '../../../../../lib/utils/common/csv';
import AvailabilityUtils from '../../../../../lib/utils/oci/availability';
import { COMMERCE_COMMON_FLAGS, COMMON_FLAGS } from '../../../../../shared/flags';

export default class OciCommerceAvailabilityUpload extends Command {
    static description = 'Upload CSV or JSON file to update availability records';

    static examples = [
        '<%= config.bin %> <%= command.id %> sample/test.csv -i 6207f538-514e-408b-ba17-fdfb1fb268fb -s nkjsfdv7sndkj -t zzzz_000 -o 7bd53572-8577-4839-9e91-c8d7d978570a',
    ];

    static flags = {
        ...COMMON_FLAGS,
        ...COMMERCE_COMMON_FLAGS,
        onlyBase: Flags.boolean({
            char: 'b',
            description: 'Upload only base type. This value is available only when uploadin CSV file',
            required: false,
        }),
        omniTenantGroupId: Flags.string({ char: 'o', description: 'Omni Tenant Group Id', required: true }),
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

    private async getService(flags: any): Promise<SCAPIAvailabilityService> {
        const client = await UserAuth.getCommerceToken({
            clientId: flags.clientId,
            clientSecret: flags.clientSecret,
            tenantId: flags.tenantId,
            scope: 'sfcc.inventory.availability.rw sfcc.inventory.impex-inventory.rw sfcc.inventory.availability',
            omniTenantGroupId: flags.omniTenantGroupId,
            ociUrl: 'https://JP.api.commercecloud.salesforce.com',
        });
        return new SCAPIAvailabilityService(client);
    }

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(OciCommerceAvailabilityUpload);
        const filePath = join(process.cwd(), args.file);
        const maxRecords = Number(flags.maxRecords);
        const ext = extname(filePath);
        if (ext !== '.csv' && ext !== '.json') {
            throw 'File is not CSV or JSON file';
        }
        try {
            console.log('Uploading file...');
            const request: CommerceInventoryImportRequest = {
                fileName: 'data.zip',
                linkDuration: 30,
                fileFormat: 'JSON',
                fileEncoding: 'GZIP',
            };

            let file: any;

            if (ext === '.csv') {
                if (flags.onlyBase) {
                    console.log('Only Base Mode...');
                    const stream = AvailabilityUtils.getOnlyBaseAvailabilityStream(filePath);
                    file = stream.pipe(createGzip());
                } else {
                    const records = await CSVUtils.getAsJson(filePath);
                    if (maxRecords < records.length) {
                        throw Error(
                            `Max CSV record count exceed. Actual count:${records.length}, Max count:${maxRecords}`
                        );
                    }
                    const json = AvailabilityUtils.makeUpdateAvailabilityRequest(records);
                    const jsonStr = AvailabilityUtils.convertJsonObjToString(json);
                    file = Readable.from(jsonStr).pipe(createGzip());
                }
            }

            if (ext === '.json') {
                file = createReadStream(filePath).pipe(createGzip());
            }

            const service = await this.getService(flags);
            const upoadInfo = await service.requestUpload(request);
            await service.uploadFile(request.fileName, upoadInfo.importId, file);

            console.log('Finish uploading file.');
            await service.checkSCAPIImport(upoadInfo.importId);
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.json());
            } else {
                console.log(e);
            }
        }
    }
}
