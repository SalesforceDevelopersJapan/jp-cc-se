import { api, LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import JPTax_PDFDownloadButton from '@salesforce/label/c.JPTax_PDFDownloadButton';
import LANG from '@salesforce/i18n/lang';

export default class JPTaxPlatformPDFButton extends NavigationMixin(LightningElement) {
    @api recordId;
    isGenerating = false
    label = {
        JPTax_PDFDownloadButton
    }

    async showPDF() {
        this.isGenerating = true
        const generatedUrl = await this[NavigationMixin.GenerateUrl]({
            type: 'standard__webPage',
            attributes: {
                url: `/apex/JapanTaxInvoiceVFPDF?orderSummaryId=${this.recordId}&language=${LANG}`
            }
        })
        window.open(generatedUrl);
        this.isGenerating = false
    }


    get icon() {
        return this.isGenerating ? "utility:spinner" : "utility:pdf_ext"
    }
}