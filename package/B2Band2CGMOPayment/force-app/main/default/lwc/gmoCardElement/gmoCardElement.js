import { LightningElement, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
// import saveCard from '@salesforce/apex/GMOPaymentAdapter.saveCard';
// import entryTransaction from '@salesforce/apex/GMOPaymentAdapter.entryTransaction';
import searchCard from '@salesforce/apex/GMOPaymentAdapter.searchCard';
import saveMember from '@salesforce/apex/GMOPaymentAdapter.saveMember';
import searchMember from '@salesforce/apex/GMOPaymentAdapter.searchMember';
// import contextApi from 'commerce/contextApi';
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
    _savecard = false
    _card;


    @api
    async initialize(clientConfiguration, webstoreId) {
        this._webstoreId = webstoreId;
        this._clientConfiguration = clientConfiguration;
        this._card = this.template.querySelector('.card-form');
        await loadScript(this, this._clientConfiguration.gmoJsUrl);
        const cards = await searchCard();
        if ("ErrInfo" in cards === false) {
            console.log(this._makeCardList(cards))
        }
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


    // このメソッド完了時にpostAuthorizePaymentが呼ばれる
    @api
    async completePayment(_billingAddress) {
        try {
            let member = await searchMember();
            if ("ErrInfo" in member) {
                if (member.ErrInfo.includes("E01390002")) {
                    // If member does not exist, save member.
                    member = await saveMember();
                    if ("ErrInfo" in member) {
                        _throwGMOError(member)
                    }
                } else {
                    _throwGMOError(member)
                }
            }
            let responseCode;
            let token;
            if (this._savecard) {
                token = await this._getToken(2);
                // const card = await saveCard({ token: token.tokenObject.token[0] })
                // if ("ErrInfo" in card) {
                //     _throwGMOError(card)
                // }
                responseCode = token.tokenObject.token[1]
            } else {
                token = await this._getToken(1);
                responseCode = token.tokenObject.token[0]
            }


            // const { default: csrfToken } = await import('@app/csrfToken');
            // const context = await contextApi.getAppContext()
            // context.webstoreId


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

    handleSaveCardChange(event) {
        this._savecard = event.detail.checked
    }

}