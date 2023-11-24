import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { postAuthorizePayment, placeOrder } from 'commerce/checkoutApi';
import GMOPayment_Error3DSCheck from '@salesforce/label/c.GMOPayment_Error3DSCheck';
import GMOPayment_3DSCheckProcessing from '@salesforce/label/c.GMOPayment_3DSCheckProcessing';

export default class Gmo3dsPaymentCallback extends NavigationMixin(LightningElement) {

    processingCallback = false
    errorMessage

    label = {
        GMOPayment_3DSCheckProcessing
    }

    async connectedCallback() {
        const params = new URLSearchParams(window.location.search)
        if (params.has("OrderID")) {
            await this._callback(params.get("OrderID"))
        }
    }

    async _callback(orderId) {
        try {
            this.processingCallback = true
            this.errorMessage = ''
            await postAuthorizePayment('active', orderId);
            const order = await placeOrder();
            await this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: 'Order'
                },
                state: {
                    orderNumber: order["orderReferenceNumber"]
                }
            });
        } catch (e) {
            this.errorMessage = GMOPayment_Error3DSCheck
        } finally {
            this.processingCallback = false
        }
    }
}