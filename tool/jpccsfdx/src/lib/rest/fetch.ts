import fetch, { RequestInit } from 'node-fetch';
import { RestContext } from '../interface/rest-context';
import CustomServerFetch, { HTTPResponseError } from './custom-server-fetch';

export default class CustomFetchWithAuth extends CustomServerFetch {
    public context: RestContext;

    constructor(context: RestContext) {
        super();
        this.context = context;
    }

    async _call(url: URL, options: RequestInit): Promise<any> {
        const response = await fetch(url.href, options);
        if (response.ok) {
            return await response.json();
        } else {
            throw new HTTPResponseError(response);
        }
    }

}
