import { LightningElement, api } from 'lwc';

export default class QuantityInput extends LightningElement {
    @api productId
    @api defaultQuantity
    @api index


    onQuantityChange(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('quantitychange', {
            detail: {
                quantity: this.quantity = this.template.querySelector('input').value,
                productId: this.productId,
                index: this.index
            }
        }))
    }

    @api
    getQuantity() {
        return this.template.querySelector('input').value
    }

}