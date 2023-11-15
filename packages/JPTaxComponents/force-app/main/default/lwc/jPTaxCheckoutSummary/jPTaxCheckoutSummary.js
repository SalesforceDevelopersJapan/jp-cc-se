import { LightningElement, wire } from 'lwc';
import { CartSummaryAdapter } from 'commerce/cartApi';
import getCartTaxMap from '@salesforce/apex/JapanTaxController.getCartTaxMap';
import JPTax_CheckoutSummarySubtotal from '@salesforce/label/c.JPTax_CheckoutSummarySubtotal';
import JPTax_CheckoutSummaryPromotion from '@salesforce/label/c.JPTax_CheckoutSummaryPromotion';
import JPTax_CheckoutSummaryShipping from '@salesforce/label/c.JPTax_CheckoutSummaryShipping';
import JPTax_CheckoutSummaryTaxByRate from '@salesforce/label/c.JPTax_CheckoutSummaryTaxByRate';
import JPTax_CheckoutSummaryTaxTotal from '@salesforce/label/c.JPTax_CheckoutSummaryTaxTotal';
import JPTax_CheckoutSummaryTotal from '@salesforce/label/c.JPTax_CheckoutSummaryTotal';

export default class JPTaxCheckoutSummary extends LightningElement {

    currencyCode
    cartTotals
    taxRateList = []

    labels = {
        JPTax_CheckoutSummarySubtotal,
        JPTax_CheckoutSummaryPromotion,
        JPTax_CheckoutSummaryShipping,
        JPTax_CheckoutSummaryTaxByRate,
        JPTax_CheckoutSummaryTaxTotal,
        JPTax_CheckoutSummaryTotal
    }

    @wire(CartSummaryAdapter)
    async cartSummary({ data }) {
        if (data) {
            this.cartTotals = data
            this.currencyCode = data.currencyIsoCode
            const taxRateMap = await getCartTaxMap({ cartId: data.cartId })
            this.taxRateList = Object.keys(taxRateMap).map(key => {
                return { key, value: taxRateMap[key] }
            });
        }
    }
}