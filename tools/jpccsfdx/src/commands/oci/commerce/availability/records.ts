import { Command, Flags } from '@oclif/core';
import { HTTPResponseError } from '../../../../lib/rest/custom-server-fetch';
import UserAuth from '../../../../lib/service/auth/user-auth';
import { CommerceGetAvailabilityRequest } from '../../../../lib/service/oci/availability';
import SCAPIAvailabilityService from '../../../../lib/service/oci/scapi-availability';
import AvailabilityUtils from '../../../../lib/utils/oci/availability';
import { COMMERCE_COMMON_FLAGS, COMMON_FLAGS } from '../../../../shared/flags';

export default class OciCommerceAvailabilityRecords extends Command {
    static description = 'Retrieve availability records';

    static examples = [
        '<%= config.bin %> <%= command.id %> -i 6207f538-514e-408b-ba17-fdfb1fb268fb -s nkjsfdv7sndkj -t zzzz_000 -o 7bd53572-8577-4839-9e91-c8d7d978570a -g inventory_m_demo -k TestProduct01',
    ];

    static flags = {
        ...COMMON_FLAGS,
        ...COMMERCE_COMMON_FLAGS,
        omniTenantGroupId: Flags.string({ char: 'o', description: 'Omni Tenant Group Id', required: true }),
        locations: Flags.string({ char: 'l', description: 'List of location id (e.g. tokyo,osaka )', required: false }),
        skus: Flags.string({ char: 'k', description: 'List of sku (e.g. ITEM0032,ITEM0123 )', required: false }),
        groups: Flags.string({ char: 'g', description: 'List of location group id (e.g. japan,us )', required: false }),
    };

    static args = {};

    public async run(): Promise<void> {
        const { flags } = await this.parse(OciCommerceAvailabilityRecords);
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
            const request: CommerceGetAvailabilityRequest = {};
            if (flags.skus) {
                const skus = flags.skus.split(',');
                if (skus.length > 0) {
                    request.skus = skus;
                }
            }
            if (flags.locations) {
                const locations = flags.locations.split(',');
                if (locations.length > 0) {
                    request.locations = locations;
                }
            }
            if (flags.groups) {
                const groups = flags.groups.split(',');
                if (groups.length > 0) {
                    request.groups = groups;
                }
            }
            const result = await service.get(request);
            AvailabilityUtils.displayCommerceAvailabilityRecords(result);
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.json());
            }
        }
    }
}
