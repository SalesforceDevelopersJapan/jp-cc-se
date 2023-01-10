import { LightningElement, api, wire, track } from 'lwc';
import isGuest from '@salesforce/user/isGuest';
import userId from '@salesforce/user/Id';
import getCarts from '@salesforce/apex/MultiCartController.getCarts';
import createCart from '@salesforce/apex/MultiCartController.createCart';
import deleteCart from '@salesforce/apex/MultiCartController.deleteCart';
import setPrimaryCart from '@salesforce/apex/MultiCartController.setPrimaryCart';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class ManageMultiCarts extends LightningElement {
    @api webstoreId;
    @api useForB2BCommerce;
    @api effectiveAccountId;

    communityUserIsGuest = isGuest;
    communityUserId = userId;

    @track carts;

    newCartName = 'My New Cart';
    selectedCartId;

    @wire(getCarts, { webstoreId: '$webstoreId', effectiveAccountId: '$effectiveAccountId', ownerId: '$communityUserId', useForB2BCommerce: '$useForB2BCommerce' })
    wiredCarts({ data, error }) {

        //console.log('webstoreId: ' + this.webstoreId);
        //console.log('effectiveAccountId: ' + this.effectiveAccountId);
        //console.log('ownerId: ' + this.communityUserId);
        //console.log('useForB2BCommerce: ' + this.useForB2BCommerce);

        if (data) {
            console.log('Carts loaded');
            this.carts = data;
        } else if (error) {
            console.error(error);
        }
    }

    handleKeyChange(event) {
        this.newCartName = event.target.value;;
    }

    handleCreateCartEvent(event) {
        console.log('createCart: ' + this.newCartName);

        createCart({ webstoreId: this.webstoreId, effectiveAccountId: this.effectiveAccountId, cartName: this.newCartName, useForB2BCommerce: this.useForB2BCommerce })
        .then((result) => {
            console.log('Cart created: ' + result);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Cart created',
                    variant: 'success'
                })
            );

            window.location.reload();
        })
        .catch((error) => {
            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error happened',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    handleDeleteCartEvent(event) {
        this.selectedCartId = event.target.title;
        console.log('deleteCart: ' + this.selectedCartId);

        deleteCart({ webstoreId: this.webstoreId, effectiveAccountId: this.effectiveAccountId, cartId: this.selectedCartId, useForB2BCommerce: this.useForB2BCommerce })
        .then((result) => {
            console.log('Cart deleted: ' + result);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Cart deleted',
                    variant: 'success'
                })
            );

            window.location.reload();
        })
        .catch((error) => {
            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error happened',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    handleSetPrimaryCartEvent(event) {
        this.selectedCartId = event.target.title;
        console.log('setPrimaryCart: ' + this.selectedCartId);
        
        setPrimaryCart({ webstoreId: this.webstoreId, effectiveAccountId: this.effectiveAccountId, cartId: this.selectedCartId, useForB2BCommerce: this.useForB2BCommerce })
        .then((result) => {
            console.log('Cart set as Primary: ' + result);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Cart set as Primary',
                    variant: 'success'
                })
            );

            window.location.reload();
        })
        .catch((error) => {
            console.error(error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error happened',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }
}