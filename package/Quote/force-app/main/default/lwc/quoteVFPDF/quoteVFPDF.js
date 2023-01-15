import { LightningElement } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPDF from '@salesforce/apex/QuoteVFPDFController.getPDF';
import isGuest from '@salesforce/user/isGuest';
import webstoreId from '@salesforce/webstore/Id'

export default class QuoteVFPDF extends LightningElement {

    isGenerating = false

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

    // variant = info (default), success, warning, and error
    _showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    async showPDF() {
        try {
            this.isGenerating = true
            const data = await getPDF({ webstoreId, activeCartOrId: "active" });
            this.pdf = "data:application/pdf;base64," + data;
            const blob = this._toBlob(data, "application/pdf");
            const fileUrl = URL.createObjectURL(blob)
            window.open(fileUrl)
        } catch (e) {
            this._showToast("Generating PDF was faild.", e.message, "error")
        } finally {
            this.isGenerating = false
        }
    }

    get isDisabled() {
        return !(webstoreId) || this.isGenerating
    }

    get isGuest() {
        return isGuest
    }

    get icon() {
        return this.isGenerating ? "utility:spinner" : "utility:pdf_ext"
    }
}