import { Command, Flags } from '@oclif/core';
import { HTTPResponseError } from '../../../../lib/rest/custom-server-fetch';
import LightningAvailabilityService from '../../../../lib/service/oci/lightning-availability';
import AvailabilityUtils from '../../../../lib/utils/oci/availability';
import { COMMON_FLAGS, LIGHTNING_COMMON_FLAGS } from '../../../../shared/flags';

export default class OciLightningAvailabilityRecords extends Command {
    static description = 'Retrieve availability records';

    static examples = ['<%= config.bin %> <%= command.id %> -o som-sdo -l inventory_m_oci_lg -s P0150M'];

    static flags = {
        ...COMMON_FLAGS,
        ...LIGHTNING_COMMON_FLAGS,
        locationGroup: Flags.string({ char: 'l', description: 'Location group id', required: true }),
        sku: Flags.string({ char: 's', description: 'sku', required: true }),
    };

    static args = {};

    public async run(): Promise<void> {
        const { flags } = await this.parse(OciLightningAvailabilityRecords);
        try {
            const service = new LightningAvailabilityService(flags.org);
            const result = await service.get({
                locationGroupIdentifier: flags.locationGroup,
                useCache: false,
                stockKeepingUnit: flags.sku,
            });
            AvailabilityUtils.displayLightningAvailabilityRecords(result);
        } catch (e) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.json());
            }
        }
    }
}
