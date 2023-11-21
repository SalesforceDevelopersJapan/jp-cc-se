import { LightningElement, api } from 'lwc';
import getCustomField from '@salesforce/apex/GenericCartFieldController.getCustomField';
import getCurrentValue from '@salesforce/apex/GenericCartFieldController.getCurrentValue';

export default class GenericCartField extends LightningElement {

    _supportedTypes = {
        string: 'string',
        boolean: 'boolean',
        picklist: 'picklist',
        multipicklist: 'multipicklist',
        integer: 'integer',
        double: 'double',
        currency: 'currency',
        percent: 'percent',
        date: 'date',
        datetime: 'datetime',
        phone: 'phone',
        email: 'email',
        url: 'url',
        textarea: 'textarea',
        encryptedstring: 'encryptedstring'
    }

    @api fieldApiName;
    @api label;
    @api placeHolder;
    @api cartId;
    @api isRequired = false;
    @api disabled = false;
    @api editable = false;
    @api yes = 'Yes';
    @api no = 'No';

    _customField
    _type
    _value
    _multiValue = []

    get valueLabel() {
        switch (this._type) {
            case this._supportedTypes.multipicklist:
                return this._multiValue.map(v => this._customField.picklistValues[v]).join(", ")
            case this._supportedTypes.picklist:
                return this._customField.picklistValues[this._value]
            case this._supportedTypes.boolean:
                return this._value ? this.yes : this.no
            default:
                return this._value
        }
    }

    get variant() {
        return this.label ? "standard" : "label-hidden"
    }

    async connectedCallback() {
        const result = await Promise.all([
            getCustomField({ fieldName: this.fieldApiName }),
            getCurrentValue({ fieldName: this.fieldApiName, cartId: this.cartId })
        ])
        this._customField = result[0]
        const currentData = result[1]
        this._type = this._customField.type.toLocaleLowerCase()
        if (this.fieldApiName in currentData) {
            if (this._type === this._supportedTypes.multipicklist) {
                this._multiValue = currentData[this.fieldApiName].split(';')
            }
            else {
                this._value = currentData[this.fieldApiName]
            }
        }
    }

    get formatter() {
        switch (this._type) {
            case 'currency':
                return 'currency'
            case 'percent':
                return 'percent'
            case 'double':
                return 'decimal'
            default:
                return null
        }
    }

    get step() {
        return this._customField.scale ? 1 / Math.pow(10, this._customField.scale) : 1
    }

    get length() {
        return this._customField.length ? this._customField.length : null
    }

    get max() {
        return this._customField.precision ? Math.pow(10, this._customField.precision - this._customField.scale) - 1 : null
    }

    get required() {
        return this.isRequired
    }

    get typeCheck() {
        return {
            isString: this._type === this._supportedTypes.string,
            isBoolean: this._type === this._supportedTypes.boolean,
            isPicklist: this._type === this._supportedTypes.picklist,
            isMultiPicklist: this._type === this._supportedTypes.multipicklist,
            isNumber: this._type === this._supportedTypes.integer || this._type === this._supportedTypes.double || this._type === this._supportedTypes.currency || this._type === this._supportedTypes.percent,
            isDate: this._type === this._supportedTypes.date,
            isDateTime: this._type === this._supportedTypes.datetime,
            isPhone: this._type === this._supportedTypes.phone,
            isEmail: this._type === this._supportedTypes.email,
            isUrl: this._type === this._supportedTypes.url,
            isTextArea: this._type === this._supportedTypes.textarea,
            isEncryptedText: this._type === this._supportedTypes.encryptedstring
        }
    }


    get options() {
        const options = []
        if (!this._customField || !this._customField.picklistValues) {
            return options;
        }
        for (let key in this._customField.picklistValues) {
            if (Object.hasOwn(this._customField.picklistValues, key)) {
                options.push({
                    label: this._customField.picklistValues[key],
                    value: key
                })
            }
        }
        return options;
    }

    handleChange(event) {
        this._value = event.detail.value;
        this.dispatchEvent(
            new CustomEvent('fieldchange', {
                bubbles: true,
                cancelable: true,
                detail: {
                    value: this._value,
                    type: this._type
                },
            })
        );
    }

    handleCheckboxChange(event) {
        this._value = event.detail.checked;
        this.dispatchEvent(
            new CustomEvent('fieldchange', {
                bubbles: true,
                cancelable: true,
                detail: {
                    value: this._value,
                    type: this._type
                },
            })
        );
    }

    handleCheckboxGroupChange(event) {
        this._multiValue = event.detail.value;
        this.dispatchEvent(
            new CustomEvent('fieldchange', {
                bubbles: true,
                cancelable: true,
                detail: {
                    value: this._multiValue,
                    type: this._type
                },
            })
        );
    }


    @api
    checkValidity() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-combobox'),
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-checkbox-group'),
            ...this.template.querySelectorAll('lightning-textarea'),
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
    getValue() {
        return this._type === this._supportedTypes.multipicklist ? this._multiValue.join(";") : this._value
    }

    @api
    getType() {
        return this._type
    }

    @api
    getSupportedTypes() {
        return this._supportedTypes
    }
}