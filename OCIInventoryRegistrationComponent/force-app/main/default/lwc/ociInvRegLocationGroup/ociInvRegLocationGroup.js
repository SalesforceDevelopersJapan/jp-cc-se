import { LightningElement, wire, track } from 'lwc';
import getInventoryAvailability from '@salesforce/apex/OciInvRegController.getInventoryAvailability';
import getLocationGroups from '@salesforce/apex/OciInvRegController.getLocationGroups';
import { showToast } from 'c/ociInvRegUtils'
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
        OCI_INV_REG_InventoryNotFoundDescrption
    }

    ready = false
    sku = ""
    locationGroupId = ""
    hasSearched = false
    isSearching = false
    @track locations = []
    @track locationGroups = []
    @track options = []

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
        event.preventDefault();
        this.sku = event.detail.value
    }

    handleLocationGroup(event) {
        event.preventDefault();
        this.locationGroupId = event.detail.value
    }


}