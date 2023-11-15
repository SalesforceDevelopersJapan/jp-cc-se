import { Command, Flags } from '@oclif/core';
import { HTTPResponseError } from '../../../../../lib/rest/custom-server-fetch';
import UserAuth from '../../../../../lib/service/auth/user-auth';
import SCAPIAvailabilityService from '../../../../../lib/service/oci/scapi-availability';
import { COMMERCE_COMMON_FLAGS, COMMON_FLAGS } from '../../../../../shared/flags';

export default class OciCommerceAvailabilityImportList extends Command {
    static description = 'Retrieve availability import list';

    static examples = [
        '<%= config.bin %> <%= command.id %> -i 6207f538-514e-408b-ba17-fdfb1fb268fb -s nkjsfdv7sndkj -t zzzz_000 -o 7bd53572-8577-4839-9e91-c8d7d978570a -g inventory_m_demo -k TestProduct01',
    ];

    static flags = {
        ...COMMON_FLAGS,
        ...COMMERCE_COMMON_FLAGS,
        omniTenantGroupId: Flags.string({ char: 'o', description: 'Omni Tenant Group Id', required: true }),
    };

    static args = {};

    public async run(): Promise<void> {
        const { flags } = await this.parse(OciCommerceAvailabilityImportList);
        try {
            const client = await UserAuth.getCommerceToken({
                clientId: flags.clientId,
                clientSecret: flags.clientSecret,
                tenantId: flags.tenantId,
                scope: 'sfcc.inventory.availability.rw sfcc.inventory.impex-inventory.rw sfcc.inventory.availability',
                omniTenantGroupId: flags.omniTenantGroupId,
                ociUrl: 'https://JP.api.commercecloud.salesforce.com',
            });
            const service = new SCAPIAvailabilityService(client);
            await service.displayImportStatus();
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.json());
            }
        }
    }
}
