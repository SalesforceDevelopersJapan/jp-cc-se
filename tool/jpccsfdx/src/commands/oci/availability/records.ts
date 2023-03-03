import { Args, Command, Flags } from '@oclif/core';
import { RestContext } from '../../../lib/interface/rest-context';
import { HTTPResponseError } from '../../../lib/rest/custom-server-fetch';
import UserAuth from '../../../lib/service/auth/user-auth';
import OCIAvailabilityService from '../../../lib/service/oci/availability';

export default class OciAvailabilityRecords extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        // flag with a value (-n, --name=VALUE)
        name: Flags.string({ char: 'n', description: 'name to print' }),
        // flag with no value (-f, --force)
        force: Flags.boolean({ char: 'f' }),
    };

    static args = {
        file: Args.string({ description: 'file to read' }),
    };

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(OciAvailabilityRecords);
        const service = new OCIAvailabilityService('som-sdo');
        try {
            const result = await service.get({
                locationGroupIdentifier: 'inventory_m_oci_lg',
                useCache: false,
                stockKeepingUnit: 'P0150M',
            });
            this.logJson(result);
        } catch (e) {
            const error = e as HTTPResponseError;
            this.logJson(await error.response.json());
        }
    }
}
