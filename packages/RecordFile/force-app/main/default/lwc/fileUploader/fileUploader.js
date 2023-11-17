import { LightningElement, api, track } from 'lwc';
import uploadFile from '@salesforce/apex/RecordFileController.uploadFile';

export default class FileUploader extends LightningElement {

    @api label;
    @track files = [];
    @track uploadedFiles = [];

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
        return this.files.length > 0
    }

    get items() {
        return this.files.map(file => {
            return {
                label: file.name,
                name: file.name,
                type: 'icon',
                iconName: 'utility:arrowup',
            }
        })
    }

    handleFileChange(event) {
        this.files = Array.from(event.target.files);
        this.dispatchFiles()
    }

    handleItemRemove(event) {
        const index = event.detail.index;
        this.files.splice(index, 1);
        this.dispatchFiles()
    }


    @api
    async upload() {
        await uploadFile()
        this.dispatchUploaded()
    }

    dispatchFiles() {
        const selectEvent = new CustomEvent(
            'filechanged',
            {
                detail: {
                    files: this.files
                }
            }
        );
        this.dispatchEvent(selectEvent);
    }

    dispatchUploaded() {
        const selectEvent = new CustomEvent(
            'uploaded',
            {
                detail: {}
            }
        );
        this.dispatchEvent(selectEvent);
    }

}