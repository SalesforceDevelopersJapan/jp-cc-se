import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import searchProducts from '@salesforce/apex/OrderOpsController.searchProducts';
import addToCart from '@salesforce/apex/OrderOpsController.addToCart';
import getCarts from '@salesforce/apex/OrderOpsController.getCarts';
import getWebStores from '@salesforce/apex/OrderOpsController.getWebStores';
import ACCOUNTID_FIELD from '@salesforce/schema/Contact.AccountId';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import OrderOps_Webstore from '@salesforce/label/c.OrderOps_Webstore';
import OrderOps_Select_Webstore from '@salesforce/label/c.OrderOps_Select_Webstore';
import OrderOps_Cart from '@salesforce/label/c.OrderOps_Cart';
import OrderOps_Select_Cart from '@salesforce/label/c.OrderOps_Select_Cart';
import OrderOps_Keyword_Search from '@salesforce/label/c.OrderOps_Keyword_Search';
import OrderOps_Enter_Keyword from '@salesforce/label/c.OrderOps_Enter_Keyword';
import OrderOps_Product_Code from '@salesforce/label/c.OrderOps_Product_Code';
import OrderOps_Product_Name from '@salesforce/label/c.OrderOps_Product_Name';
import OrderOps_List_Price from '@salesforce/label/c.OrderOps_List_Price';
import OrderOps_Unit_Price from '@salesforce/label/c.OrderOps_Unit_Price';
import OrderOps_Add_To_Cart from '@salesforce/label/c.OrderOps_Add_To_Cart';
import OrderOps_Result_Item_Count from '@salesforce/label/c.OrderOps_Result_Item_Count';
import OrderOps_Result_Total_Page from '@salesforce/label/c.OrderOps_Result_Total_Page';
import OrderOps_Previous from '@salesforce/label/c.OrderOps_Previous';
import OrderOps_Next from '@salesforce/label/c.OrderOps_Next';
import OrderOps_No_Search_Result_Found from '@salesforce/label/c.OrderOps_No_Search_Result_Found';
import OrderOps_No_Search_Result_Found_Description from '@salesforce/label/c.OrderOps_No_Search_Result_Found_Description';
import OrderOps_Not_Searched_Yet from '@salesforce/label/c.OrderOps_Not_Searched_Yet';
import OrderOps_Not_Searched_Yet_Description from '@salesforce/label/c.OrderOps_Not_Searched_Yet_Description';
import OrderOps_Loading from '@salesforce/label/c.OrderOps_Loading';
import OrderOps_Retrieving_Data_Faild from '@salesforce/label/c.OrderOps_Retrieving_Data_Faild';
import OrderOps_Adding_Item_Success from '@salesforce/label/c.OrderOps_Adding_Item_Success';
import OrderOps_Adding_Item_Success_Description from '@salesforce/label/c.OrderOps_Adding_Item_Success_Description';
import OrderOps_Adding_Item_Failed from '@salesforce/label/c.OrderOps_Adding_Item_Failed';
import OrderOps_Searching_Items_Failed from '@salesforce/label/c.OrderOps_Searching_Items_Failed';
import OrderOps_Primary_Cart from '@salesforce/label/c.OrderOps_Primary_Cart';
import OrderOps_No_Store_Found from '@salesforce/label/c.OrderOps_No_Store_Found';




export default class OrderOpsMain extends LightningElement {

    label = {
        OrderOps_Webstore,
        OrderOps_Select_Webstore,
        OrderOps_Cart,
        OrderOps_Select_Cart,
        OrderOps_Keyword_Search,
        OrderOps_Enter_Keyword,
        OrderOps_Product_Code,
        OrderOps_Product_Name,
        OrderOps_List_Price,
        OrderOps_Unit_Price,
        OrderOps_Add_To_Cart,
        OrderOps_Result_Item_Count,
        OrderOps_Result_Total_Page,
        OrderOps_Previous,
        OrderOps_Next,
        OrderOps_No_Search_Result_Found,
        OrderOps_No_Search_Result_Found_Description,
        OrderOps_Not_Searched_Yet,
        OrderOps_Not_Searched_Yet_Description,
        OrderOps_Loading
    }

    @api recordId;

    PAGE_SIZE = 20

    accountId;

    cartOptions = [];
    cartId = ""

    webstoreOptions = [];
    webstoreId = ""

    result;
    keyword = ""
    page = 1
    start = 0
    end = 0
    totalCount = 0
    totalPage = 1
    isSearching = false
    isWaiting = false

    @wire(getRecord, { recordId: '$recordId', fields: [ACCOUNTID_FIELD] })
    async handleInitialData({ error, data }) {
        if (data) {
            this.accountId = getFieldValue(data, ACCOUNTID_FIELD)
            await this._retrieveWebstore()
        } else if (error) {
            console.error(error)
            this._showToast(OrderOps_Retrieving_Data_Faild, JSON.stringify(error), "error")
        }
    }

