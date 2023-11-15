import { RequestInit } from 'node-fetch';
import { RestContext } from '../interface/rest-context';
import CustomServerFetch from './custom-server-fetch';

export default class CustomFetchWithBasicAuth extends CustomServerFetch {
    constructor(context: RestContext) {
        super((options: any): RequestInit => {
            if (!options.headers) {
                options.headers = {};
            }
            const buffer = Buffer.from(`${context.basicAuth!.id}:${context.basicAuth!.password}`);
            const authString = buffer.toString('base64');
            options.headers['Authorization'] = `Basic ${authString}`;
            return options;
        });
    }
}
