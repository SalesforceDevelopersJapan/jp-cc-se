import { LightningElement, api } from 'lwc';
import searchCard from '@salesforce/apex/GMOPaymentController.searchCard';
import setDefaultCard from '@salesforce/apex/GMOPaymentController.setDefaultCard';
import deleteCard from '@salesforce/apex/GMOPaymentController.deleteCard';
import GMOPayment_CardListSetAsDefault from '@salesforce/label/c.GMOPayment_CardListSetAsDefault';
import GMOPayment_CardListDelete from '@salesforce/label/c.GMOPayment_CardListDelete';
import GMOPayment_CardListLoading from '@salesforce/label/c.GMOPayment_CardListLoading';

export default class GmoCardElementCardList extends LightningElement {

    _cardList = []
    _select = null
    _disableButton = false
    isRetrieving = false

    label = {
        GMOPayment_CardListSetAsDefault,
        GMOPayment_CardListDelete,
        GMOPayment_CardListLoading
    }

    async connectedCallback() {
        this._retrieveCardList()
    }

    @api
    getSelect() {
        return this._select
    }

    handleSelect(e) {
        this._select = e.target.value
    }

    async handleDefault(e) {
        e.preventDefault();
        const formData = new FormData(e.submitter.form)
        const cardSeq = formData.get("cardSeq");
        const expire = formData.get("expire");
        const holderName = formData.get("holderName");
        try {
            this._disableButton = true
            await setDefaultCard({ cardSeq, expire, holderName })
            await this._retrieveCardList()
        } catch (e) {
            console.error(e)
        } finally {
            this._disableButton = false
        }
    }

    async handleDelete(e) {
        e.preventDefault();
        const formData = new FormData(e.submitter.form)
        const cardSeq = formData.get("cardSeq");
        try {
            this._disableButton = true
            await deleteCard({ cardSeq })
            await this._retrieveCardList()
        } catch (e) {
            console.error(e)
        } finally {
            this._disableButton = false
        }
    }

    get disableButton() {
        return this._disableButton
    }

    get list() {
        const found = this._select ? this._cardList.find(c => c.CardSeq === this._select) : false
        for (const card of this._cardList) {
            if (found) {
                card.checked = card.CardSeq === found.CardSeq
            } else {
                this._select = null
                card.checked = card.DefaultFlag === '1'
            }
        }
        return this._cardList
    }

    async _retrieveCardList() {
        try {
            this.isRetrieving = true
            const cards = await searchCard();
            if ('ErrInfo' in cards === false) {
                this._cardList = this._makeCardList(cards)
                this._cardList = this._cardList.map(this._formatList)
            } else if (cards['ErrInfo'].includes('E01240002')) {
                this._cardList = []
            }
            this._cardList = this._cardList.map(this._formatList)
            const e = new CustomEvent('retrieved', { detail: { isEmpty: this._cardList.length <= 0 } });
            this.dispatchEvent(e);
        } catch (e) {
            console.error(e)
        } finally {
            this.isRetrieving = false
        }
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