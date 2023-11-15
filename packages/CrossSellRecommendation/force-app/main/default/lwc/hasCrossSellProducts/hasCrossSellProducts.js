import { LightningElement, api, wire } from 'lwc';
import hasCrossSellProduct from '@salesforce/apex/CrossSellProductsController.hasCrossSellProduct';
import { ProductAdapter } from 'commerce/productApi';

/**
 * @slot hasCrossProductContent
 * @slot hasNotCrossProductContent
 */
export default class HasCrossSellProducts extends LightningElement {
    @api productId;
    hasThem = false
    hasFetched = false

    @wire(ProductAdapter, {
        productId: '$productId'
    })
    async productFetch({ data, error }) {
        if (data) {
            try {
                this.hasThem = await hasCrossSellProduct({ productId: data.variationParentId || data.id })
            } finally {
                this.hasFetched = true
            }
        } else if (error) {
            this.hasFetched = true
            console.log(error)
        }
    }

    get showCrossSellContent() {
        return this.hasFetched && (this.isOnBuilder() || this.hasThem)
    }

    get showNotCrossSellContent() {
        return this.hasFetched && (this.isOnBuilder() || !this.hasThem)
    }

    isOnBuilder() {
        return /.salesforce-experience.com/.test(window.location.host)
    }

}
