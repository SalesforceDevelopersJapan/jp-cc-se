import {
    UpdateAvailabilityRequest,
    UpdateAvailabilityRequestDetail,
    UpdateAvailabilityRequestOperation,
} from '../../service/oci/availability';
import { v4 as uuidv4 } from 'uuid';

type CSVRecord = {
    type: 'NORMAL' | 'FUTURE';
    location: string;
    onHand: string;
    sku: string;
    effectiveDate: string;
    'futures.expectedDate': string;
    'futures.quantity': string;
    safetyStockCount: string;
};
type CSVRecords = Array<CSVRecord>;

export default class AvailabilityUtils {
    static makeUpdateAvailabilityRequest(records: CSVRecords): UpdateAvailabilityRequest {
        const map = records.reduce((all: any, obj) => {
            all[obj.location] = all[obj.location] || {};
            all[obj.location][obj.sku] = all[obj.location][obj.sku] ? all[obj.location][obj.sku] : {};
            all[obj.location][obj.sku][obj.type] = all[obj.location][obj.sku][obj.type]
                ? [...all[obj.location][obj.sku][obj.type], obj]
                : [obj];
            return all;
        }, {});
        let result: UpdateAvailabilityRequest = [];
        for (const location in map) {
            try {
                const operation: UpdateAvailabilityRequestOperation = {
                    location: location,
                    mode: 'UPDATE',
                };
                const details: UpdateAvailabilityRequestDetail[] = [];
                for (const sku in map[location]) {
                    try {
                        const skuObj = map[location][sku];
                        // first row is used to request. ignore rows after second.
                        const normal: CSVRecord = skuObj['NORMAL'][0];
                        if (!normal.effectiveDate || !normal.onHand || !normal.safetyStockCount) {
                            throw Error('Some value are missing(effectiveDate, onHand, safetyStockCount)');
                        }
                        const detail: UpdateAvailabilityRequestDetail = {
                            recordId: uuidv4(),
                            onHand: Number(normal.onHand),
                            sku: normal.sku,
                            effectiveDate: new Date(normal.effectiveDate).toISOString(),
                            futures: [],
                            safetyStockCount: Number(normal.safetyStockCount),
                        };
                        if (normal['futures.expectedDate'] && normal['futures.quantity']) {
                            detail.futures = [
                                {
                                    expectedDate: new Date(normal['futures.expectedDate']).toISOString(),
                                    quantity: Number(normal['futures.quantity']),
                                },
                            ];
                        }
                        const futures: CSVRecords = skuObj['FUTURE'] || [];
                        detail.futures = futures.reduce<any>((all, future) => {
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
}
