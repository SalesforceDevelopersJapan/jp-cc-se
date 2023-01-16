import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import isQuoteAccesible from '@salesforce/apex/QuoteRequestController.isQuoteAccesible';
import Quote_RequestSuccess from '@salesforce/label/c.Quote_RequestSuccess';
import Quote_RequestSuccessDescription from '@salesforce/label/c.Quote_RequestSuccessDescription';
import Quote_RequestSuccessQuoteNumber from '@salesforce/label/c.Quote_RequestSuccessQuoteNumber';

export default class QuoteRequestSuccess extends NavigationMixin(LightningElement) {
    @api quoteId;
    @api quoteNumber;
    recordPageUrl;
    isQuoteAccessible

    label = {
        Quote_RequestSuccess,
        Quote_RequestSuccessDescription,
        Quote_RequestSuccessQuoteNumber
    }

    handleClick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this[NavigationMixin.Navigate](this.quoteViewPageRef);
    }

    async connectedCallback() {
        this.isQuoteAccessible = await isQuoteAccesible();
        this.quoteViewPageRef = {
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Quote',
                recordId: this.quoteId,
                actionName: 'home'
            }
        };
        this.recordPageUrl = await this[NavigationMixin.GenerateUrl](this.quoteViewPageRef);
    }


}