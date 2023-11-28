import { LightningElement, api } from 'lwc';
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
import OCI_INV_REG_CreateReservation from '@salesforce/label/c.OCI_INV_REG_CreateReservation';
import OCI_INV_REG_ReleaseReservation from '@salesforce/label/c.OCI_INV_REG_ReleaseReservation';
import OCI_INV_REG_FulfillReservation from '@salesforce/label/c.OCI_INV_REG_FulfillReservation';
import OCI_INV_REG_TransferReservation from '@salesforce/label/c.OCI_INV_REG_TransferReservation';

export default class OciInvRegInventoryList extends LightningElement {

    @api isLocationGroup = false
    @api location

    // Displayed Data
    inventories = [];
    title = "";

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
            , initialWidth: 150
        },
        { label: OCI_INV_REG_ATF, fieldName: 'availableToFulfill', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_ATO, fieldName: 'availableToOrder', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_Futures, fieldName: 'futures', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_OnHand, fieldName: 'onHand', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_Reserved, fieldName: 'reserved', type: 'number', editable: false, initialWidth: 120 },
        { label: OCI_INV_REG_SafetyStockCount, fieldName: 'safetyStockCount', type: 'number', editable: false, initialWidth: 120 },
    ];

    connectedCallback() {
        const actions = [
            { label: OCI_INV_REG_ShowFutures, name: 'show_futures' },
            { label: OCI_INV_REG_CreateReservation, name: 'create_reservation' },
            { label: OCI_INV_REG_ReleaseReservation, name: 'release_reservation' },
            { label: OCI_INV_REG_TransferReservation, name: 'transfer_reservation' },
        ];
        if (!this.isLocationGroup) {
            actions.push(
                { label: OCI_INV_REG_FulfillReservation, name: 'fulfill_reservation' },
                { label: OCI_INV_REG_Edit, name: 'edit' },
            )
        }
        this.inventoryColumns = [...this.inventoryColumns, {
            type: 'action',
            typeAttributes: { rowActions: actions },
        }]
        if (this.location) {
            this.title = this.location.locationIdentifier || this.location.locationGroupIdentifier || ""
            this.inventories = this._generateData();
        }
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
            case 'create_reservation':
                this._reservation(row, 'create');
                break;
            case 'fulfill_reservation':
                this._reservation(row, 'fulfill');
                break;
            case 'release_reservation':
                this._reservation(row, 'release');
                break;
            case 'transfer_reservation':
                this._reservation(row, 'transfer');
                break;
            default:
        }
    }

    _generateData() {
        return this.location ? this.location.inventoryRecords.map((i, idx) => {
            return {
                index: idx,
                availableToFulfill: i.availableToFulfill,
                availableToOrder: i.availableToOrder,
                effectiveDate: i.effectiveDate,
                futures: i.futures.reduce((sum, el) => { return sum + el.quantity }, 0),
                onHand: i.onHand,
                reserved: i.reserved,
                safetyStockCount: i.safetyStockCount,
                stockKeepingUnit: i.stockKeepingUnit,
                isLocationGroup: this.isLocationGroup,
                identifier: this.location.locationIdentifier || this.location.locationGroupIdentifier,
            };
        }) : [];
    }

    _edit(row) {
        const e = new CustomEvent('edit', { detail: { row, location: this.location } });
        this.dispatchEvent(e);
    }

    _showFutures(row) {
        const e = new CustomEvent('future', { detail: { row, location: this.location } });
        this.dispatchEvent(e);
    }

    _reservation(row, type) {
        const e = new CustomEvent('reservation', { detail: { row, inventory: this.inventories[row.index], type } });
        this.dispatchEvent(e);
    }

}