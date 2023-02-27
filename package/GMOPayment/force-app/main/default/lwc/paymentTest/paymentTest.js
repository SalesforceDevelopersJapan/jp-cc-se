import { LightningElement, api } from 'lwc';
import reversePayment from '@salesforce/apex/GMOPaymentController.reversePayment';
import capturePayment from '@salesforce/apex/GMOPaymentController.capturePayment';
import refundPayment from '@salesforce/apex/GMOPaymentController.refundPayment';

export default class PaymentTest extends LightningElement {


    @api
    orderSummaryId

    async handleReverse() {
        await reversePayment({ orderSummaryId: this.orderSummaryId })
    }

    async handleCapture() {
        await capturePayment({ orderSummaryId: this.orderSummaryId })
    }

    async handleRefund() {
        await refundPayment({ orderSummaryId: this.orderSummaryId })
    }

}