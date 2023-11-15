import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { postAuthorizePayment, placeOrder } from 'commerce/checkoutApi';
import check3DResult from '@salesforce/apex/GMOPaymentController.check3DResult';
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
        if (params.has("AccessID")) {
            await this._callback(params.get("AccessID"))
        }
    }

    async _callback(accessID) {
        try {
            this.processingCallback = true
            this.errorMessage = ''
            const result = await check3DResult({ accessID })
            await postAuthorizePayment('active', result["OrderID"], JSON.parse(result["BillingAddressJsonStr"]));
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