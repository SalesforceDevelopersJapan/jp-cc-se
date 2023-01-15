import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";
import isQuoteAccesible from '@salesforce/apex/QuoteRequestController.isQuoteAccesible';

export default class QuoteRequestSuccess extends NavigationMixin(LightningElement) {
    @api quoteId;
    @api quoteNumber;
    recordPageUrl;
    isQuoteAccessible

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