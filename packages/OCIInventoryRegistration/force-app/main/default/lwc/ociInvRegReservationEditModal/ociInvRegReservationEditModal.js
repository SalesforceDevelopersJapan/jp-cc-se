import { LightningElement, api } from 'lwc';
import getUUID from '@salesforce/apex/OciInvRegController.getUUID';
import releaseReservation from '@salesforce/apex/OciInvRegController.releaseReservation';
import fulfillReservation from '@salesforce/apex/OciInvRegController.fulfillReservation';
import createReservation from '@salesforce/apex/OciInvRegController.createReservation';
import transferReservation from '@salesforce/apex/OciInvRegController.transferReservation';
import { showToast } from 'c/ociInvRegUtils'
import OCI_INV_REG_ATF from '@salesforce/label/c.OCI_INV_REG_ATF';
import OCI_INV_REG_ATO from '@salesforce/label/c.OCI_INV_REG_ATO';
import OCI_INV_REG_EffectiveDate from '@salesforce/label/c.OCI_INV_REG_EffectiveDate';
import OCI_INV_REG_Futures from '@salesforce/label/c.OCI_INV_REG_Futures';
import OCI_INV_REG_OnHand from '@salesforce/label/c.OCI_INV_REG_OnHand';
import OCI_INV_REG_Reserved from '@salesforce/label/c.OCI_INV_REG_Reserved';
import OCI_INV_REG_SafetyStockCount from '@salesforce/label/c.OCI_INV_REG_SafetyStockCount';
import OCI_INV_REG_SKU from '@salesforce/label/c.OCI_INV_REG_SKU';
import OCI_INV_REG_LocationGroup from '@salesforce/label/c.OCI_INV_REG_LocationGroup';
import OCI_INV_REG_Locations from '@salesforce/label/c.OCI_INV_REG_Locations';
import OCI_INV_REG_Quantity from '@salesforce/label/c.OCI_INV_REG_Quantity';
import OCI_INV_REG_CreateReservation from '@salesforce/label/c.OCI_INV_REG_CreateReservation';
import OCI_INV_REG_ReleaseReservation from '@salesforce/label/c.OCI_INV_REG_ReleaseReservation';
import OCI_INV_REG_FulfillReservation from '@salesforce/label/c.OCI_INV_REG_FulfillReservation';
import OCI_INV_REG_TransferReservation from '@salesforce/label/c.OCI_INV_REG_TransferReservation';
import OCI_INV_REG_ExpirationSeconds from '@salesforce/label/c.OCI_INV_REG_ExpirationSeconds';
import OCI_INV_REG_ReservationTime from '@salesforce/label/c.OCI_INV_REG_ReservationTime';
import OCI_INV_REG_AllowPartialReservations from '@salesforce/label/c.OCI_INV_REG_AllowPartialReservations';
import OCI_INV_REG_AllOrNothing from '@salesforce/label/c.OCI_INV_REG_AllOrNothing';
import OCI_INV_REG_TransferTo from '@salesforce/label/c.OCI_INV_REG_TransferTo';
import OCI_INV_REG_Request from '@salesforce/label/c.OCI_INV_REG_Request';
import OCI_INV_REG_RequestFail from '@salesforce/label/c.OCI_INV_REG_RequestFail';
import OCI_INV_REG_RequestSuccess from '@salesforce/label/c.OCI_INV_REG_RequestSuccess';

export default class OciInvRegReservationEditModal extends LightningElement {
    isSubmitting = false;
    @api inventory
    @api type
    @api locationGroups
    @api locations

    record
    _requestForCreate
    _requestForFulfill
    _requestForRelease
    _requestForTransfer
    isInitialized = false;

    label = {
        OCI_INV_REG_ATF,
        OCI_INV_REG_ATO,
        OCI_INV_REG_EffectiveDate,
        OCI_INV_REG_Futures,
        OCI_INV_REG_OnHand,
        OCI_INV_REG_Reserved,
        OCI_INV_REG_SafetyStockCount,
        OCI_INV_REG_SKU,
        OCI_INV_REG_LocationGroup,
        OCI_INV_REG_Locations,
        OCI_INV_REG_Quantity,
        OCI_INV_REG_CreateReservation,
        OCI_INV_REG_ReleaseReservation,
        OCI_INV_REG_FulfillReservation,
        OCI_INV_REG_TransferReservation,
        OCI_INV_REG_ExpirationSeconds,
        OCI_INV_REG_ReservationTime,
        OCI_INV_REG_AllowPartialReservations,
        OCI_INV_REG_AllOrNothing,
        OCI_INV_REG_TransferTo,
        OCI_INV_REG_Request
    }

    get isCreate() {
        return this.type === "create";
    }

    get isTransfer() {
        return this.type === "transfer";
    }

    get transferToList() {
        const locationGroups = this.locationGroups.filter(l => l.locationGroupIdentifier !== this.inventory.identifier).map(l => {
            return { label: l.locationGroupIdentifier, value: "lg-" + l.locationGroupIdentifier }
        }
        ) || [];
        const locations = this.locations.filter(l => l.locationIdentifier !== this.inventory.identifier).map(l => {
            return { label: l.locationIdentifier, value: "l-" + l.locationIdentifier }
        }) || [];
        return [...locationGroups, ...locations];
    }

