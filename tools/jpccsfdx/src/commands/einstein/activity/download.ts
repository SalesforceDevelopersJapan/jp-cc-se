import { Args, Command, Flags } from '@oclif/core';
import { COMMON_FLAGS, LIGHTNING_COMMON_FLAGS } from '../../../shared/flags';
import LightningEinsteinService from '../../../lib/service/einstein/lightning-einstein-service';
import { join } from 'node:path';
import { HTTPResponseError } from '../../../lib/rest/custom-server-fetch';
import FileUtils from '../../../lib/utils/common/file';

export default class EinsteinActivityDownload extends Command {
    static description = 'Uploead image file to CMS';

    static examples = ['<%= config.bin %> <%= command.id %> -o som-sdo -l inventory_m_oci_lg -s P0150M'];

    static flags = {
        ...COMMON_FLAGS,
        ...LIGHTNING_COMMON_FLAGS,
        fileName: Flags.string({
            char: 'f',
            description: 'File name to download',
            required: false,
            default: 'activities.csv',
        }),
        userId: Flags.string({ char: 'u', description: 'User ID', required: true }),
        webstoreId: Flags.string({ char: 'w', description: 'Webstore ID', required: true }),
        outputDir: Flags.string({ char: 'd', description: 'Output directory', required: true }),
    };

    public async run(): Promise<void> {
        const { flags } = await this.parse(EinsteinActivityDownload);
        try {
            const outputFileDir = join(process.cwd(), flags.outputDir);
            if (!(await FileUtils.isExist(outputFileDir))) {
                throw Error(`Output directory ${outputFileDir} is not exist`);
            }
            const outputFilePath = join(outputFileDir, flags.fileName);
            const service = new LightningEinsteinService(flags.org);
            const request = await service.requestExportActivity(flags.webstoreId, flags.userId);
            console.log(request);
            // const status = await service.checkExportStatus(flags.webstoreId, request.jobId);
            // console.log(status);
            // await service.downloadActivity(flags.webstoreId, request.jobId, outputFilePath);

            // const conf = await service.getConfiguration(flags.webstoreId);
            // console.log(conf);
            // const deployStatus = await service.getDeployStatus(flags.webstoreId);
            // console.log(deployStatus);
            const status = await service.getExportActivityStatus(flags.webstoreId, request.jobId);
            console.log(status);
            // await service.downloadActivity(flags.webstoreId, "e3475fc1-0607-4c0b-bc2f-612ea8cca0de", outputFilePath);
        } catch (e: any) {
            if (e instanceof HTTPResponseError) {
                this.logJson(await e.response.text());
            } else {
                this.logJson(e.message);
            }
        }
    }
}
