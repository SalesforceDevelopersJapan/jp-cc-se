import { LightningElement, api } from 'lwc';
import currencyFormatter from 'c/currencyFormatter'

export default class FormattedPrice extends LightningElement {
    static renderMode = 'light';

    @api currencyCode;
    @api value;
    // 'symbol' | 'code' | 'name'
    @api displayCurrencyAs;

    get formattedPrice() {
        if (this.value !== undefined && this.currencyCode) {
            return currencyFormatter(this.currencyCode, this.value, this.displayCurrencyAs || 'symbol');
        }
        return undefined;
    }
}
