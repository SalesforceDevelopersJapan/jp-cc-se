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
        const response = await fetch(url.href, this._withToken(options));
        if (response.ok) {
            return await response.json();
        } else {
            throw new HTTPResponseError(response);
        }
    }

    private _withToken(options: any): RequestInit {
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['Authorization'] = `Bearer ${this.context.user.accessToken}`;
        return options;
    }
}
