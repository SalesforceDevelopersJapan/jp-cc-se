import { LightningElement, api, track } from 'lwc';
import { getSessionContext } from 'commerce/contextApi';
import uploadFile from '@salesforce/apex/RecordFileController.uploadFile';
import getFileList from '@salesforce/apex/RecordFileController.getFileList';
import deleteFile from '@salesforce/apex/RecordFileController.deleteFile';
import getContactId from '@salesforce/apex/RecordFileController.getContactId';
import RecordFile_Upload from '@salesforce/label/c.RecordFile_Upload';
import userId from '@salesforce/user/Id';



export default class FileUploader extends LightningElement {

    @api label;
    @api recordId;
    @api recordType;
    @track files = [];
    @track uploadedFiles = [];
    @track newFiles = [];
    isWaiting = false;
    isLoaded = false;
    _recordId;

    labels = {
        RecordFile_Upload
    }

    get acceptFormats() {
        return ".png, .jpeg, .jpg, .gif, .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .csv"
    }

    get inputLabel() {
        return this.label ? this.label : "Upload Files"
    }

    get variant() {
        return this.label ? "standard" : "label-hidden"
    }

    get haveFiles() {
        return this.items.length > 0
    }

    get items() {
        return this.uploadedFiles.concat(this.newFiles)
    }

    get showUploadButton() {
        return this.newFiles.some(file => !file.recordId)
    }

    get disableUploadButton() {
        return this.isLoading || this.isWaiting
    }

    generateUrl(id) {
        return `/sfc/servlet.shepherd/version/download/${id}`
    }


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

    async connectedCallback() {
        this.isLoading = true
        this._recordId = await this.getRecordId()
        const contentList = await getFileList({ recordId: this._recordId })
        this.uploadedFiles = contentList.map((content, index) => {
            return {
                rowId: `uploaded-${index}`,
                recordId: content.Id,
                owner: content.OwnerId,
                name: content.PathOnClient,
                type: "uploaded",
                waiting: false,
                error: false,
                deletable: content.OwnerId === userId,
                download: this.generateUrl(content.Id),
            }
        })
        this.isLoading = false
    }

    handleFileChange(event) {
        event.stopPropagation();
        event.preventDefault();
        this.newFiles = this.newFiles.concat(Array.from(event.target.files).map((file, index) => {
            return {
                rowId: `new-${index}`,
                name: file.name,
                type: "new",
                waiting: false,
                error: false,
                deletable: true,
                preview: URL.createObjectURL(file),
                file
            }
        }))
    }

    async remove(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isWaiting = true
        const recordId = event.detail.recordId;
        const type = event.detail.type;
        const fileObj = event.detail.file
        if (recordId) {
            const file = this.items.find(item => item.recordId === recordId)
            try {
                file.waiting = true
                file.error = false
                file.errorMessage = null
                await deleteFile({ recordId })
                file.waiting = false
            } catch (e) {
                file.error = true
                file.errorMessage = JSON.stringify(e.body)
                file.waiting = false
                return
            }
        }
        let index
        switch (type) {
            case "uploaded":
                index = this.uploadedFiles.findIndex(item => item.recordId === recordId)
                this.uploadedFiles.splice(index, 1);
                break;
            case "new":
                index = this.newFiles.findIndex(item => Object.is(item.file, fileObj))
                this.newFiles.splice(index, 1);
                break;
            default:
                break;
        }
        this.isWaiting = false
    }

    download(event) {
        event.stopPropagation();
        event.preventDefault();
        const url = event.detail.url;
        window.open(url, '_blank');
    }

    convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    async doUpload(file) {
        try {
            file.waiting = true
            file.error = false
            file.errorMessage = null
            const base64 = await this.convertToBase64(file.file)
            const content = await uploadFile({
                base64,
                recordId: this._recordId,
                fileName: file.name
            })
            file.download = this.generateUrl(content.Id)
            file.recordId = content.Id
            file.owner = content.OwnerId
            file.deletable = true
        } catch (e) {
            file.error = true
            file.errorMessage = e.body.message
        } finally {
            file.waiting = false
        }

    }


    @api
    async upload() {
        this.isWaiting = true
        for await (let file of this.newFiles) {
            if (file.recordId) continue
            await this.doUpload(file)
        }
        this.isWaiting = false
    }

}