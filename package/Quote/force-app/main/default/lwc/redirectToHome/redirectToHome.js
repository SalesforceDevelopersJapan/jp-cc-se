import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class RedirectToHome extends NavigationMixin(LightningElement) {

    connectedCallback() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: "Home"
            }
        });
    }

}