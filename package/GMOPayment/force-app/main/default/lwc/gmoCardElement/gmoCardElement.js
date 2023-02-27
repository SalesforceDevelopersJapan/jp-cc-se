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
import saveCard from '@salesforce/apex/GMOPaymentController.saveCard';
import saveMember from '@salesforce/apex/GMOPaymentController.saveMember';

export default class GmoCardElement extends LightningElement {

    _webstoreId
    _clientConfiguration
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
    async completePayment(_billingAddress) {
        try {
            this.errorMessage = ''
            let tokenOrCardSeq = ''
            const section = this.template.querySelector('c-gmo-card-element-container').getSection()
            if (section !== 'new') {
                tokenOrCardSeq = this.template.querySelector('c-gmo-card-element-card-list').getSelect()
                if (!tokenOrCardSeq) {
                    throw Error(GMOPayment_ErrorPleaseSelect)
                }
            } else {
                const isValidForm = this.template.querySelector('c-gmo-card-element-form').isValidForm();
                if (!isValidForm) {
                    throw Error(GMOPayment_ErrorInvalidCardForm)
                }
                const token = await this._getToken(1);
                if (this.template.querySelector('c-gmo-card-element-form').saveCard) {
                    const card = await this._saveCard(token.tokenObject.token[0]);
                    tokenOrCardSeq = card['CardSeq']
                } else {
                    tokenOrCardSeq = token.tokenObject.token[0]
                }
            }
            return {
                responseCode: tokenOrCardSeq
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
        const member = await saveMember()
        if ("ErrInfo" in member && !member['ErrInfo'].includes('E01390010')) {
            this._throwGMOError(member)
        }
        const card = await saveCard({ token })
        if ("ErrInfo" in card) {
            this._throwGMOError(card)
        }
        return card
    }

}