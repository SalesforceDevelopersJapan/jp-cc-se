import { CastingContext, parse, Parser } from 'csv-parse';
import { createReadStream, PathLike } from 'node:fs';
import { Readable, Transform, TransformCallback, TransformOptions } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';
import {
    CommerceAvailabilityRecord,
    CommerceGetAvailabilityResponse,
    LightningGetAvailabilityResponse,
    LightningInventoryRecord,
    UpdateAvailabilityRequest,
    UpdateAvailabilityRequestDetail,
    UpdateAvailabilityRequestOperation,
} from '../../service/oci/availability';

type CSVRecord = {
    type: 'BASE' | 'FUTURE';
    location: string;
    onHand: string;
    sku: string;
    effectiveDate: string;
    'futures.expectedDate': string;
    'futures.quantity': string;
    safetyStockCount: string;
};
type CSVRecords = Array<CSVRecord>;

class AvailabilityTransform extends Transform {
    tmpLocationId: string = '';
    constructor(
        options?: {
            transform?(
                this: AvailabilityTransform,
                chunk: any,
                encoding: BufferEncoding,
                callback: TransformCallback
            ): void;
        } & TransformOptions
    ) {
        super(options);
    }
}

export default class AvailabilityUtils {
    static makeUpdateAvailabilityRequest(records: CSVRecords): UpdateAvailabilityRequest {
        const map = records.reduce((all: any, obj, index) => {
            console.log(`Making map for index : ${index}`);
            if (!all.hasOwnProperty(obj.location)) {
                all[obj.location] = {};
            }
            if (!all[obj.location].hasOwnProperty(obj.sku)) {
                all[obj.location][obj.sku] = {};
            }
            if (!all[obj.location][obj.sku].hasOwnProperty(obj.type)) {
                all[obj.location][obj.sku][obj.type] = [obj];
            } else {
                all[obj.location][obj.sku][obj.type] = [...all[obj.location][obj.sku][obj.type], obj];
            }
            return all;
        }, {});
        let result: UpdateAvailabilityRequest = [];
        for (const location in map) {
            console.log(`Making list for location : ${location}`);
            try {
                const operation: UpdateAvailabilityRequestOperation = {
                    location: location,
                    mode: 'UPDATE',
                };
                const details: UpdateAvailabilityRequestDetail[] = [];
                for (const sku in map[location]) {
                    try {
                        const detail: UpdateAvailabilityRequestDetail = {
                            recordId: uuidv4(),
                            sku,
                        };
                        const skuObj = map[location][sku];
                        if (skuObj['BASE']) {
                            // NOTICE: first row is used to request. ignore rows after second.
                            const base: CSVRecord = skuObj['BASE'][0];
                            if (base.onHand) detail.onHand = Number(base.onHand);
                            if (base.effectiveDate) detail.effectiveDate = new Date(base.effectiveDate).toISOString();
                            if (base.safetyStockCount) detail.safetyStockCount = Number(base.safetyStockCount);
                        }
                        if (skuObj['FUTURE']) {
                            const futures: CSVRecords = skuObj['FUTURE'] || [];
                            const tmpFutures = futures.reduce<any>((all, future) => {
                                return future['futures.expectedDate'] && future['futures.quantity']
                                    ? [
                                          ...all,
                                          {
                                              expectedDate: new Date(future['futures.expectedDate']).toISOString(),
                                              quantity: Number(future['futures.quantity']),
                                          },
                                      ]
                                    : all;
                            }, []);
                            if (tmpFutures.length > 0) {
                                detail.futures = detail.futures ? [...detail.futures, ...tmpFutures] : tmpFutures;
                            }
                        }
                        details.push(detail);
                    } catch (e: any) {
                        if (e instanceof Error) {
                            console.log(`Making request for (location:${location}, sku:${sku}) is failed`);
                            console.log(e);
                        }
                    }
                }
                if (details.length > 0) {
                    result = [...result, operation, ...details];
                }
            } catch (e: any) {
                if (e instanceof Error) {
                    console.log(`Making request for  location:${location} is failed`);
                    console.log(e);
                }
            }
        }
        return result;
    }

    static getOnlyBaseAvailabilityStream(path: PathLike): Parser {
        return createReadStream(path).pipe(
            parse({
                encoding: 'utf8',
                columns: true,
                onRecord: (record: CSVRecord, context: CastingContext) => {
                    if (record.type !== 'BASE' || !record.location || !record.sku) {
                        return;
                    }
                    const operation: UpdateAvailabilityRequestOperation = {
                        location: record.location,
                        mode: 'UPDATE',
                    };
                    const detail: UpdateAvailabilityRequestDetail = {
                        recordId: uuidv4(),
                        sku: record.sku,
                    };
                    if (record.onHand) detail.onHand = Number(record.onHand);
                    if (record.effectiveDate) detail.effectiveDate = new Date(record.effectiveDate).toISOString();
                    if (record.safetyStockCount) detail.safetyStockCount = Number(record.safetyStockCount);
                    return (
                        JSON.stringify(operation).replace(/(\s+|\n)/g, '') +
                        '\n' +
                        JSON.stringify(detail).replace(/(\s+|\n)/g, '') +
                        '\n'
                    );
                },
            })
        );
    }

