import { api, LightningElement } from 'lwc';
import webstoreId from '@salesforce/webstore/Id'
import userId from '@salesforce/user/Id';
import SampleProductRequestSuccessModal from "c/sampleProductRequestSuccessModal";

export default class SampleProductRequest extends LightningElement {

    @api productId;

    get inputVariables() {
        return [
            {
                name: 'webstoreId',
                type: 'String',
                value: webstoreId
            },
            {
                name: 'productId',
                type: 'String',
                value: this.productId
            },
            {
                name: 'userId',
                type: 'String',
                value: userId || ''
            }
        ];
    }

    async handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            SampleProductRequestSuccessModal.open({
                label: '',
                size: 'small'
            })
        }
    }
}