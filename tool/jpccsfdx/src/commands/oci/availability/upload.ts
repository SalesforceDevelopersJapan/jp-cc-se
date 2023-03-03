import { Args, Command, Flags } from '@oclif/core';
import { extname } from 'node:path';
import OCIAvailabilityService, { UpdateAvailabilityRequest } from '../../../lib/service/oci/availability';
import CSVUtils from '../../../lib/utils/csv';
import AvailabilityUtils from '../../../lib/utils/oci/availability';

export default class OciAvailabilityUpload extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {};

    static args = {
        file: Args.string({ description: 'file to read', required: true }),
    };

    public async run(): Promise<void> {
        const { args } = await this.parse(OciAvailabilityUpload);
        const filePath = process.cwd() + '/' + args.file;
        if (extname(filePath) !== '.csv') {
            throw 'file is not csv';
        }
        const records = await CSVUtils.getAsJson(filePath);
        const request = AvailabilityUtils.makeUpdateAvailabilityRequest(records);
        this.logJson(request)
        // const service = new OCIAvailabilityService('som-sdo');
        // await service.update(request);
    }
}
