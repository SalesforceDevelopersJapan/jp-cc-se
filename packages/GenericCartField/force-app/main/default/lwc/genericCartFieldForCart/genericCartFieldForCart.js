import { LightningElement, wire, api } from 'lwc';
import { CartSummaryAdapter } from 'commerce/cartApi';
import ToastContainer from 'lightning/toastContainer';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateField from '@salesforce/apex/GenericCartFieldController.updateField';


export default class GenericCartFieldForCart extends LightningElement {

    @api fieldApiName;
    @api label;
    @api buttonLabel;
    @api placeHolder;
    @api isRequired;

    @api tSuccessTitle;
    @api tErrortTitle;
    @api tInvalidErrorDescription;
    @api tUpdateSuccessDescription;

    _cartId

    @wire(CartSummaryAdapter)
    async cart({ data, error }) {
        if (data) {
            this._cartId = data.cartId;
        } else if (error) {
            console.error(error);
        }
    }

    connectedCallback() {
        // This is Beta toast compoent
        // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/use_toast 
        const toastContainer = ToastContainer.instance();
        toastContainer.maxShown = 5;
        toastContainer.toastPosition = 'top-center';
    }

    // This is using Beta toast container compoent
    // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/use_toast
    success(title, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: "success",
        });
        this.dispatchEvent(evt);
    }

    error(title, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: "error",
            mode: "sticky"
        });
        this.dispatchEvent(evt);
    }


    async update(event) {
        event.stopPropagation();
        event.preventDefault();
        try {
            const el = this.template.querySelector('c-generic-cart-field')
            if (!el.checkValidity()) {
                throw new Error(this.tInvalidErrorDescription)
            }
            await updateField({
                cartId: this._cartId,
                fieldName: this.fieldApiName,
                value: el.getValue(),
                type: el.getType()
            })
            this.success(this.tSuccessTitle, this.tUpdateSuccessDescription)
        } catch (e) {
            this.error(this.tErrortTitle, e.message)
        }

    }
}