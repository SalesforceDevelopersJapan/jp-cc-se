import { LightningElement, api } from 'lwc';
import searchCard from '@salesforce/apex/GMOPaymentController.searchCard';
import setDefaultCard from '@salesforce/apex/GMOPaymentController.setDefaultCard';
import deleteCard from '@salesforce/apex/GMOPaymentController.deleteCard';
import GMOPayment_CardListLoading from '@salesforce/label/c.GMOPayment_CardListLoading';

export default class GmoCardElementCardList extends LightningElement {

    _cardList = []
    selected
    isProcessing = false

    label = {
        GMOPayment_CardListLoading
    }

    async connectedCallback() {
        try {
            this.isProcessing = true
            await this._retrieveCardList()
        } catch (e) {
            console.error(e)
        } finally {
            this.isProcessing = false
        }
    }

    @api
    getSelectRow() {
        return this.template.querySelector('c-gmo-card-element-card-list-row.item-' + this.selected)
    }

    handleSelect(event) {
        this.selected = event.detail.select
    }

    async handleDefault(event) {
        try {
            this.isProcessing = true
            await setDefaultCard({ ...event.detail })
            await this._retrieveCardList()
        } catch (e) {
            console.error(e)
        } finally {
            this.isProcessing = false
        }
    }

    async handleDelete(event) {
        try {
            this.isProcessing = true
            await deleteCard({ ...event.detail })
            await this._retrieveCardList()
        } catch (e) {
            console.error(e)
        } finally {
            this.isProcessing = false
        }
    }


    get list() {
        this._cardList = this._cardList.map(i => {
            i.className = "item-" + i.CardSeq
            return i
        })
        const selectedFound = this.selected ? this._cardList.find(c => c.CardSeq === this.selected) : false
        if (selectedFound) {
            this.selected = selectedFound.CardSeq
            return this._cardList
        }
        const defaultFound = this._cardList.find(c => c.DefaultFlag === '1')
        if (defaultFound) {
            this.selected = defaultFound.CardSeq
            return this._cardList
        }
        this.selected = ""
        return this._cardList
    }

    async _retrieveCardList() {
        const cards = await searchCard();
        if ('ErrInfo' in cards === false) {
            this._cardList = this._makeCardList(cards)
            this._cardList = this._cardList.map(this._formatList)
        } else if (cards['ErrInfo'].includes('E01240002') || cards['ErrInfo'].includes('E01390002')) {
            this._cardList = []
        }
        this._cardList = this._cardList.map(this._formatList)
        const e = new CustomEvent('retrieved', { detail: { isEmpty: this._cardList.length <= 0 } });
        this.dispatchEvent(e);
    }

    _formatList(c) {
        const makeExpireDate = (expire) => {
            return expire.slice(0, 2) + '/' + expire.slice(2, 4)
        }
        c.expire = makeExpireDate(c.Expire)
        c.default = c.DefaultFlag === '1'
        return c
    }

    _makeCardList(cards) {
        const list = []
        for (let key in cards) {
            const val = cards[key]
            const vals = val.split("|")
            for (let idx in vals) {
                const add = { [key]: vals[idx] }
                list[idx] = list[idx] ? { ...list[idx], ...add } : { ...add }
            }
        }
        return list
    }

}