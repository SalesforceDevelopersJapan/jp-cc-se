import { LightningElement, api } from 'lwc';
import GMOPayment_CardListSetAsDefault from '@salesforce/label/c.GMOPayment_CardListSetAsDefault';
import GMOPayment_CardListDelete from '@salesforce/label/c.GMOPayment_CardListDelete';
import GMOPayment_CardListSecurityCodePH from '@salesforce/label/c.GMOPayment_CardListSecurityCodePH';

export default class GmoCardElementCardListRow extends LightningElement {

    @api
    item
    @api
    disableButton = false
    @api
    selected

    _securityCode

    get isSelected() {
        return this.selected === this.item.CardSeq
    }

    label = {
        GMOPayment_CardListSetAsDefault,
        GMOPayment_CardListDelete,
        GMOPayment_CardListSecurityCodePH
    }

    handleSelect(e) {
        const event = new CustomEvent('select', { detail: { select: e.target.value } });
        this.dispatchEvent(event);
    }

    handleDefault(e) {
        e.preventDefault();
        const formData = new FormData(e.submitter.form)
        const cardSeq = formData.get("cardSeq");
        const expire = formData.get("expire");
        const holderName = formData.get("holderName");
        const event = new CustomEvent('setdefault', { detail: { cardSeq, expire, holderName } });
        this.dispatchEvent(event);
    }


    handleDelete(e) {
        e.preventDefault();
        const formData = new FormData(e.submitter.form)
        const cardSeq = formData.get("cardSeq");
        const event = new CustomEvent('delete', { detail: { cardSeq } });
        this.dispatchEvent(event);
    }

    handleSecurityCodeChange(event) {
        this._securityCode = event.detail.value
    }

    @api
    isValidSecurityCode() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (allValid) {
            return true
        }
        return false
    }

    @api
    getSecurityCode() {
        return this._securityCode
    }

    @api
    getCardSeq() {
        return this.item.CardSeq
    }

    get shortenCardNo(){
        return this.item.CardNo.slice(-5)
    }


}