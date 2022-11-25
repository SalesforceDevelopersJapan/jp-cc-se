import { LightningElement, api } from 'lwc';
import OCI_INV_REG_Close from '@salesforce/label/c.OCI_INV_REG_Close';
import OCI_INV_REG_Execute from '@salesforce/label/c.OCI_INV_REG_Execute';
import OCI_INV_REG_Waiting from '@salesforce/label/c.OCI_INV_REG_Waiting';

export default class OciInvRegModal extends LightningElement {

    label = {
        OCI_INV_REG_Waiting
    }

    isOpen = false;
    @api isLoading = false;
    @api title = "";
    @api disableCloseBtn = false;
    @api closeBtnText = OCI_INV_REG_Close;
    @api disableExecuteBtn = false;
    @api executeBtnText = OCI_INV_REG_Execute;

    @api
    close() {
        this.isOpen = false;
        const e = new CustomEvent('close');
        this.dispatchEvent(e);
    }

    onClose(){
        this.close()
    }

    @api
    open() {
        this.isOpen = true;
        const e = new CustomEvent('open');
        this.dispatchEvent(e);
    }

    @api
    execute() {
        const e = new CustomEvent('execute');
        this.dispatchEvent(e);
    }

}