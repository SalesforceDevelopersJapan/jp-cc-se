import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import searchProducts from '@salesforce/apex/B2BOrderPadController.searchProducts';
import addToCart from '@salesforce/apex/B2BOrderPadController.addToCart';
import getCarts from '@salesforce/apex/B2BOrderPadController.getCarts';
import ACCOUNTID_FIELD from '@salesforce/schema/Contact.AccountId';
import userId from '@salesforce/user/Id';

export default class OrderPadMain extends LightningElement {

    PAGE_SIZE = 20

    accountId;
    // result;
    result = {
        total: 124,
        pageSize: 20,
        currency: "USD",
        products: [
            {
                imageUrl: "/img/b2b/default-product-image.svg",
                name: "Alpine Energy CO2 Cartridge for Smart Dispenser - 24 Pack",
                id: "01t5D000004VQ99QAG",
                listPrice: "59.99",
                unitPrice: "55.5",
                productCode: "6010007",
                sku: "6010007"
            },
            {
                imageUrl: "/img/b2b/default-product-image.svg",
                name: "2 Alpine Energy CO2 Cartridge for Smart Dispenser - 24 Pack",
                id: "201t5D000004VQ99QAG",
                listPrice: "259.99",
                unitPrice: "255.5",
                productCode: "26010007",
                sku: "26010007"
            },
        ]
    };

    keyword = ""
    page = 1
    start = 0
    end = 0
    totalPage = 1

    isSearching = false

    @api webstoreId;
    @api recordId;


    cartOptions = [];
    cartId = ""
    handleCartChange(e) {
        this.cartId = e.detail.value;
    }



    @wire(getRecord, { recordId: '$recordId', fields: [ACCOUNTID_FIELD] })
    async handleContactData({ error, data }) {
        if (data) {
            this.accountId = getFieldValue(data, ACCOUNTID_FIELD)
            const data = await getCarts({
                webstoreId: this.webstoreId,
                effectiveAccountId: this.accountId,
                ownerId: userId
            })
            this._convertCartToOption(data)
        } else if (error) {
            console.error(error)
        }
    }

    async addToCart(e) {
        e.preventDefault();
        const formData = new FormData(e.submitter.form)
        const data = {}
        for (var pair of formData.entries()) {
            data[pair[0]] = pair[1]
        }
        try {
            await _addToCart(data.productId, data.quantity)
        } catch (e) {
            console.error(e)
        }
    }


    async _search() {
        try {
            if (!this.keyword) {
                return
            }
            this.isSearching = true
            const data = await this._searchProducts(this.keyword);
            this.result = this._converDataToModel(data);
            this._changePageHandler();
        } catch (e) {
            console.error(e)
        } finally {
            this.isSearching = false
        }
    }

    handleInput(e) {
        this.keyword = e.detail.value
    }


    async handleInputKeyUp(e) {
        if (e.key === 'Enter') {
            this.page = 1
            this.start = 1
            this.end = 1
            this.totalPage = 1
            await this._search()
        }
    }

    get isFirstPage() {
        return this.page === 1;
    }

    get isLastPage() {
        return this.page == this.totalPage;
    }

    get isNoResult() {
        return this.result && this.result.total === 0 && !this.isSearching;
    }

    get isSearched() {
        return this.result && !this.isSearching;
    }


    previousHandler() {
        if (this.page > 1) {
            this.page -= 1;
            this._search();
            // this._changePageHandler();
        }
    }

    nextHandler() {
        if (this.page < this.totalPage) {
            this.page += 1;
            this._search();
            // this._changePageHandler();
        }
    }

    _changePageHandler() {
        const total = this.result.total
        this.start = total ? ((this.page - 1) * this.PAGE_SIZE + 1) : 0;
        if (this.PAGE_SIZE < total) {
            this.totalPage = Math.ceil(total / this.PAGE_SIZE)
        } else {
            this.totalPage = 1;
        }
        if (this.isLastPage) {
            this.end = total;
        } else {
            this.end = (this.page * this.PAGE_SIZE);
        }
    }

    async _searchProducts(searchTerm) {

        const request = {
            includePrices: true,
            includeQuantityRule: true,
            page: this.page - 1,
            pageSize: this.PAGE_SIZE,
            searchTerm,
            fields: ["ProductCode", "StockKeepingUnit"],
            groupingOption: "NoGrouping"
        }

        return await searchProducts({
            webstoreId: this.webstoreId,
            effectiveAccountId: this.accountId,
            productSearchInput: request
        })

    }


    async _addToCart(productId, quantity) {

        const request = {
            productId,
            quantity,
            type: "Product"
        }

        return await addToCart({
            webstoreId: this.webstoreId,
            effectiveAccountId: this.accountId,
            activeCartOrId: this.cartId,
            cartItemInput: request
        })
    }


    _convertCartToOption(data){
        this.cartOptions = data.map(d =>{
            return { label: d.Name, value: d.Id }
        })
    }



    _converDataToModel(data) {
        return {
            total: data.productsPage.total,
            pageSize: data.productsPage.pageSize,
            currency: data.productsPage.currencyIsoCode,
            products: data.productsPage.products.map(this._convertProductToModel)
        }
    }


    _convertProductToModel(product) {
        return {
            imageUrl: product.defaultImage.url,
            name: product.name,
            id: product.id,
            listPrice: product.prices.listPrice,
            unitPrice: product.prices.unitPrice,
            productCode: product.fields.ProductCode.value,
            sku: product.fields.StockKeepingUnit.value
        }

    }




}