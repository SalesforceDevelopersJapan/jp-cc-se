import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class QuotationPDF extends NavigationMixin(LightningElement)  {

    url;

    async connectedCallback() {
        this.accountHomePageRef = {
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Quote',
                actionName: 'home'
            }
        };
        this.url = await this[NavigationMixin.GenerateUrl](this.accountHomePageRef);
    }

    handleClick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        this[NavigationMixin.Navigate](this.accountHomePageRef);
    }



}