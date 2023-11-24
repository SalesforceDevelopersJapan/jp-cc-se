// eslint-disable-next-line no-undef
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
import GMOPayment_ErrorPleaseSelect from '@salesforce/label/c.GMOPayment_ErrorPleaseSelect';
import GMOPayment_ErrorInvalidCardForm from '@salesforce/label/c.GMOPayment_ErrorInvalidCardForm';
import GMOPayment_ErrorInvalidSecurityCode from '@salesforce/label/c.GMOPayment_ErrorInvalidSecurityCode';
import saveCard from '@salesforce/apex/GMOPaymentController.saveCard';
import { paymentClientRequest } from 'commerce/checkoutApi';
import { NavigationMixin } from 'lightning/navigation';


export default class GmoCardElement extends NavigationMixin(LightningElement) {

    _webstoreId
    _clientConfiguration
    processingCallback = false
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

    @api
    async initialize(clientConfiguration, webstoreId) {
        this._webstoreId = webstoreId;
        this._clientConfiguration = clientConfiguration;
        await loadScript(this, this._clientConfiguration.gmoJsUrl);
    }


    @api
    async completePayment(billingAddress) {
        try {
            this.errorMessage = ''
            let tokenOrCardSeq = ''
            let saveCardToken = '';
            let securityCode = '';

            const section = this.template.querySelector('c-gmo-card-element-container').getSection()
            if (section !== 'new') {
                const rowElement = this.template.querySelector('c-gmo-card-element-card-list').getSelectRow()
                if (!rowElement) {
                    throw Error(GMOPayment_ErrorPleaseSelect)
                }
                const isValidSecurityCode = rowElement.isValidSecurityCode()
                if (!isValidSecurityCode) {
                    throw Error(GMOPayment_ErrorInvalidSecurityCode)
                }
                tokenOrCardSeq = rowElement.getCardSeq()
                securityCode = rowElement.getSecurityCode()
            } else {
                const isValidForm = this.template.querySelector('c-gmo-card-element-form').isValidForm();
                if (!isValidForm) {
                    throw Error(GMOPayment_ErrorInvalidCardForm)
                }
                if (this.template.querySelector('c-gmo-card-element-form').saveCard) {
                    const token = await this._getToken(2);
                    tokenOrCardSeq = token.tokenObject.token[0]
                    saveCardToken = token.tokenObject.token[1]
                } else {
                    const token = await this._getToken(1);
                    tokenOrCardSeq = token.tokenObject.token[0]
                }
            }

            const result = await paymentClientRequest({ tokenOrCardSeq, securityCode, billingAddress: JSON.stringify(billingAddress) })

            if (saveCardToken) {
                try {
                    await this._saveCard(saveCardToken);
                } catch (e) {
                    // Do nothing. Even if saving card is failed, ignore it for not interrupt auth process.
                    console.error(e);
                }
            }

            if (result.paymentData['RedirectUrl']) {
                return await this[NavigationMixin.GenerateUrl]({
                    type: 'standard__webPage',
                    attributes: {
                        url: result.paymentData['RedirectUrl']
                    }
                }).then(generatedUrl => {
                    return new Promise((resolve) => {
                        const w = window.open(generatedUrl, "_self");
                        w.addEventListener('load', resolve, true);
                    });
                });
            }

            return {
                responseCode: result.paymentData['OrderID']
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
        return true
    }

    @api
    focus() {
        // Do nothing.
    }

    handleListRetrieved(event) {
        if (event.detail.isEmpty) {
            this.template.querySelector('c-gmo-card-element-container').hideSection('exist')
        }
    }

    _throwGMOError(reponse) {
        throw Error("[" + reponse.ErrCode + "]" + reponse.ErrInfo)
    }

    async _getToken(number) {
        const data = { ...this.template.querySelector('c-gmo-card-element-form').inputVal }
        data.tokennumber = number ? number : "1";
        Multipayment.init(this._clientConfiguration.gmoShopId);
        return await new Promise((resolve, reject) => {
            Multipayment.getToken(data, (response) => {
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

    async _saveCard(token) {
        const card = await saveCard({ token })
        if ("ErrInfo" in card) {
            this._throwGMOError(card)
        }
        return card
    }


}