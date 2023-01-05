import { LightningElement, wire } from 'lwc';
import getPDF from '@salesforce/apex/QuotationPDFController.getPDF';
import { CartSummaryAdapter } from 'commerce/cartApi';
import isGuest from '@salesforce/user/isGuest';

export default class QuotationPDF extends LightningElement {

    accountId = "";
    cartId = "";
    webstoreId = "";

    @wire(CartSummaryAdapter)
    cartSummaryHandler(response) {
        if (response.data) {
            console.log(response)
            this.accountId = response.data.accountId
            this.cartId = response.data.cartId
            this.webstoreId = response.data.webstoreId
        } else {
            console.log("No data")
        }
    }

    _toBlob(base64, mime_ctype) {
        // 日本語の文字化けに対処するためBOMを作成する。
        var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
 
        var bin = atob(base64.replace(/^.*,/, ''));
        var buffer = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) {
            buffer[i] = bin.charCodeAt(i);
        }
        // Blobを作成
        try {
            var blob = new Blob([bom, buffer.buffer], {
                type: mime_ctype,
            });
        } catch (e) {
            return false;
        }
        return blob;
    }

    async showPDF(){
        const data = await getPDF();
        this.pdf = "data:application/pdf;base64," + data;
        const blob = this._toBlob(data, "application/pdf");
        this.pdf = URL.createObjectURL(blob)
        window.open(fileUrl)
    }

    get isDisabled() {
        return !(this.accountId && this.cartId && this.webstoreId)
    }

    get isGuest() {
        return isGuest
    }

}