import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
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

    async _saveCard(token){
        const card = await saveCard({ token })
        if ("ErrInfo" in card) {
            _throwGMOError(card)
        }
    }


    // このメソッド完了時にpostAuthorizePaymentが呼ばれる
    @api
    async completePayment(_billingAddress) {
        try {
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
            console.error(e)
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


    async _getToken(number) {
        this._inputVal.tokennumber = number ? number : "1";
        // eslint-disable-next-line no-undef
        Multipayment.init(this._clientConfiguration.gmoShopId);
        return await new Promise((resolve, reject) => {
            // eslint-disable-next-line no-undef
            Multipayment.getToken(this._inputVal, (response) => {
                if (response.resultCode != "000") {
                    reject(response)
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