    static getJsonToCSVStreamFromPath(path: PathLike) {
        return AvailabilityUtils.getJsonToCSVStream(createReadStream(path));
    }

    static getJsonToCSVStream(jsonStream: Readable) {
        const transformToLine = new Transform({
            transform(chunk, _, done) {
                try {
                    var lines = chunk.toString().split('\n');
                    for (const line of lines) {
                        this.push(line);
                    }
                } catch {
                    // Do nothing
                } finally {
                    done();
                }
            },
            objectMode: true,
        });
        const transformObjToCSVLine = new AvailabilityTransform({
            transform(chunk, _, done) {
                try {
                    const that = this as AvailabilityTransform;
                    const obj = JSON.parse(chunk) as UpdateAvailabilityRequestDetail &
                        UpdateAvailabilityRequestOperation;
                    if (obj.location) {
                        that.tmpLocationId = obj.location;
                    } else {
                        if (obj.futures && obj.futures.length > 0) {
                            for (const future of obj.futures) {
                                this.push(
                                    `FUTURE,${that.tmpLocationId},,${obj.sku},,,${new Date(
                                        future.expectedDate
                                    ).toISOString()},${future.quantity}\n`
                                );
                            }
                        }

                        if (obj.effectiveDate || obj.onHand || obj.safetyStockCount) {
                            this.push(
                                `BASE,${that.tmpLocationId},${obj.onHand},${obj.sku},${new Date(
                                    obj.effectiveDate!
                                ).toISOString()},${obj.safetyStockCount},,\n`
                            );
                        }
                    }
                } catch {
                    // Do nothing
                } finally {
                    done();
                }
            },
            objectMode: true,
        });
        return jsonStream.pipe(transformToLine).pipe(transformObjToCSVLine);
    }

    static convertJsonObjToString(jsonList: UpdateAvailabilityRequest): string {
        let jsonListString = '';
        for (let o of jsonList) {
            jsonListString += JSON.stringify(o).replace(/(\s+|\n)/g, '') + '\n';
        }
        return jsonListString;
    }

    static displayCommerceAvailabilityRecords(result: CommerceGetAvailabilityResponse) {
        const recordsToObj = (id: string, records: CommerceAvailabilityRecord[]) => {
            if (!records) {
                return [];
            }
            return records.map((r) => {
                return {
                    id,
                    atf: r.atf,
                    ato: r.ato,
                    reserved: r.reserved,
                    onHand: r.onHand,
                    sku: r.sku,
                    effectiveDate: r.effectiveDate,
                    futures: r.futures?.reduce((c, f) => c + f.quantity, 0),
                    safetyStockCount: r.safetyStockCount,
                };
            });
        };
        if (result.groups) {
            console.log('Location Groups:');
            let display: any[] = [];
            result.groups.forEach((g) => {
                display = [...display, ...recordsToObj(g.id, g.records)];
            });
            console.table(display);
        }
        if (result.locations) {
            console.log('Locations:');
            let display: any[] = [];
            result.locations.forEach((l) => {
                display = [...display, ...recordsToObj(l.id, l.records)];
            });
            console.table(display);
        }
    }

    static displayLightningAvailabilityRecords(result: LightningGetAvailabilityResponse) {
        const recordsToObj = (id: string, records: LightningInventoryRecord[]) => {
            if (!records) {
                return [];
            }
            return records.map((r) => {
                return {
                    id,
                    availableToFulfill: r.availableToFulfill,
                    availableToOrder: r.availableToOrder,
                    effectiveDate: r.effectiveDate,
                    onHand: r.onHand,
                    reserved: r.reserved,
                    safetyStockCount: r.safetyStockCount,
                    stockKeepingUnit: r.stockKeepingUnit,
                    futures: r.futures?.reduce((c, f) => c + f.quantity, 0),
                };
            });
        };
        if (result.locationGroups) {
            console.log('Location Groups:');
            let display: any[] = [];
            result.locationGroups.forEach((g) => {
                display = [...display, ...recordsToObj(g.locationGroupIdentifier, g.inventoryRecords)];
            });
            console.table(display);
        }
        if (result.locations) {
            console.log('Locations:');
            let display: any[] = [];
            result.locations.forEach((l) => {
                display = [...display, ...recordsToObj(l.locationIdentifier, l.inventoryRecords)];
            });
            console.table(display);
        }
    }
}
