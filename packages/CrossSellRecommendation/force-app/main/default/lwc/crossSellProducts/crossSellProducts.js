import { LightningElement, api, wire, track } from 'lwc';
import getProducts from '@salesforce/apex/CrossSellProductsController.getProducts';
import getCategoryPickupValueMap from '@salesforce/apex/CrossSellProductsController.getCategoryPickupValueMap';
import webstoreId from '@salesforce/webstore/Id'
import { getSessionContext } from 'commerce/contextApi';
import { NavigationMixin } from 'lightning/navigation';
import { ProductAdapter } from 'commerce/productApi';
import { addItemsToCart } from 'commerce/cartApi';
import ToastContainer from 'lightning/toastContainer';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CrossSellProducts extends NavigationMixin(LightningElement) {

    @api tAddToCart
    @api tAddAllToCart
    @api tCode
    @api tName
    @api tQuantity
    @api tPrice
    @api tOtherCategory

    @api tAddToCartSuccessTitle
    @api tAddToCartSuccessDescription
    @api tAddToCartErrorTitle

    @api tAddAllToCartSuccessTitle
    @api tAddAllToCartSuccessDescription
    @api tAddAllToCartErrorTitle

    @api tAddAllToCartValidationErrorTitle
    @api tAddAllToCartValidation1ErrorDescription


    @api productId;
    @api effectiveAccountId;
    @track categories = []
    product
    quantity = 1
    categoryPickupValueMap = {}

    @wire(ProductAdapter, {
        productId: '$productId'
    })
    async productFetch({ data, error }) {
        if (data) {
            this.product = data;
            if (this.categories.length > 0) {
                return
            }
            this.categoryPickupValueMap = await getCategoryPickupValueMap();
            await this.getRecommendations(this.product.variationParentId || this.product.id)
        } else if (error) {
            console.error(error)
        }
    }


    get visible() {
        return this.product && (("variationInfo" in this.product && this.product.variationParentId) || !("variationInfo" in this.product)) && this.categories.length > 0
    }

    connectedCallback() {
        // This is Beta toast compoent
        // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/use_toast 
        const toastContainer = ToastContainer.instance();
        toastContainer.maxShown = 5;
        toastContainer.toastPosition = 'top-center';
    }

    async getRecommendations(productId) {
        const context = await getSessionContext()
        const res = await getProducts({
            productId,
            effectiveAccountId: context.effectiveAccountId,
            webstoreId
        })
        const convert = (p) => {
            return {
                id: p.id,
                imageUrl: p.defaultImage.url,
                code: p.fields.ProductCode,
                name: p.fields.Name,
                quantity: 0,
                listPrice: p.prices.listPrice,
                unitPrice: p.prices.unitPrice
            }
        }
        for (let p of res.products) {
            const pFound = res.collections.products.find(c => c.id === p.Recommended_Product__c)
            if (!pFound) {
                continue
            }
            const category = p.Option_Category__c || "other"
            const cFound = this.categories.find(c => c.category === category)
            if (cFound) {
                cFound.products.push(convert(pFound))
            } else {
                this.categories.push({
                    slected: [],
                    category,
                    categoryLabel: this.categoryPickupValueMap[category] || this.tOtherCategory,
                    products: [convert(pFound)]
                })
            }
        }
    }

    goPDP(event) {
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.GenerateUrl]({
            "type": "standard__recordPage",
            "attributes": {
                "recordId": event.target.dataset.id,
                "objectApiName": "Product2",
                "actionName": "view"
            }
        }).then(generatedUrl => {
            window.open(generatedUrl, "_self");
        });
    }

    // This is using Beta toast container compoent
    // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/use_toast 
    success(title, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: "success",
        });
        this.dispatchEvent(evt);
    }

    error(title, message) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: "error",
            mode: "sticky"
        });
        this.dispatchEvent(evt);
    }

    async addToCart(event) {
        event.preventDefault();
        event.stopPropagation();
        const formData = new FormData(event.submitter.form)
        const data = {}
        for (let pair of formData.entries()) {
            data[pair[0]] = pair[1]
        }
        try {
            for await (let e of this.template.querySelectorAll('c-quantity-input')) {
                if (e.productId === data.productId) {
                    await addItemsToCart({ [data.productId]: e.getQuantity() })
                    this.success(this.tAddToCartSuccessTitle, this.tAddToCartSuccessDescription)
                    break;
                }
            }
        } catch (error) {
            this.error(this.tAddToCartErrorTitle, error.message)
        }

    }

    async addAllToCart(event) {
        event.preventDefault();
        event.stopPropagation();
        const validated = this.categories.every(c => c.slected.length > 0)
        if (!validated) {
            this.error(this.tAddAllToCartValidationErrorTitle, this.tAddAllToCartValidation1ErrorDescription)
            return
        }
        const request = { [this.product.id]: this.quantity }
        for (let c of this.categories) {
            for (let p of c.products) {
                if (p.quantity) {
                    request[p.id] = p.quantity
                }
            }
        }
        try {
            const res = await addItemsToCart(request)
            if (!res.hasErrors) {
                this.success(this.tAddAllToCartSuccessTitle, this.tAddAllToCartSuccessDescription)
            }
            else {
                let message = ""
                res.results.forEach(rs => {
                    if (Array.isArray(rs.result)) {
                        rs.result.forEach(r => {
                            if (r.errorCode) {
                                message += r.errorCode + " : " + r.message + "\n"
                            }
                        })
                    }
                })
                this.error(this.tAddAllToCartErrorTitle, message)
            }
        } catch (error) {
            console.error(error)
        }

    }

    onQuantityChange(event) {
        event.preventDefault();
        event.stopPropagation();
        const { quantity, productId, index } = event.detail
        const category = this.categories[index];
        const idx = category.slected.findIndex(s => s === productId);
        if (idx === -1 && quantity > 0) {
            category.slected.push(productId)
        } else if (idx > -1 && quantity <= 0) {
            category.slected.splice(idx, 1)
        }
        category.products.find(p => p.id === productId).quantity = quantity
    }

    onMainQuantityChange(event) {
        event.preventDefault();
        event.stopPropagation();
        const { quantity } = event.detail
        this.quantity = quantity
    }



}