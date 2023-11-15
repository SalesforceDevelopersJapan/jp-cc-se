import fetch, { RequestInit, Response } from 'node-fetch';
import { PathLike, createWriteStream } from 'node:fs';
import { finished } from 'stream/promises';
import FormData = require('form-data');

export class HTTPResponseError extends Error {
    response: Response;
    constructor(response: Response, ...args: any[]) {
        // @ts-ignore
        super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
        this.response = response;
    }
}

export default class CustomServerFetch {
    public optionGenerator: (options: any) => RequestInit;

    constructor(optionGenerator: (options: any) => RequestInit) {
        this.optionGenerator = optionGenerator;
    }

    async _call(url: URL, options: RequestInit): Promise<any> {
        const response = await fetch(url.href, this.optionGenerator(options));
        if (response.ok) {
            return await response.json();
        } else {
            throw new HTTPResponseError(response);
        }
    }

    async _callPlain(url: URL, options: RequestInit): Promise<any> {
        const response = await fetch(url.href, this.optionGenerator(options));
        if (response.ok) {
            return response;
        } else {
            throw new HTTPResponseError(response);
        }
    }

    public async get(url: URL, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'get',
        };
        if (additionalHeaders) {
            options.headers = {
                ...options.headers,
                ...additionalHeaders,
            };
        }
        return await this._call(url, options);
    }

    public async genericPlainCall(url: URL, options: RequestInit): Promise<any> {
        return await this._callPlain(url, options);
    }

    public async genericCall(url: URL, options: RequestInit): Promise<any> {
        return await this._call(url, options);
    }

    public async post(url: URL, body: Object, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        if (additionalHeaders) {
            options.headers = {
                ...options.headers,
                ...additionalHeaders,
            };
        }
        return await this._call(url, options);
    }

    public async postMultiForm(url: URL, form: FormData, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'post',
            body: form as any,
        };
        if (additionalHeaders) {
            options.headers = additionalHeaders;
        }
        return await this._call(url, options);
    }

    public async postForm(
        url: URL,
        params: URLSearchParams,
        additionalHeaders?: { [key: string]: string }
    ): Promise<any> {
        const options: RequestInit = {
            method: 'post',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        };
        if (additionalHeaders) {
            options.headers = additionalHeaders;
        }
        return await this._call(url, options);
    }

    public async put(url: URL, body: Object, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'put',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        if (additionalHeaders) {
            options.headers = {
                ...options.headers,
                ...additionalHeaders,
            };
        }
        return await this._call(url, options);
    }

    public async patch(url: URL, body: Object, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'patch',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        if (additionalHeaders) {
            options.headers = {
                ...options.headers,
                ...additionalHeaders,
            };
        }
        return await this._call(url, options);
    }

    public async delete(url: URL, additionalHeaders?: { [key: string]: string }): Promise<any> {
        const options: RequestInit = {
            method: 'delete',
        };
        if (additionalHeaders) {
            options.headers = additionalHeaders;
        }
        return await this._call(url, options);
    }

    public async download(url: URL, path: PathLike, additionalHeaders?: { [key: string]: string }): Promise<void> {
        const options: RequestInit = {
            method: 'get',
        };
        if (additionalHeaders) {
            options.headers = additionalHeaders;
        }
        const response = await this._callPlain(url, options);
        const fileStream = createWriteStream(path);
        const parser = response.body.pipe(fileStream);
        await finished(parser);
    }
}
