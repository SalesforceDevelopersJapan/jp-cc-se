import { LightningElement, api } from 'lwc';
import GMOPayment_ContainerNewCard from '@salesforce/label/c.GMOPayment_ContainerNewCard';
import GMOPayment_ContainerSavedCards from '@salesforce/label/c.GMOPayment_ContainerSavedCards';

export default class GmoCardElementContainer extends LightningElement {

    hideExist = false
    isExistChecked = false
    isNewChecked = true
    _isInitialized = false

    label = {
        GMOPayment_ContainerNewCard,
        GMOPayment_ContainerSavedCards,
    }

    renderedCallback() {
        if (this._isInitialized) {
            return
        }
        if (!this.hideExist) {
            this.isExistChecked = true
            this.isNewChecked = false
        }
        this._makeNewEnable()
        this._isInitialized = true
    }

    @api
    getSection() {
        return this.isNewChecked ? "new" : "exist"
    }

    @api
    setSection(section) {
        switch (section) {
            case "exist":
                this.isNewChecked = false
                this.isExistChecked = true
            default:
                this.isNewChecked = true
                this.isExistChecked = false
        }
        this._makeNewEnable()
    }

    @api
    hideSection(section) {
        switch (section) {
            case "exist":
                this.hideExist = true
                this.isNewChecked = true
                this.isExistChecked = false
            default:
            // Do nothing.
        }
        this._makeNewEnable()
    }

    handleNewCardCheckbox(event) {
        this.isNewChecked = event.detail.checked
        this.isExistChecked = !event.detail.checked
        this._makeNewEnable()
    }

    handleExistingCardCheckbox(event) {
        this.isNewChecked = !event.detail.checked
        this.isExistChecked = event.detail.checked
        this._makeNewEnable()
    }

    _makeNewEnable() {
        const newCardElement = this.template.querySelector('.new-card');
        if (this.isNewChecked && newCardElement) {
            newCardElement.classList.add("card-content-is-open")
        } else {
            newCardElement.classList.remove("card-content-is-open")
        }
        if (!this.hideExist) {
            const existCardElement = this.template.querySelector('.exist-card');
            if (this.isNewChecked && existCardElement) {
                existCardElement.classList.remove("card-content-is-open")
            } else {
                existCardElement.classList.add("card-content-is-open")
            }
        }

    }

}