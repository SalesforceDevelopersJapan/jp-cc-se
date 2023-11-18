import { api, LightningElement } from 'lwc';
import getPDF from '@salesforce/apex/JapanTaxInvoiceVFPDFController.getPDF';
import JPTax_PDFDownloadButton from '@salesforce/label/c.JPTax_PDFDownloadButton';
import LANG from '@salesforce/i18n/lang';

export default class JPTaxExperiencePDFButton extends LightningElement {
    @api orderSummaryId;
    isGenerating = false
    label = {
        JPTax_PDFDownloadButton
    }

    async showPDF() {
        try {
            this.isGenerating = true
            const data = await getPDF({ orderSummaryId: this.orderSummaryId, language: LANG });
            this.pdf = "data:application/pdf;base64," + data;
            const blob = this._toBlob(data, "application/pdf");
            const fileUrl = URL.createObjectURL(blob)
            window.open(fileUrl)
        } finally {
            this.isGenerating = false
        }
    }

    _toBlob(base64, mime_ctype) {
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        var bin = atob(base64.replace(/^.*,/, ''));
        var buffer = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            buffer[i] = bin.charCodeAt(i);
        }
        try {
            return new Blob([bom, buffer.buffer], {
                type: mime_ctype,
            });
        } catch (e) {
            return false;
        }
    }

    get icon() {
        return this.isGenerating ? "utility:spinner" : "utility:pdf_ext"
    }
}