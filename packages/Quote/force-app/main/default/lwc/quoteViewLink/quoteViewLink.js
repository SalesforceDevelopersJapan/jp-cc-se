import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import isQuoteAccesible from '@salesforce/apex/QuoteRequestController.isQuoteAccesible';
import Quote_QuoteListViewLink from '@salesforce/label/c.Quote_QuoteListViewLink';
import Quote_QuoteNoPermission from '@salesforce/label/c.Quote_QuoteNoPermission';

export default class QuotationPDF extends NavigationMixin(LightningElement)  {

    isQuoteAccessible = false
    url;

    label = {
        Quote_QuoteListViewLink,
        Quote_QuoteNoPermission
    }

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