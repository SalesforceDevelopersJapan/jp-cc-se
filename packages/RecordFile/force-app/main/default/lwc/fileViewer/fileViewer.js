import { LightningElement, api, track } from 'lwc';
import { getSessionContext } from 'commerce/contextApi';
import getFileList from '@salesforce/apex/RecordFileController.getFileList';
import deleteFile from '@salesforce/apex/RecordFileController.deleteFile';
import getContactId from '@salesforce/apex/RecordFileController.getContactId';
import userId from '@salesforce/user/Id';

export default class FileViewer extends LightningElement {
    @api recordId
    @api recordType;
    @api showDeleteButton = false
    @api useAccountFiles = false
    @track files = []
    _recordId;

    async getRecordId() {
        let data
        switch (this.recordType) {
            case "Account":
                data = await getSessionContext();
                return data.effectiveAccountId;
            case "Contact":
                data = await getContactId();
                return data;
            default:
                return this.recordId
        }
    }

    generateUrl(id) {
        return `/sfc/servlet.shepherd/version/download/${id}`
    }

    async connectedCallback() {
        this._recordId = await this.getRecordId()
        const contentList = await getFileList({ recordId: this._recordId })
        this.files = contentList.map((content, index) => {
            return {
                rowId: `uploaded-${index}`,
                recordId: content.Id,
                owner: content.OwnerId,
                name: content.PathOnClient,
                type: "uploaded",
                waiting: false,
                error: false,
                deletable: content.OwnerId === userId,
                download: this.generateUrl(content.Id)
            }
        })
        this.isLoading = false
    }

    get items() {
        return this.files
    }

    download(event) {
        event.stopPropagation();
        event.preventDefault();
        const url = event.detail.url;
        window.open(url, '_blank');
    }

    async remove(event) {
        event.stopPropagation();
        event.preventDefault();
        const recordId = event.detail.recordId;
        const file = this.files.find(item => item.recordId === recordId)
        try {
            file.waiting = true
            file.error = false
            file.errorMessage = null
            await deleteFile({ recordId })
            let index = this.files.findIndex(item => item.recordId === recordId)
            this.files.splice(index, 1);
        } catch (e) {
            file.error = true
            file.errorMessage = JSON.stringify(e.body)
        } finally {
            file.waiting = false
        }

    }

}