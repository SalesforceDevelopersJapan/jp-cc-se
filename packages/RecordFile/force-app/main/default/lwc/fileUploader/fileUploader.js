import { LightningElement, api, track } from 'lwc';
import uploadFile from '@salesforce/apex/RecordFileController.uploadFile';
import getFileList from '@salesforce/apex/RecordFileController.getFileList';
import deleteFile from '@salesforce/apex/RecordFileController.deleteFile';
import RecordFile_Upload from '@salesforce/label/c.RecordFile_Upload';

export default class FileUploader extends LightningElement {

    @api label;
    @api recordId;
    @track files = [];
    @track uploadedFiles = [];
    @track newFiles = [];
    isWaiting = false;
    isLoaded = false;

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

    async connectedCallback() {
        this.isLoading = true
        const contentList = await getFileList({ recordId: this.recordId })
        this.uploadedFiles = contentList.map((content, index) => {
            return {
                rowId: `uploaded-${index}`,
                recordId: content.Id,
                name: content.PathOnClient,
                type: "uploaded",
                waiting: false,
                error: false,
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
            } catch (e) {
                file.error = true
                file.errorMessage = e.body.message
            } finally {
                file.waiting = false
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
                recordId: this.recordId,
                fileName: file.name
            })
            file.download = this.generateUrl(content.Id)
            file.recordId = content.Id
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