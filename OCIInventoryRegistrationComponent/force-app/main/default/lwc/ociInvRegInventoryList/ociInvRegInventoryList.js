import { LightningElement, api, track } from 'lwc';
import getInventoryAvailabilityUploadStatus from '@salesforce/apex/OciInvRegController.getInventoryAvailabilityUploadStatus';
import { showToast, printFormat } from 'c/ociInvRegUtils'
import OCI_INV_REG_ExpectedDate from '@salesforce/label/c.OCI_INV_REG_ExpectedDate';
import OCI_INV_REG_Quantity from '@salesforce/label/c.OCI_INV_REG_Quantity';
import OCI_INV_REG_ATF from '@salesforce/label/c.OCI_INV_REG_ATF';
import OCI_INV_REG_ATO from '@salesforce/label/c.OCI_INV_REG_ATO';
import OCI_INV_REG_EffectiveDate from '@salesforce/label/c.OCI_INV_REG_EffectiveDate';
import OCI_INV_REG_Futures from '@salesforce/label/c.OCI_INV_REG_Futures';
import OCI_INV_REG_OnHand from '@salesforce/label/c.OCI_INV_REG_OnHand';
import OCI_INV_REG_Reserved from '@salesforce/label/c.OCI_INV_REG_Reserved';
import OCI_INV_REG_SafetyStockCount from '@salesforce/label/c.OCI_INV_REG_SafetyStockCount';
import OCI_INV_REG_SKU from '@salesforce/label/c.OCI_INV_REG_SKU';
import OCI_INV_REG_ShowFutures from '@salesforce/label/c.OCI_INV_REG_ShowFutures';
import OCI_INV_REG_Edit from '@salesforce/label/c.OCI_INV_REG_Edit';
import OCI_INV_REG_RequestJobFails from '@salesforce/label/c.OCI_INV_REG_RequestJobFails';
import OCI_INV_REG_RequestJobCompleted from '@salesforce/label/c.OCI_INV_REG_RequestJobCompleted';
import OCI_INV_REG_RequestJobOther from '@salesforce/label/c.OCI_INV_REG_RequestJobOther';
import OCI_INV_REG_NoFuture from '@salesforce/label/c.OCI_INV_REG_NoFuture';

export default class OciInvRegInventoryList extends LightningElement {

    label = {
        OCI_INV_REG_NoFuture,
        OCI_INV_REG_Futures
    }

    @api isLocationGroup = false
    @track inventories = [];
    @track selectedInventory = null;
    @track futures = []
    @track selectedFutures = []
    id = "";
    title = "";
    rowOffset = 0;
    futureColumns = [
        {
            label: OCI_INV_REG_ExpectedDate, fieldName: 'expectedDate', type: 'date', editable: false,
            typeAttributes: {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        },
        { label: OCI_INV_REG_Quantity, fieldName: 'quantity', type: 'number', editable: false, initialWidth: 150 },
    ];
    inventoryColumns = [
        { label: OCI_INV_REG_SKU, fieldName: 'stockKeepingUnit', type: 'text', editable: false },
        {
            label: OCI_INV_REG_EffectiveDate, fieldName: 'effectiveDate', type: 'date',
            typeAttributes: {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
            , editable: false
        },
        { label: OCI_INV_REG_ATF, fieldName: 'availableToFulfill', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_ATO, fieldName: 'availableToOrder', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_Futures, fieldName: 'futures', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_OnHand, fieldName: 'onHand', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_Reserved, fieldName: 'reserved', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_SafetyStockCount, fieldName: 'safetyStockCount', type: 'number', editable: false, initialWidth: 120 },

    ];
    locationVal = null

    @api
    get location() {
        return this.locationVal;
    }

    set location(val) {
        if (val) {
            this.locationVal = val
            this.id = this.locationVal.locationIdentifier || this.locationVal.locationGroupIdentifier || ""
            this.title = this.locationVal.locationIdentifier || this.locationVal.locationGroupIdentifier || ""
            this.inventories = this._generateData();
            this.futures = this._generateFutures();
        }
    }

    get hasFutures() {
        return this.selectedFutures && this.selectedFutures.length > 0
    }

    connectedCallback() {
        const actions = [{ label: OCI_INV_REG_ShowFutures, name: 'show_futures' }];
        if (!this.isLocationGroup) {
            actions.push(
                { label: OCI_INV_REG_Edit, name: 'edit' }
            )
        }
        this.inventoryColumns = [...this.inventoryColumns, {
            type: 'action',
            typeAttributes: { rowActions: actions },
        }]
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'edit':
                this._edit(row);
                break;
            case 'show_futures':
                this._showFutures(row);
                break;
            default:
        }
    }

    async handleExecute(event) {
        const uploadId = event.detail.uploadId
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        const sleep = (n) => new Promise((resolve) => setTimeout(resolve, n));
        const process = async (id) => {
            const { status } = await getInventoryAvailabilityUploadStatus({ uploadId: id });
            return status;
        };
        let status = "SUBMITTED";
        while (
            status === "RUNNING" ||
            status === "SUBMITTED" ||
            status === "STAGING" ||
            status === "PENDING"
        ) {
            // eslint-disable-next-line no-await-in-loop
            await sleep(3000);
            // eslint-disable-next-line no-await-in-loop
            status = await process(uploadId);
        }
        switch (status) {
            case 'FAILED':
                showToast(this, "FAILED", OCI_INV_REG_RequestJobFails, "error")
                break;
            case 'COMPLETED':
                showToast(this, "COMPLETED", OCI_INV_REG_RequestJobCompleted, "success")
                break;
            default:
                showToast(this, status, printFormat(OCI_INV_REG_RequestJobOther, status), "warning")
        }
    }

    _generateData() {
        return this.locationVal ? this.locationVal.inventoryRecords.map((i, idx) => {
            return {
                index: idx,
                availableToFulfill: i.availableToFulfill,
                availableToOrder: i.availableToOrder,
                effectiveDate: i.effectiveDate,
                futures: i.futures.reduce((sum, el) => { return sum + el.quantity }, 0),
                onHand: i.onHand,
                reserved: i.reserved,
                safetyStockCount: i.safetyStockCount,
                stockKeepingUnit: i.stockKeepingUnit
            };
        }) : [];
    }

    _generateFutures() {
        return this.locationVal ? this.locationVal.inventoryRecords.map((i) => {
            return i.futures
        }) : [];
    }

    _edit(row) {
        const { index } = row;
        if (index !== -1) {
            this.selectedInventory = { ...this.location.inventoryRecords[index] };
            this.template.querySelector('c-oci-inv-reg-location-update-form-modal').open();
        }
    }

    _showFutures(row) {
        const { index } = row;
        if (index !== -1) {
            this.selectedFutures = this.futures[index];
            this.template.querySelector('c-oci-inv-reg-modal.futures').open();
        }

    }



}