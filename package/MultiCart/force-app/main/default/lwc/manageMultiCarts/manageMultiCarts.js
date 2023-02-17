/* eslint-disable no-alert */
import { LightningElement, api } from 'lwc';
import userId from '@salesforce/user/Id';
import isGuest from '@salesforce/user/isGuest';
import getCarts from '@salesforce/apex/MultiCartController.getCarts';
import createCart from '@salesforce/apex/MultiCartController.createCart';
import deleteCart from '@salesforce/apex/MultiCartController.deleteCart';
import setPrimaryCart from '@salesforce/apex/MultiCartController.setPrimaryCart';
import updateCartName from '@salesforce/apex/MultiCartController.updateCartName';
import webstoreId from '@salesforce/webstore/Id'
import MultiCarts_GuestMessage from '@salesforce/label/c.MultiCarts_GuestMessage';
import MultiCarts_Title from '@salesforce/label/c.MultiCarts_Title';
import MultiCarts_CartName from '@salesforce/label/c.MultiCarts_CartName';
import MultiCarts_Create from '@salesforce/label/c.MultiCarts_Create';
import MultiCarts_PrimarySecondary from '@salesforce/label/c.MultiCarts_PrimarySecondary';
import MultiCarts_Actions from '@salesforce/label/c.MultiCarts_Actions';
import MultiCarts_Primary from '@salesforce/label/c.MultiCarts_Primary';
import MultiCarts_Secondary from '@salesforce/label/c.MultiCarts_Secondary';
import MultiCarts_SetPrimary from '@salesforce/label/c.MultiCarts_SetPrimary';
import MultiCarts_Delete from '@salesforce/label/c.MultiCarts_Delete';
import MultiCarts_Edit from '@salesforce/label/c.MultiCarts_Edit';
import MultiCarts_SampleMessage from '@salesforce/label/c.MultiCarts_SampleMessage';
import MultiCarts_EditModalTitle from '@salesforce/label/c.MultiCarts_EditModalTitle';
import MultiCarts_Cancel from '@salesforce/label/c.MultiCarts_Cancel';
import MultiCarts_Save from '@salesforce/label/c.MultiCarts_Save';
import MultiCarts_GeneralError from '@salesforce/label/c.MultiCarts_GeneralError';

export default class ManageMultiCarts extends LightningElement {

    @api effectiveAccountId;
    carts;
    isGuestUser = isGuest
    newCartName = '';
    editCartName = '';
    editCartId = '';
    isCartNameEditModalOpen = false;
    isProcessing = false;

    label = {
        MultiCarts_GuestMessage,
        MultiCarts_Title,
        MultiCarts_CartName,
        MultiCarts_Create,
        MultiCarts_PrimarySecondary,
        MultiCarts_Actions,
        MultiCarts_Primary,
        MultiCarts_Secondary,
        MultiCarts_SetPrimary,
        MultiCarts_Delete,
        MultiCarts_Edit,
        MultiCarts_SampleMessage,
        MultiCarts_EditModalTitle,
        MultiCarts_Cancel,
        MultiCarts_Save,
        MultiCarts_GeneralError
    }

    async connectedCallback() {
        this.carts = await getCarts({
            webstoreId,
            effectiveAccountId: this.effectiveAccountId,
            ownerId: userId
        })
    }

    handleNewCartNameChange(event) {
        this.newCartName = event.target.value;
    }

    handleEditCartNameChange(event) {
        this.editCartName = event.target.value;
    }

    async _retrieveCarts() {
        this.carts = await getCarts({
            webstoreId,
            effectiveAccountId: this.effectiveAccountId,
            ownerId: userId
        })
    }

    handleEditCartEvent(event) {
        event.preventDefault();
        const formData = new FormData(event.submitter.form)
        this.editCartId = formData.get("cartId");
        this.editCartName = formData.get("cartName");
        this.isCartNameEditModalOpen = true
    }

    closeEditCartModal() {
        this.editCartId = "";
        this.editCartName = "";
        this.isCartNameEditModalOpen = false
    }

    async saveEditCart() {
        this.isProcessing = true
        try {
            await updateCartName({ webstoreId, effectiveAccountId: this.effectiveAccountId, cartId: this.editCartId, ownerId: userId, cartName: this.editCartName })
            this.editCartId = "";
            this.editCartName = "";
            this.isCartNameEditModalOpen = false
            await this._retrieveCarts()
        } catch (error) {
            alert(MultiCarts_GeneralError + error.body.message)
        } finally {
            this.isProcessing = false
        }
    }

    async handleCreateCartEvent() {
        try {
            this.isProcessing = true
            await createCart({ webstoreId, effectiveAccountId: this.effectiveAccountId, cartName: this.newCartName })
            await this._retrieveCarts()
            this.newCartName = "";
        } catch (error) {
            alert(MultiCarts_GeneralError + error.body.message)
        } finally {
            this.isProcessing = false
        }
    }

    async handleDeleteCartEvent(event) {
        event.preventDefault();
        const formData = new FormData(event.submitter.form)
        const selectedCartId = formData.get("cartId");
        try {
            this.isProcessing = true
            await deleteCart({ webstoreId, effectiveAccountId: this.effectiveAccountId, cartId: selectedCartId })
            await this._retrieveCarts()
        } catch (error) {
            alert(MultiCarts_GeneralError + error.body.message)
        } finally {
            this.isProcessing = false
        }
    }

    async handleSetPrimaryCartEvent(event) {
        event.preventDefault();
        const formData = new FormData(event.submitter.form)
        const selectedCartId = formData.get("cartId");
        try {
            this.isProcessing = true
            await setPrimaryCart({ webstoreId, effectiveAccountId: this.effectiveAccountId, cartId: selectedCartId })
            window.location.reload();
        } catch (error) {
            alert(MultiCarts_GeneralError + error.body.message)
        } finally {
            this.isProcessing = false
        }

    }

    get disableButton() {
        return this.isProcessing
    }
}