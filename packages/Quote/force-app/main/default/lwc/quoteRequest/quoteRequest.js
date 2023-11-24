import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import webstoreId from '@salesforce/webstore/Id'
import isQuoteAccesible from '@salesforce/apex/QuoteRequestController.isQuoteAccesible';
import QuoteRequestSuccessModal from "c/quoteRequestSuccessModal";
import isGuest from '@salesforce/user/isGuest';
import { CartSummaryAdapter } from 'commerce/cartApi';
import Quote_RequestCartNotFound from '@salesforce/label/c.Quote_RequestCartNotFound';

export default class QuoteRequest extends NavigationMixin(LightningElement) {

    quoteId
    quoteNumber
    isQuoteAccessible = false
    isLoading = false
    hasRequestEnd = false
    cartId

    labels = {
        Quote_RequestCartNotFound
    }

    @wire(CartSummaryAdapter)
    async cart({ data, error }) {
        this.isLoading = true
        if (data) {
            this.cartId = data.cartId;
            this.isLoading = false
        } else if (error) {
            this.isLoading = false
        }
    }

    async _callControllers() {
        try {
            this.isQuoteAccessible = await isQuoteAccesible();
        } catch (e) {
            console.log(e);
        }
    }

    async connectedCallback() {
        await this._callControllers()
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
                value: this.cartId
            }
        ];
    }

    get hasCartId() {
        return !!this.cartId;
    }

    get visible() {
        return !this.isLoading && !isGuest
    }

    async handleStatusChange(event) {
        if (event.detail.status === 'FINISHED') {
            const variables = event.detail.outputVariables;
            this.quoteId = variables.find(output => output.name === 'quote_id').value
            this.quoteNumber = variables.find(output => output.name === 'quote_number').value
            this.openSuccessModal()
        }
    }

    openSuccessModal() {
        QuoteRequestSuccessModal.open({
            label: '',
            size: 'small',
            isQuoteAccessible: this.isQuoteAccessible,
            quoteNumber: this.quoteNumber,
            onclicklink: (e) => {
                e.stopPropagation();
                this[NavigationMixin.Navigate]({
                    type: 'standard__objectPage',
                    attributes: {
                        objectApiName: 'Quote',
                        recordId: this.quoteId,
                        actionName: 'home'
                    }
                });
            }
        }).then(() => {
            window.location.reload()
        });
    }





}