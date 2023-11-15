import { RequestInit } from 'node-fetch';
import CustomServerFetch from './custom-server-fetch';

export default class CustomFetch extends CustomServerFetch {
    constructor() {
        super((options: any): RequestInit => options);
    }
}
