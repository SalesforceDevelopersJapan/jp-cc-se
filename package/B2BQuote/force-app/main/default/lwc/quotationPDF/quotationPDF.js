import { LightningElement } from 'lwc';
import getPDF from '@salesforce/apex/QuotationPDFController.getPDF';
import isGuest from '@salesforce/user/isGuest';
import webstoreId from '@salesforce/webstore/Id'

export default class QuotationPDF extends LightningElement {
    

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

    async showPDF() {
        const data = await getPDF({ webstoreId, activeCartOrId: "active" });
        this.pdf = "data:application/pdf;base64," + data;
        const blob = this._toBlob(data, "application/pdf");
        const fileUrl = URL.createObjectURL(blob)
        window.open(fileUrl)
    }

    get isDisabled() {
        return !(webstoreId)
    }

    get isGuest() {
        return isGuest
    }

}