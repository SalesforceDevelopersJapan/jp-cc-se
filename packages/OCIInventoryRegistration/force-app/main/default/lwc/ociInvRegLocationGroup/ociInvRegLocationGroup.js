import { LightningElement, wire } from 'lwc';
import getInventoryAvailability from '@salesforce/apex/OciInvRegController.getInventoryAvailability';
import getLocationGroups from '@salesforce/apex/OciInvRegController.getLocationGroups';
import { showToast, printFormat } from 'c/ociInvRegUtils'
import OCI_INV_REG_LocationGroup from '@salesforce/label/c.OCI_INV_REG_LocationGroup';
import OCI_INV_REG_PleaseSearchTitle from '@salesforce/label/c.OCI_INV_REG_PleaseSearchTitle';
import OCI_INV_REG_PleaseSearchDescription from '@salesforce/label/c.OCI_INV_REG_PleaseSearchDescription';
import OCI_INV_REG_Search from '@salesforce/label/c.OCI_INV_REG_Search';
import OCI_INV_REG_RetrievingLocationGroupFail from '@salesforce/label/c.OCI_INV_REG_RetrievingLocationGroupFail';
import OCI_INV_REG_RetrievingInventoryAvailabilityFail from '@salesforce/label/c.OCI_INV_REG_RetrievingInventoryAvailabilityFail';
import OCI_INV_REG_Loading from '@salesforce/label/c.OCI_INV_REG_Loading';
import OCI_INV_REG_LocationGroupNotFound from '@salesforce/label/c.OCI_INV_REG_LocationGroupNotFound';
import OCI_INV_REG_SelectLocationGroup from '@salesforce/label/c.OCI_INV_REG_SelectLocationGroup';
import OCI_INV_REG_SKU from '@salesforce/label/c.OCI_INV_REG_SKU';
import OCI_INV_REG_Locations from '@salesforce/label/c.OCI_INV_REG_Locations';
import OCI_INV_REG_InventoryNotFound from '@salesforce/label/c.OCI_INV_REG_InventoryNotFound';
import OCI_INV_REG_InventoryNotFoundDescrption from '@salesforce/label/c.OCI_INV_REG_InventoryNotFoundDescrption';
import OCI_INV_REG_ExpectedDate from '@salesforce/label/c.OCI_INV_REG_ExpectedDate';
import OCI_INV_REG_Quantity from '@salesforce/label/c.OCI_INV_REG_Quantity';
import OCI_INV_REG_RequestJobFails from '@salesforce/label/c.OCI_INV_REG_RequestJobFails';
import OCI_INV_REG_RequestJobCompleted from '@salesforce/label/c.OCI_INV_REG_RequestJobCompleted';
import OCI_INV_REG_RequestJobOther from '@salesforce/label/c.OCI_INV_REG_RequestJobOther';
import OCI_INV_REG_Futures from '@salesforce/label/c.OCI_INV_REG_Futures';
import OCI_INV_REG_NoFuture from '@salesforce/label/c.OCI_INV_REG_NoFuture';
import getInventoryAvailabilityUploadStatus from '@salesforce/apex/OciInvRegController.getInventoryAvailabilityUploadStatus';

export default class OciInvRegLocationGroup extends LightningElement {

    label = {
        OCI_INV_REG_LocationGroup,
        OCI_INV_REG_PleaseSearchTitle,
        OCI_INV_REG_PleaseSearchDescription,
        OCI_INV_REG_Search,
        OCI_INV_REG_Loading,
        OCI_INV_REG_LocationGroupNotFound,
        OCI_INV_REG_SelectLocationGroup,
        OCI_INV_REG_SKU,
        OCI_INV_REG_Locations,
        OCI_INV_REG_InventoryNotFound,
        OCI_INV_REG_InventoryNotFoundDescrption,
        OCI_INV_REG_Futures,
        OCI_INV_REG_NoFuture
    }

    // Displayed Data
    options = []
    locations = []
    locationGroups = []

    // Selected Data State
    selectedInventory = null;
    selectedFutures = []
    selectedLocationId = ""

    // Selected Reservation
    selectedReservation = null
    selectedReservationType = ""

    // Input State
    sku = ""
    locationGroupId = ""

    // UI State 
    ready = false
    hasSearched = false
    isSearching = false

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

    @wire(getLocationGroups, { limitNum: 30 })
    wiredLocationGroups({ error, data }) {
        if (data) {
            if (data.length > 0) {
                this.options = data.map((d) => { return { label: d.LocationGroupName, value: d.ExternalReference } });
                this.locationGroupId = this.options[0].value;
            }
            this.ready = true;
        } else if (error) {
            console.error(error)
            showToast(this, OCI_INV_REG_RetrievingLocationGroupFail, error.statusText, "error")
        }
    }

    get hasLocationGroup() {
        return this.locations.length > 0 && this.locationGroups.length > 0
    }

    get hasOption() {
        return this.options.length > 0
    }

    get hasSelectedFutures() {
        return this.selectedFutures && this.selectedFutures.length > 0
    }

    async onSubmit(event) {
        event.preventDefault();
        this.isSearching = true
        const request = {
            useCache: false,
            stockKeepingUnit: this.sku,
            locationGroupIdentifier: this.locationGroupId
        }
        try {
            const res = await getInventoryAvailability({ request })
            this.locations = res.locations.map(l => {
                return { ...l, key: l.locationIdentifier + Date.now() }
            })
            this.locationGroups = res.locationGroups.map(l => {
                return { ...l, key: l.locationGroupIdentifier + Date.now() }
            })
            this.hasSearched = true
        } catch (e) {
            console.error(e)
            showToast(this, OCI_INV_REG_RetrievingInventoryAvailabilityFail, e.message, "error")
        } finally {
            this.isSearching = false
        }

    }

    handleSku(event) {
        this.sku = event.detail.value
    }

    handleLocationGroup(event) {
        this.locationGroupId = event.detail.value
    }

    handleLocationEdit(event) {
        const { row, location } = event.detail
        const { index } = row;
        if (index !== -1 && location) {
            this.selectedInventory = { ...location.inventoryRecords[index] };
            this.selectedLocationId = location.locationIdentifier
            this.template.querySelector('c-oci-inv-reg-location-update-form-modal').open();
        }
    }

    handleFuture(event) {
        const { row, location } = event.detail
        const { index } = row;
        if (index !== -1 && location) {
            this.selectedFutures = location.inventoryRecords[index].futures;
            this.template.querySelector('c-oci-inv-reg-modal.futures').open();
        }
    }

    handleReservation(event) {
        const { row, inventory, type } = event.detail
        const { index } = row;
        if (index !== -1 && inventory) {
            this.selectedReservation = inventory;
            this.selectedReservationType = type
            this.template.querySelector('c-oci-inv-reg-reservation-edit-modal').open();
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

}