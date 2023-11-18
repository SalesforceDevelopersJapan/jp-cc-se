import { LightningElement, api } from 'lwc';
import getFileList from '@salesforce/apex/RecordFileController.getFileList';

export default class FileViewer extends LightningElement {
    @api recordId
    files = []
    isLoading = false

    generateUrl(id) {
        return `/sfc/servlet.shepherd/version/download/${id}`
    }

    async connectedCallback() {
        this.isLoading = true
        const contentList = await getFileList({ recordId: this.recordId })
        this.files = contentList.map((content, index) => {
            return {
                rowId: `uploaded-${index}`,
                recordId: content.Id,
                name: content.PathOnClient,
                type: "uploaded",
                waiting: false,
                error: false,
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

}