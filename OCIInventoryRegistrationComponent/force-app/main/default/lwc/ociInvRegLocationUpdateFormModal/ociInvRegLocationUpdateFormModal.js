import { LightningElement, api } from 'lwc';
import uploadInventoryAvailability from '@salesforce/apex/OciInvRegController.uploadInventoryAvailability';
import { showToast } from 'c/ociInvRegUtils'
import OCI_INV_REG_ExpectedDate from '@salesforce/label/c.OCI_INV_REG_ExpectedDate';
import OCI_INV_REG_Quantity from '@salesforce/label/c.OCI_INV_REG_Quantity';
import OCI_INV_REG_Delete from '@salesforce/label/c.OCI_INV_REG_Delete';
import OCI_INV_REG_RequestInventoryAvailabilitySuccess from '@salesforce/label/c.OCI_INV_REG_RequestInventoryAvailabilitySuccess';
import OCI_INV_REG_RequestFail from '@salesforce/label/c.OCI_INV_REG_RequestFail';
import OCI_INV_REG_RequestSuccess from '@salesforce/label/c.OCI_INV_REG_RequestSuccess';
import OCI_INV_REG_Request from '@salesforce/label/c.OCI_INV_REG_Request';
import OCI_INV_REG_Edit from '@salesforce/label/c.OCI_INV_REG_Edit';
import OCI_INV_REG_NoData from '@salesforce/label/c.OCI_INV_REG_NoData';
import OCI_INV_REG_OnHand from '@salesforce/label/c.OCI_INV_REG_OnHand';
import OCI_INV_REG_SafetyStockCount from '@salesforce/label/c.OCI_INV_REG_SafetyStockCount';
import OCI_INV_REG_EffectiveDate from '@salesforce/label/c.OCI_INV_REG_EffectiveDate';
import OCI_INV_REG_Add from '@salesforce/label/c.OCI_INV_REG_Add';


export default class OciInvRegLocationUpdateFormModal extends LightningElement {

    label = {
        OCI_INV_REG_Request,
        OCI_INV_REG_Edit,
        OCI_INV_REG_NoData,
        OCI_INV_REG_OnHand,
        OCI_INV_REG_SafetyStockCount,
        OCI_INV_REG_EffectiveDate,
        OCI_INV_REG_Add
    }

    @api locationIdentifier = null

    // Displayed Data
    futures = []
    inventoryVal = null

    // UI State
    isSubmitting = false

    futureColumns = [
        {
            label: OCI_INV_REG_ExpectedDate, fieldName: 'expectedDate', typeAttributes: {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }, type: 'date', editable: true
        },
        { label: OCI_INV_REG_Quantity, fieldName: 'quantity', type: 'number', editable: true, initialWidth: 150 },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: OCI_INV_REG_Delete, name: 'delete' },
                ]
            },
        }
    ];
    
    get ready() {
        return !!this.inventoryVal
    }

    @api
    get inventory() {
        return this.inventoryVal;
    }

    set inventory(value) {
        if (value) {
            this.inventoryVal = value;
            this.futures = this._generateFutures();
        }
    }

    @api
    open() {
        this.template.querySelector('c-oci-inv-reg-modal.edit-form').open();
    }

    @api
    close() {
        this.template.querySelector('c-oci-inv-reg-modal.edit-form').close();
    }

    handleFutureChange(event) {
        this.futures = this.futures.map(f => {
            const found = event.detail.draftValues.map(d => {
                if (d.quantity) {
                    d.quantity = Number(d.quantity)
                }
                return d;
            }).find(d => d.indexStr === f.indexStr)
            return found ? { ...f, ...found } : f
        })
    }

    handleOnHandChange(event) {
        this.inventoryVal = { ...this.inventoryVal, onHand: event.detail.value }
    }

    handleEffectivedateChange(event) {
        this.inventoryVal = { ...this.inventoryVal, effectiveDate: event.detail.value }
    }

    handleSSCChange(event) {
        event.preventDefault();
        this.inventoryVal = { ...this.inventoryVal, safetyStockCount: event.detail.value }
    }

    handleFutureClick(event) {
        // This methos is just for prevent default event. 
        event.preventDefault();
    }

    addFuture() {
        this.futures = this.futures.concat([{
            indexStr: String(this.futures.length),
            quantity: 0,
            expectedDate: new Date().toISOString()
        }])
    }

    handleFutureRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'delete':
                this._deleteFuture(row);
                break;
            default:
        }
    }

    async handleExecute() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (!allValid) {
            return
        }
        const request = {
            onHand: Number(this.inventoryVal.onHand),
            safetyStockCount: Number(this.inventoryVal.safetyStockCount),
            sku: this.inventoryVal.stockKeepingUnit,
            effectiveDate: this.inventoryVal.effectiveDate,
            futures: this.futures,
            locationId: this.locationIdentifier
        }
        try {
            this.isSubmitting = true
            const res = await uploadInventoryAvailability({ request, locationId: this.locationIdentifier })
            const e = new CustomEvent('execute', { detail: { uploadId: res.uploadId } });
            this.dispatchEvent(e);
            showToast(this, OCI_INV_REG_RequestSuccess, OCI_INV_REG_RequestInventoryAvailabilitySuccess, "success")
        } catch (e) {
            showToast(this, OCI_INV_REG_RequestFail, e.message, "error")
        } finally {
            this.isSubmitting = false
            this.close();
        }
    }

    _generateFutures() {
        return this.inventoryVal ? this.inventoryVal.futures.map((f, i) => {
            return { ...f, indexStr: String(i) }
        }) : [];
    }

    _deleteFuture(row) {
        const { indexStr } = row;
        this.futures.splice(Number(indexStr), 1)
        this.futures = this.futures.map((f, i) => {
            return { ...f, indexStr: String(i) }
        })
    }

}