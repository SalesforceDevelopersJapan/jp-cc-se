import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CartSummaryAdapter } from 'commerce/cartApi';
import getPDF from '@salesforce/apex/QuoteVFPDFController.getPDF';
import isGuest from '@salesforce/user/isGuest';
import webstoreId from '@salesforce/webstore/Id'
import Quote_GeneratePDFButton from '@salesforce/label/c.Quote_GeneratePDFButton';
import Quote_GeneratePDFFailed from '@salesforce/label/c.Quote_GeneratePDFFailed';
import LANG from '@salesforce/i18n/lang';

export default class QuoteVFPDF extends LightningElement {

    isGenerating = false
    cartId

    label = {
        Quote_GeneratePDFButton
    }

    @wire(CartSummaryAdapter)
    async cart({ data, error }) {
        if (data) {
            this.cartId = data.cartId;
        } else if (error) {
            console.log(error)
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
            const data = await getPDF({ webstoreId, activeCartOrId: "active", language: LANG });
            this.pdf = "data:application/pdf;base64," + data;
            const blob = this._toBlob(data, "application/pdf");
            const fileUrl = URL.createObjectURL(blob)
            window.open(fileUrl)
        } catch (e) {
            this._showToast(Quote_GeneratePDFFailed, e.message, "error")
        } finally {
            this.isGenerating = false
        }
    }

    get isDisabled() {
        return !(webstoreId) || this.isGenerating
    }

    get visible() {
        return !isGuest && this.cartId
    }

    get icon() {
        return this.isGenerating ? "utility:spinner" : "utility:pdf_ext"
    }
}