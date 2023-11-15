import { Args, Command, Flags } from '@oclif/core';
import { HTTPResponseError } from '../../../../../lib/rest/custom-server-fetch';
import UserAuth from '../../../../../lib/service/auth/user-auth';
import SCAPIAvailabilityService from '../../../../../lib/service/oci/scapi-availability';
import { COMMERCE_COMMON_FLAGS, COMMON_FLAGS } from '../../../../../shared/flags';

export default class OciLightningImportDelete extends Command {
    static description = 'Delete availability import';

    static examples = [
        '<%= config.bin %> <%= command.id %> 6e164f65-e424-4241-9c3f-aeea690d83ef -i 6207f538-514e-408b-ba17-fdfb1fb268fb -s nkjsfdv7sndkj -t zzzz_000 -o 7bd53572-8577-4839-9e91-c8d7d978570a',
    ];

    static flags = {
        ...COMMON_FLAGS,
        ...COMMERCE_COMMON_FLAGS,
        omniTenantGroupId: Flags.string({ char: 'o', description: 'Omni Tenant Group Id', required: true }),
    };

    static args = {
        importId: Args.string({ description: 'Import id to delete', required: true }),
    };

    static MAX_RECORDS = process.env['MAX_RECORDS'] || 10000;

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(OciLightningImportDelete);
        const importId = args.importId;
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
            await service.deleteImport(importId);
            await service.displayImportStatus();
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                try {
                    this.logJson(await e.response.json());
                } catch {
                    this.error(await e.response.text());
                }
            } else {
                console.error(e);
            }
        }
    }
}
