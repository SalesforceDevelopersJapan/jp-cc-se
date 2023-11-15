import { api } from 'lwc';
import LightningModal from 'lightning/modal';
import Quote_RequestSuccess from '@salesforce/label/c.Quote_RequestSuccess';
import Quote_RequestSuccessDescription from '@salesforce/label/c.Quote_RequestSuccessDescription';
import Quote_RequestSuccessQuoteNumber from '@salesforce/label/c.Quote_RequestSuccessQuoteNumber';

export default class QuoteRequestSuccessModal extends LightningModal {
    @api isQuoteAccessible
    @api quoteNumber

    labels = {
        Quote_RequestSuccess,
        Quote_RequestSuccessDescription,
        Quote_RequestSuccessQuoteNumber
    }

    handleQuoteClick() {
        const clicklink = new CustomEvent('clicklink')
        this.dispatchEvent(clicklink);
    }

}