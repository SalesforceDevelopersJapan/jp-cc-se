import { LightningElement, api } from 'lwc';

export default class FileList extends LightningElement {
    @api items
    @api showDeleteButton = false;
    @api showDownloadButton = false;

    get showList() {
        return this.items.length > 0
    }

    dispatchDeleteEvent(event) {
        const dataset = event.target.dataset
        this.dispatchEvent(new CustomEvent('delete', {
            detail: {
                recordId: dataset.recordid,
                type: dataset.type,
                file: dataset.file
            }
        }))
    }

    dispatchDownloadEvent(event) {
        this.dispatchEvent(new CustomEvent('download',{
            detail: {
                url: event.target.dataset.url
            }
        }))
    }
}

