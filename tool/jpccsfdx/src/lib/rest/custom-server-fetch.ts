import fetch, { RequestInit, Response } from 'node-fetch';

export class HTTPResponseError extends Error {
    response: Response;
    constructor(response: Response, ...args: any[]) {
        // @ts-ignore
        super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
        this.response = response;
    }
}

export default class CustomServerFetch {
    async _call(url: URL, options: RequestInit): Promise<any> {
        const response = await fetch(url.href, options);
        if (response.ok) {
            return await response.json();
        } else {
            throw new HTTPResponseError(response);
        }
    }

    public async get(url: URL): Promise<any> {
        const options: RequestInit = {
            method: 'get',
        };
        return await this._call(url, options);
    }

    public async post(url: URL, body: Object): Promise<any> {
        const options: RequestInit = {
            method: 'post',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        return await this._call(url, options);
    }

    public async postForm(url: URL, form: FormData): Promise<any> {
        const options: RequestInit = {
            method: 'post',
            body: form as any,
        };
        return await this._call(url, options);
    }

    public async put(url: URL, body: Object): Promise<any> {
        const options: RequestInit = {
            method: 'put',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        return await this._call(url, options);
    }

    public async patch(url: URL, body: Object): Promise<any> {
        const options: RequestInit = {
            method: 'patch',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        };
        return await this._call(url, options);
    }

    public async delete(url: URL): Promise<any> {
        const options: RequestInit = {
            method: 'delete',
        };
        return await this._call(url, options);
    }
}
