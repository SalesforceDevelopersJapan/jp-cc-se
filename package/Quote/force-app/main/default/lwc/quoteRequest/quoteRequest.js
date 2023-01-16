import { LightningElement } from 'lwc';
import webstoreId from '@salesforce/webstore/Id'
import getCartSummary from '@salesforce/apex/QuoteRequestController.getCartSummary';

export default class QuoteRequest extends LightningElement {

    summary

    async connectedCallback(){
        this.summary = await getCartSummary({webstoreId})
    }

    get inputVariables() {
        return [
            {
                name: 'webstoreId',
                type: 'String',
                value: webstoreId
            },
            {
                name: 'cartId',
                type: 'String',
                value: this.summary.cartId
            }
        ];
    }

    handleStatusChange(event) {
        console.log('handleStatusChange', event.detail);
    }
}