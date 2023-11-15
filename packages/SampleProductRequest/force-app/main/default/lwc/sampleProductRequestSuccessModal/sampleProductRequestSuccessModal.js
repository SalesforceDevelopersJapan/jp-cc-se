import LightningModal from 'lightning/modal';
import SampleProductRequest_CompleteLabel from '@salesforce/label/c.SampleProductRequest_CompleteLabel';
import SampleProductRequest_CompleteDescription from '@salesforce/label/c.SampleProductRequest_CompleteDescription';

export default class SampleProductRequestSuccessModal extends LightningModal {

    labels = {
        SampleProductRequest_CompleteLabel,
        SampleProductRequest_CompleteDescription
    }

}