import { LightningElement, api } from 'lwc';
import GMOPayment_FormCardNumberTitle from '@salesforce/label/c.GMOPayment_FormCardNumberTitle';
import GMOPayment_FormCardNumberPH from '@salesforce/label/c.GMOPayment_FormCardNumberPH';
import GMOPayment_FormHolderNameTitle from '@salesforce/label/c.GMOPayment_FormHolderNameTitle';
import GMOPayment_FormHolderNamePH from '@salesforce/label/c.GMOPayment_FormHolderNamePH';
import GMOPayment_FormExpiryTitle from '@salesforce/label/c.GMOPayment_FormExpiryTitle';
import GMOPayment_FormExpiryPH from '@salesforce/label/c.GMOPayment_FormExpiryPH';
import GMOPayment_FormSecurityCodeTitle from '@salesforce/label/c.GMOPayment_FormSecurityCodeTitle';
import GMOPayment_FormSecurityCodePH from '@salesforce/label/c.GMOPayment_FormSecurityCodePH';
import GMOPayment_FormSaveThisCard from '@salesforce/label/c.GMOPayment_FormSaveThisCard';

export default class GmoCardElementForm extends LightningElement {

    @api
    inputVal = {
        cardno: "",
        securitycode: "",
        expire: "",
        holdername: "",
    };

    @api
    saveCard = false

    label = {
        GMOPayment_FormCardNumberTitle,
        GMOPayment_FormCardNumberPH,
        GMOPayment_FormHolderNameTitle,
        GMOPayment_FormHolderNamePH,
        GMOPayment_FormExpiryTitle,
        GMOPayment_FormExpiryPH,
        GMOPayment_FormSecurityCodeTitle,
        GMOPayment_FormSecurityCodePH,
        GMOPayment_FormSaveThisCard
    }


    handleCardNumberChange(event) {
        this.inputVal = { ...this.inputVal, cardno: event.detail.value }
    }

    handleHolderNameChange(event) {
        this.inputVal = { ...this.inputVal, holdername: event.detail.value }
    }

    handleExpireChange(event) {
        this.inputVal = { ...this.inputVal, expire: event.detail.value }
    }

    handleCVCChange(event) {
        this.inputVal = { ...this.inputVal, securitycode: event.detail.value }
    }

    handleSaveCardChange(event) {
        this.saveCard = event.detail.checked
    }

    @api
    isValidForm() {
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
}