    async addToCart(event) {
        event.preventDefault();
        const formData = new FormData(event.submitter.form)
        const data = {}
        for (let pair of formData.entries()) {
            data[pair[0]] = pair[1]
        }
        try {
            this.isWaiting = true
            const result = await this._addToCart(data.productId, data.quantity)
            const productName = result.productDetails.name;
            const quantity = result.quantity;
            const cartName = this.cartOptions.find(c => c.value === this.cartId).label
            const webstoreName = this.webstoreOptions.find(c => c.value === this.webstoreId).label
            this._showToast(OrderOps_Adding_Item_Success,
                this._printFormat(OrderOps_Adding_Item_Success_Description, quantity, productName, cartName, webstoreName)
                , "success")
        } catch (e) {
            console.error(e)
            this._showToast(OrderOps_Adding_Item_Failed, e.message, "error")
        } finally {
            this.isWaiting = false
        }
    }

    handleCartChange(e) {
        this.cartId = e.detail.value;
    }

    handleWebstoreChange(e) {
        this.webstoreId = e.detail.value;
    }

    handleInput(e) {
        this.keyword = e.detail.value
    }

    async handleInputKeyUp(e) {
        if (e.key === 'Enter') {
            this._initializePagingState()
            await this._search()
        }
    }

    get isFirstPage() {
        return this.page === 1;
    }

    get isLastPage() {
        return this.page === this.totalPage;
    }

    get isNoResult() {
        return this.result && this.result.total === 0 && !this.isSearching;
    }

    get isSearched() {
        return this.result && !this.isSearching;
    }

    get disableSearchInput() {
        return this.isWaiting || !this.accountId || !this.webstoreId
    }

    get disableWebstoreCombo() {
        return this.isWaiting || this.webstoreOptions.length <= 0
    }

    get disableCartCombo() {
        return this.isWaiting || this.cartOptions.length <= 0
    }

    get disableAddToCartBtn() {
        return this.isWaiting || !this.webstoreId || !this.accountId || !this.cartId
    }

    get resultItemCount() {
        return this._printFormat(OrderOps_Result_Item_Count, this.start, this.end, this.totalCount)
    }

    get resultTotalPage() {
        return this._printFormat(OrderOps_Result_Total_Page, this.totalPage);
    }

    previousHandler() {
        if (this.page > 1) {
            this.page -= 1;
            this._search();
        }
    }

    nextHandler() {
        if (this.page < this.totalPage) {
            this.page += 1;
            this._search();
        }
    }

    // variant = info (default), success, warning, and error
    _showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title,
            message,
            variant
        });
        this.dispatchEvent(event);
    }

    _initializePagingState() {
        this.page = 1
        this.start = 0
        this.end = 0
        this.totalPage = 1
        this.totalCount = 0
    }

    _initializeState() {
        this._initializePagingState()
        this.keyword = ""
        this.result = null
        this.isSearching = false
        this.isWaiting = false
    }

    async _retieveCarts() {
        const carts = await getCarts({
            webstoreId: this.webstoreId,
            effectiveAccountId: this.accountId,
            contactId: this.recordId
        })
        this._convertCartsToOption(carts)
        const found = carts.find((c) => !c.IsSecondary)
        this.cartId = found ? found.Id : ""
    }

    async _retrieveWebstore() {
        const webstores = await getWebStores({ accountId: this.accountId })
        if (!webstores || webstores.length <= 0) {
            throw Error(OrderOps_No_Store_Found)
        }
        this._convertWebstoresToOption(webstores)
        this.webstoreId = webstores[0].WebStore.Id
        await this._retieveCarts();
        this._initializeState();
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
            this.result = null;
            console.error(e)
            this._showToast(OrderOps_Searching_Items_Failed, e.message, "error")
        } finally {
            this.isSearching = false
        }
    }

    _changePageHandler() {
        this.totalCount = this.result ? this.result.total : 0
        this.start = ((this.page - 1) * this.PAGE_SIZE + 1)
        if (this.PAGE_SIZE < this.totalCount) {
            this.totalPage = Math.ceil(this.totalCount / this.PAGE_SIZE)
        } else {
            this.totalPage = 1;
        }
        if (this.isLastPage) {
            this.end = this.totalCount;
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
        return searchProducts({
            webstoreId: this.webstoreId,
            effectiveAccountId: this.accountId,
            productSearchInput: request
        })

    }

    async _addToCart(productId, quantity) {
        const request = {
            productId,
            quantity
        }
        return addToCart({
            webstoreId: this.webstoreId,
            effectiveAccountId: this.accountId,
            activeCartOrId: this.cartId,
            cartItemInput: request
        })
    }

    _convertCartsToOption(data) {
        this.cartOptions = data.map(d => {
            return { label: d.IsSecondary ? d.Name : this._printFormat(OrderOps_Primary_Cart, d.Name), value: d.Id }
        })
    }

    _convertWebstoresToOption(data) {
        this.webstoreOptions = data.map(d => {
            return { label: d.WebStore.Name, value: d.WebStore.Id }
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

    _printFormat(template, ...arg) {
        if (!template) {
            return "";
        }
        for (let i = 0; i < arg.length; i++) {
            template = template.replace(`{${i}}`, arg[i]);
        }
        return template
    }

}