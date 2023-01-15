import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import isQuoteAccesible from '@salesforce/apex/QuoteRequestController.isQuoteAccesible';

export default class QuotationPDF extends NavigationMixin(LightningElement)  {

    isQuoteAccessible = false
    url;

    async connectedCallback() {
        this.isQuoteAccessible = await isQuoteAccesible();
        this.quoteHomePageRef = {
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Quote',
                actionName: 'home'
            }
        };
        this.url = await this[NavigationMixin.GenerateUrl](this.quoteHomePageRef);
    }

    handleClick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this[NavigationMixin.Navigate](this.quoteHomePageRef);
    }



}