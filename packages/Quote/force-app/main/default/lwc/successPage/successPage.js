import { LightningElement, api } from "lwc";
import { NavigationMixin } from "lightning/navigation";

export default class SuccessPage extends NavigationMixin(LightningElement) {
  @api successMessage;
  @api showCustomLink;
  @api navRecord;
  @api linkLabel;
  recordPageUrl;

  navClick() {
    /*this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.navRecord,
                actionName: 'view'
            }

        });*/
    //location.href = '/s/quote/' + this.navRecord;
    window.open(
      "/B2BLightning/s/quote/" + this.navRecord,
      "_blank" // <- This is what makes it open in a new window.
    );
  }
  connectedCallback() {
    //this.showCustomLink = true;
  }
}
