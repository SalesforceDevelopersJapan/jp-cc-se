import { Args, Command, Flags } from '@oclif/core';
import { mkdir, writeFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import CSVUtils from '../../../../../lib/utils/common/csv';
import AvailabilityUtils from '../../../../../lib/utils/oci/availability';
import { COMMON_FLAGS } from '../../../../../shared/flags';

export default class OciCommonAvailabilityImportCSVConvert extends Command {
    static description = 'Convert CSV and JSON files';

    static examples = ['<%= config.bin %> <%= command.id %> ./sample/json/mix.json -f sample.csv -d ./sample/csv'];

    static flags = {
        ...COMMON_FLAGS,
        onlyBase: Flags.boolean({
            char: 'b',
            description: 'Upload only base type. This value is available only when converting CSV to JSON',
            required: false,
        }),
        outputFileName: Flags.string({ char: 'f', description: 'Output file name (e.g. sample.csv)', required: false }),
        outputDirName: Flags.string({
            char: 'd',
            description: 'Output directory name (e.g. ./sample/csv)',
            required: false,
        }),
    };

    static args = {
        file: Args.string({ description: 'JSON or CSV file to read', required: true }),
    };

    public async run(): Promise<void> {
        try {
            const { flags, args } = await this.parse(OciCommonAvailabilityImportCSVConvert);
            const filePath = join(process.cwd(), args.file);
            const outputDir = join(process.cwd(), flags.outputDirName || '');
            const ext = extname(filePath);
            const filename = basename(filePath, ext);
            if (ext !== '.json' && ext !== '.csv') {
                throw Error('File type should be csv or json.');
            }
            let outputFile = '';
            let data: any;
            if (ext === '.csv') {
                if (flags.onlyBase) {
                    data = AvailabilityUtils.getOnlyBaseAvailabilityStream(filePath);
                } else {
                    const records = await CSVUtils.getAsJson(filePath);
                    const json = AvailabilityUtils.makeUpdateAvailabilityRequest(records);
                    data = AvailabilityUtils.convertJsonObjToString(json);
                }
                outputFile = join(outputDir, flags.outputFileName || filename + '.json');
            }
            if (ext === '.json') {
                data = AvailabilityUtils.getJsonToCSVStreamFromPath(filePath);
                data.push(
                    'type,location,onHand,sku,effectiveDate,safetyStockCount,futures.expectedDate,futures.quantity\n'
                );
                outputFile = join(outputDir, flags.outputFileName || filename + '.csv');
            }
            await mkdir(outputDir, { recursive: true });
            await writeFile(outputFile, data);
        } catch (e) {
            this.logJson(e);
        }
    }
}