    get transferToValue() {
        return this.record.toLocationGroupIdentifier || this.record.toLocationIdentifier || null
    }

    get title() {
        switch (this.type) {
            case "create":
                return OCI_INV_REG_CreateReservation;
            case "fulfill":
                return OCI_INV_REG_FulfillReservation;
            case "release":
                return OCI_INV_REG_ReleaseReservation;
            case "transfer":
                return OCI_INV_REG_TransferReservation;
            default:
                return "";
        }
    }

    _initialize() {
        this.isInitialized = false
        this.record = {
            quantity: 0,
        }
        this._requestForCreate = {
            createRecords: [],
            allowPartialReservations: false,
        }
        this._requestForFulfill = {
            fulfillmentRecords: [],
        }
        this._requestForRelease = {
            releaseRecords: [],
        }
        this._requestForTransfer = {
            transferRecords: [],
            allOrNothing: false,
        }
        this.isInitialized = true
    }

    @api
    open() {
        this._initialize();
        this.template.querySelector('c-oci-inv-reg-modal.reservation-modal').open();
    }

    @api
    close() {
        this.template.querySelector('c-oci-inv-reg-modal.reservation-modal').close();
    }

    handleChange(event) {
        switch (event.target.dataset.name) {
            case "quantity":
                switch (this.type) {
                    case "create":
                        this.record.quantity = event.detail.value;
                        break;
                    case "fulfill":
                        this.record.quantity = event.detail.value;
                        break;
                    case "release":
                        this.record.quantity = event.detail.value;
                        break;
                    case "transfer":
                        this.record.quantity = event.detail.value;
                        break;
                    default:
                        break;
                }
                break;
            case "expiration-seconds":
                this._requestForCreate.expirationSeconds = event.detail.value || null;
                break;
            case "reservation-time":
                this._requestForCreate.reservationTime = event.detail.value || null;
                break;
            case "allow-partial":
                this._requestForCreate.allowPartialReservations = event.detail.checked;
                break;
            case "transfer-to":
                if (event.detail.value.startsWith("lg-")) {
                    this.record.toLocationGroupIdentifier = event.detail.value.substring(3);
                } else {
                    this.record.toLocationIdentifier = event.detail.value.substring(2);
                }
                break;
            case "all-or-nothing":
                this._requestForTransfer.allOrNothing = event.detail.checked;
                break;
            default:
                break
        }
    }

    async handleExecute() {
        const allValid = [
            ...this.template.querySelectorAll('lightning-input'),
            ...this.template.querySelectorAll('lightning-combobox'),
        ].reduce((validSoFar, inputCmp) => {
            inputCmp.reportValidity();
            return validSoFar && inputCmp.checkValidity();
        }, true);
        if (!allValid) {
            return
        }
        this.isSubmitting = true;
        const uuids = await getUUID({ num: 2 });
        const uuid = uuids[0];
        this.record.stockKeepingUnit = this.inventory.stockKeepingUnit;
        if (this.type !== "transfer") {
            if (this.inventory.isLocationGroup) {
                this.record.locationGroupIdentifier = this.inventory.identifier;
            } else {
                this.record.locationIdentifier = this.inventory.identifier;
            }
        } else {
            if (this.inventory.isLocationGroup) {
                this.record.fromLocationGroupIdentifier = this.inventory.identifier;
            } else {
                this.record.fromLocationIdentifier = this.inventory.identifier;
            }
        }
        try {
            let res
            switch (this.type) {
                case "create":
                    this._requestForCreate.actionRequestId = uuid;
                    this._requestForCreate.createRecords[0] = this.record;
                    res = await createReservation({ request: this._requestForCreate });
                    break;
                case "fulfill":
                    this.record.actionRequestId = uuid;
                    this._requestForFulfill.fulfillmentRecords[0] = this.record;
                    res = await fulfillReservation({ request: this._requestForFulfill });
                    break;
                case "release":
                    this.record.actionRequestId = uuid;
                    this._requestForRelease.releaseRecords[0] = this.record;
                    res = await releaseReservation({ request: this._requestForRelease });
                    break;
                case "transfer":
                    this.record.actionRequestId = uuid;
                    if (this.record.allOrNothing) {
                        this.record.allOrNothingTransferId = uuids[1];
                    }
                    this._requestForTransfer.transferRecords[0] = this.record;
                    res = await transferReservation({ request: this._requestForTransfer });
                    break;
                default:
                    break;
            }
            if (res.errors.length > 0) {
                throw new Error(JSON.stringify(res.errors));
            }
            showToast(this, OCI_INV_REG_RequestSuccess, `${OCI_INV_REG_RequestSuccess}: ${this.title}`, "success")
            this.dispatchEvent(new CustomEvent('execute', { detail: {} }));
        } catch (e) {
            showToast(this, OCI_INV_REG_RequestFail, e.message, "error")
        } finally {
            this.isSubmitting = false;
            this.close();
        }

    }
}