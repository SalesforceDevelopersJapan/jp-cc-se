import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import GMOPayment_TokenErrorCode100 from '@salesforce/label/c.GMOPayment_TokenErrorCode100';
import GMOPayment_TokenErrorCode101 from '@salesforce/label/c.GMOPayment_TokenErrorCode101';
import GMOPayment_TokenErrorCode102 from '@salesforce/label/c.GMOPayment_TokenErrorCode102';
import GMOPayment_TokenErrorCode110 from '@salesforce/label/c.GMOPayment_TokenErrorCode110';
import GMOPayment_TokenErrorCode111 from '@salesforce/label/c.GMOPayment_TokenErrorCode111';
import GMOPayment_TokenErrorCode112 from '@salesforce/label/c.GMOPayment_TokenErrorCode112';
import GMOPayment_TokenErrorCode113 from '@salesforce/label/c.GMOPayment_TokenErrorCode113';
import GMOPayment_TokenErrorCode121 from '@salesforce/label/c.GMOPayment_TokenErrorCode121';
import GMOPayment_TokenErrorCode122 from '@salesforce/label/c.GMOPayment_TokenErrorCode122';
import GMOPayment_TokenErrorCode131 from '@salesforce/label/c.GMOPayment_TokenErrorCode131';
import GMOPayment_TokenErrorCode132 from '@salesforce/label/c.GMOPayment_TokenErrorCode132';
import GMOPayment_TokenErrorUnknown from '@salesforce/label/c.GMOPayment_TokenErrorUnknown';
import GMOPayment_FormCardNumberTitle from '@salesforce/label/c.GMOPayment_FormCardNumberTitle';
import GMOPayment_FormCardNumberPH from '@salesforce/label/c.GMOPayment_FormCardNumberPH';
import GMOPayment_FormHolderNameTitle from '@salesforce/label/c.GMOPayment_FormHolderNameTitle';
import GMOPayment_FormHolderNamePH from '@salesforce/label/c.GMOPayment_FormHolderNamePH';
import GMOPayment_FormExpiryTitle from '@salesforce/label/c.GMOPayment_FormExpiryTitle';
import GMOPayment_FormExpiryPH from '@salesforce/label/c.GMOPayment_FormExpiryPH';
import GMOPayment_FormSecurityCodeTitle from '@salesforce/label/c.GMOPayment_FormSecurityCodeTitle';
import GMOPayment_FormSecurityCodePH from '@salesforce/label/c.GMOPayment_FormSecurityCodePH';



// import searchCard from '@salesforce/apex/GMOPaymentController.searchCard';
// import checkoutApi from 'commerce/checkoutApi';
// checkoutApi.paymentClientRequest(); should be available in the future.

export default class GmoCardElement extends LightningElement {

    _webstoreId
    _clientConfiguration
    _inputVal = {
        cardno: "",
        securitycode: "",
        expire: "",
        holdername: "",
    };
    // _savecard = false
    // _selectedCard = ""
    _card;
    errorMessage = ""
    errorMap = {
        "100": GMOPayment_TokenErrorCode100,
        "101": GMOPayment_TokenErrorCode101,
        "102": GMOPayment_TokenErrorCode102,
        "110": GMOPayment_TokenErrorCode110,
        "111": GMOPayment_TokenErrorCode111,
        "112": GMOPayment_TokenErrorCode112,
        "113": GMOPayment_TokenErrorCode113,
        "121": GMOPayment_TokenErrorCode121,
        "122": GMOPayment_TokenErrorCode122,
        "131": GMOPayment_TokenErrorCode131,
        "132": GMOPayment_TokenErrorCode132
    }
    label = {
        GMOPayment_FormCardNumberTitle,
        GMOPayment_FormCardNumberPH,
        GMOPayment_FormHolderNameTitle,
        GMOPayment_FormHolderNamePH,
        GMOPayment_FormExpiryTitle,
        GMOPayment_FormExpiryPH,
        GMOPayment_FormSecurityCodeTitle,
        GMOPayment_FormSecurityCodePH
    }


    @api
    async initialize(clientConfiguration, webstoreId) {
        this._webstoreId = webstoreId;
        this._clientConfiguration = clientConfiguration;
        this._card = this.template.querySelector('.card-form');
        await loadScript(this, this._clientConfiguration.gmoJsUrl);
        // When checkoutApi.paymentClientRequest() is available, search cards and make select list
        // const cards = await searchCard();
        // if ("ErrInfo" in cards === false) {
        //     console.log(this._makeCardList(cards))
        //     // make card select list
        // }
    }

    _makeCardList(cards) {
        const list = []
        for (let key in cards) {
            const val = cards[key]
            const vals = val.split("|")
            for (let idx in vals) {
                const add = { [key]: vals[idx] }
                list[idx] = list[idx] ? { ...list[idx], ...add } : { ...add }
            }
        }
        return list
    }

    _throwGMOError(reponse) {
        throw Error("[" + reponse.ErrCode + "]" + reponse.ErrInfo)
    }

    async _saveCard(token) {
        const card = await saveCard({ token })
        if ("ErrInfo" in card) {
            _throwGMOError(card)
        }
    }


    // このメソッド完了時にpostAuthorizePaymentが呼ばれる
    @api
    async completePayment(_billingAddress) {
        try {
            this.errorMessage = ""
            // When checkoutApi.paymentClientRequest() is available... 
            // const additionalData = {}
            // if user choose to save card pass second token to paymentData
            // if(this._savecard){
            //     const token = await this._getToken(2);
            //     const additionalData.savecardtoken = savecardtoken: token.tokenObject.token[0]
            // }
            // if user select thier card, pass card sequesnce number to paymentData
            // if(this._selectedCard){
            //     const additionalData.selectedCard = this._selectedCard
            // }
            // checkoutApi.paymentClientRequest(additionalData)
            const token = await this._getToken(1);
            const responseCode = token.tokenObject.token[0]
            return {
                responseCode
            }
        } catch (e) {
            this.errorMessage = e.message
            return {
                responseCode: "",
                error: {
                    message: e.message,
                    code: ""
                }
            }
        }
    }


    @api
    reportValidity() {
        return this._isValidForm();
    }

    @api
    focus() {
        if (this._card && this._card.focus) {
            this._card.focus();
        }
    }

    _isValidForm() {
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

    // variant = info (default), success, warning, and error
    _showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }


    async _getToken(number) {
        this._inputVal.tokennumber = number ? number : "1";
        // eslint-disable-next-line no-undef
        Multipayment.init(this._clientConfiguration.gmoShopId);
        return await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            Multipayment.getToken(this._inputVal, (response) => {
                if (response.resultCode != "000") {
                    if (response.resultCode in this.errorMap) {
                        return reject(new Error(this.errorMap[response.resultCode]))
                    }
                    reject(new Error(`${GMOPayment_TokenErrorUnknown} ${response.resultCode}`))
                } else {
                    resolve(response)
                }
            });
        })
    }

    handleCardNumberChange(event) {
        this._inputVal = { ...this._inputVal, cardno: event.detail.value }
    }

    handleHolderNameChange(event) {
        this._inputVal = { ...this._inputVal, holdername: event.detail.value }
    }

    handleExpireChange(event) {
        this._inputVal = { ...this._inputVal, expire: event.detail.value }
    }

    handleCVCChange(event) {
        this._inputVal = { ...this._inputVal, securitycode: event.detail.value }
    }

    // handleSaveCardChange(event) {
    //     this._savecard = event.detail.checked
    // }

    // handleCardChange(event) {
    //     this._selectedCard = event.detail.value
    // }

}