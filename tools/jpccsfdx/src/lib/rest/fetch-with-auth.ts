import { RequestInit } from 'node-fetch';
import { RestContext } from '../interface/rest-context';
import CustomServerFetch from './custom-server-fetch';

export default class CustomFetchWithAuth extends CustomServerFetch {
    constructor(context: RestContext) {
        super((options: any): RequestInit => {
            if (!options.headers) {
                options.headers = {};
            }
            options.headers['Authorization'] = `Bearer ${context.oauth!.accessToken}`;
            return options;
        });
    }
}
