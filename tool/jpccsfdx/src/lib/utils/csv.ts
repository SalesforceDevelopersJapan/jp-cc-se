import { createReadStream, PathLike } from 'node:fs';
import { parse } from 'csv-parse';
import { finished } from 'stream/promises';

export default class CSVUtils {
    static async getAsJson(path: PathLike) {
        const records: any[] = [];
        const parser = createReadStream(path).pipe(
            parse({
                encoding: 'utf8',
                columns: true,
            })
        );
        parser.on('readable', function () {
            let record;
            while ((record = parser.read()) !== null) {
                records.push(record);
            }
        });
        await finished(parser);
        return records;
    }
}
