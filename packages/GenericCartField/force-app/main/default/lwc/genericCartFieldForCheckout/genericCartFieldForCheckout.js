import { api, wire } from 'lwc';
import { CartSummaryAdapter } from 'commerce/cartApi';
import updateField from '@salesforce/apex/GenericCartFieldController.updateField';
import { CheckoutComponentBase } from 'commerce/checkoutApi';

export default class GenericCartFieldForCheckout extends CheckoutComponentBase {

    @api fieldApiName;
    @api label;
    @api placeHolder;
    @api isRequired;
    @api yes;
    @api no;

    CheckoutStage = {
        CHECK_VALIDITY_UPDATE: 'CHECK_VALIDITY_UPDATE',
        REPORT_VALIDITY_SAVE: 'REPORT_VALIDITY_SAVE',
        BEFORE_PAYMENT: 'BEFORE_PAYMENT',
        PAYMENT: 'PAYMENT',
        BEFORE_PLACE_ORDER: 'BEFORE_PLACE_ORDER',
        PLACE_ORDER: 'PLACE_ORDER',
    }

    _cartId
    _error
    _checkoutMode = 3
    _summarized = true;
    _readOnly = false;
    _isCheckMode = false

    @wire(CartSummaryAdapter)
    async cart({ data, error }) {
        if (data) {
            this._cartId = data.cartId;
        } else if (error) {
            console.error(error);
        }
    }


    get edit() {
        return this._isCheckMode ? (this._checkoutMode === 0 || this._checkoutMode === 1) : (!this._summarized && !this._readOnly);
    }

    get disabled() {
        return this._isCheckMode ? this._checkoutMode === 2 : (this._summarized || this._readOnly);
    }

    @api
    checkValidity() {
        const el = this.template.querySelector('c-generic-cart-field')
        return el.checkValidity();
    }

    /**
     * @type {CheckoutMode}
     * FUTURE, EDIT, DISABLED, SUMMARY, STENCIL
     * In JavaScript 0, 1, 2, 3, 4
     **/
    @api
    get checkoutMode() {
        return this._checkoutMode;
    }

    set checkoutMode(value) {
        this._isCheckMode = true;
        this._checkoutMode = value;
    }

    @api
    async checkoutSave() {
        try {
            this._error = null
            const el = this.template.querySelector('c-generic-cart-field')
            await updateField({
                cartId: this._cartId,
                fieldName: this.fieldApiName,
                value: el.getValue(),
                type: el.getType()
            })
        } catch (e) {
            console.error(e);
            this._error = e.message;
            throw new Error(this._error);
        }

    }

    @api
    reportValidity() {
        const el = this.template.querySelector('c-generic-cart-field')
        return el.checkValidity();
    }

    // override
    setAspect(newAspect) {
        console.log('setAspect', newAspect)
        this._readOnly = newAspect.readOnlyIfValid && this.checkValidity();
        this._summarized = newAspect.summary;
    }

    // override
    async stageAction(checkoutStage) {
        console.log('stageAction', checkoutStage)
        switch (checkoutStage) {
            case this.CheckoutStage.CHECK_VALIDITY_UPDATE:
                return this.checkValidity();
            case this.CheckoutStage.REPORT_VALIDITY_SAVE:
                if (!this.reportValidity()) {
                    return false
                }
                try {
                    await this.checkoutSave()
                    return true
                } catch (e) {
                    console.error(e);
                    this.dispatchUpdateErrorAsync({
                        groupId: 'Generic Cart Field Error',
                        type: '/commerce/errors/checkout-failure',
                        exception: e.message,
                    });
                    return false
                }
            default:
                return true
        }
    }


}