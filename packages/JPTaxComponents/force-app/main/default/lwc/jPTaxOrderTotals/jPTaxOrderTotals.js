import { api, LightningElement } from 'lwc';
import getOrderSummaryTotals from '@salesforce/apex/JapanTaxController.getOrderSummaryTotals';
import JPTax_TotalsTotal from '@salesforce/label/c.JPTax_TotalsTotal';
import JPTax_TotalsOtherTaxAdjustment from '@salesforce/label/c.JPTax_TotalsOtherTaxAdjustment';
import JPTax_TotalsTaxTotal from '@salesforce/label/c.JPTax_TotalsTaxTotal';
import JPTax_Totals10PercentTaxBasis from '@salesforce/label/c.JPTax_Totals10PercentTaxBasis';
import JPTax_Totals10PercentTaxTotal from '@salesforce/label/c.JPTax_Totals10PercentTaxTotal';
import JPTax_Totals8PercentTaxBasis from '@salesforce/label/c.JPTax_Totals8PercentTaxBasis';
import JPTax_Totals8PercentTaxTotal from '@salesforce/label/c.JPTax_Totals8PercentTaxTotal';
import JPTax_TotalsShippingSubtotal from '@salesforce/label/c.JPTax_TotalsShippingSubtotal';
import JPTax_TotalsProductSubtotal from '@salesforce/label/c.JPTax_TotalsProductSubtotal';
import JPTax_TotalsTitle from '@salesforce/label/c.JPTax_TotalsTitle';

export default class JPTaxOrderTotals extends LightningElement {
    @api orderSummaryId;
    isDataLoaded = false;
    data;
    label = {
        JPTax_TotalsTotal,
        JPTax_TotalsOtherTaxAdjustment,
        JPTax_TotalsTaxTotal,
        JPTax_Totals10PercentTaxBasis,
        JPTax_Totals10PercentTaxTotal,
        JPTax_Totals8PercentTaxBasis,
        JPTax_Totals8PercentTaxTotal,
        JPTax_TotalsShippingSubtotal,
        JPTax_TotalsProductSubtotal,
        JPTax_TotalsTitle
    }

    async connectedCallback() {
        this.isDataLoaded = false;
        this.data = await getOrderSummaryTotals({ orderSummaryId: this.orderSummaryId });
        this.isDataLoaded = true;
    }

    get eightPercentTax() {
        return this.data && this.data.summary.taxByRate['8'] ? this.data.summary.taxByRate['8'].taxAmount : 0;
    }

    get tenPercentTax() {
        return this.data && this.data.summary.taxByRate['10'] ? this.data.summary.taxByRate['10'].taxAmount : 0;
    }

}