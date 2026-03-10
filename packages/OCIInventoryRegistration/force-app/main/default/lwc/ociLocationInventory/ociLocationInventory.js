import { LightningElement, api, track } from 'lwc';
import { getProductInventoryCollection } from 'commerce/productApi';
import getInventory from '@salesforce/apex/OciLocationInventoryController.getInventory';
import getInventoryContext from '@salesforce/apex/OciLocationInventoryController.getInventoryContext';

export default class OciLocationInventory extends LightningElement {
    @api recordId;
    @api titleLabel = '拠点在庫';
    @api groupTotalOnly = false;
    @api groupTotalLabel = 'ロケーショングループ合計';
    @api reservedLabelTemplate = '(予約済み数 {value})';
    @api debugEnabled = false;

    @track locations = [];
    @track groupTotal = 0;
    @track reservedTotal = 0;
    @track sourceType;
    @track errorMessage;
    @track isLoading = false;
    @track debugLogs = [];
    @track copyMessage;
    @track hideComponent = false;

    connectedCallback() {
        this.addDebug('component-init', {
            recordId: this.recordId,
            search: window.location.search,
            hash: window.location.hash,
            path: window.location.pathname
        });
        this.loadInventory();
    }

    async loadInventory() {
        const productId = this.resolveProductId();
        if (!productId) {
            this.errorMessage = 'PDPの商品IDを取得できませんでした。';
            this.addDebug('product-id-not-found');
            return;
        }

        this.errorMessage = null;
        this.isLoading = true;
        this.addDebug('inventory-request-start', { productId, groupTotalOnly: this.groupTotalOnly });

        try {
            const response = await getInventory({
                productId,
                groupTotalOnly: this.groupTotalOnly
            });

            this.applyApexResult(response);
            this.addDebug('inventory-response', {
                sourceType: this.sourceType,
                groupTotal: this.groupTotal,
                reservedTotal: this.reservedTotal,
                locationCount: this.locations.length,
                mode: 'connectapi'
            });
        } catch (error) {
            const message = this.normalizeError(error);
            if (this.isOciDisabledError(message)) {
                this.hideComponent = true;
                this.errorMessage = null;
                this.addDebug('component-hidden', { reason: message });
                return;
            }
            const isFeatureDisabled = message.includes('This feature is not currently enabled for this user');

            if (isFeatureDisabled) {
                this.addDebug('inventory-fallback-start', { reason: message, mode: 'productApi' });
                try {
                    await this.loadViaProductApi(productId);
                    this.addDebug('inventory-fallback-success', {
                        sourceType: this.sourceType,
                        groupTotal: this.groupTotal,
                        reservedTotal: this.reservedTotal,
                        locationCount: this.locations.length
                    });
                } catch (fallbackError) {
                    this.errorMessage = this.normalizeError(fallbackError);
                    this.addDebug('inventory-fallback-error', {
                        message: this.errorMessage,
                        raw: this.reduceError(fallbackError)
                    });
                }
            } else {
                this.errorMessage = message;
                this.addDebug('inventory-request-error', {
                    message: this.errorMessage,
                    raw: this.reduceError(error)
                });
            }
        } finally {
            this.isLoading = false;
        }
    }

    applyApexResult(response) {
        this.sourceType = response?.sourceType || 'UNKNOWN';
        this.groupTotal = Number(response?.groupTotal || 0);
        this.reservedTotal = Number(response?.reservedTotal || 0);
        this.locations = (response?.locations || []).map((loc, index) => ({
            locationId: loc.locationId || `loc-${index}`,
            displayName: loc.locationName || loc.locationId || `Location ${index + 1}`,
            displayQty: Number(loc.quantity || 0)
        }));
    }

    async loadViaProductApi(productId) {
        const [apiResult, contextResult] = await Promise.all([
            getProductInventoryCollection({ productIds: [productId] }),
            getInventoryContext()
        ]);

        if (!apiResult?.success) {
            throw new Error('Product API inventory response was not successful.');
        }

        this.sourceType =
            contextResult?.sourceType ||
            ((apiResult?.locationGroups || []).length > 0 ? 'LOCATION_GROUP' : 'LOCATION');

        const locationsById = new Map();
        (contextResult?.locations || []).forEach((loc, idx) => {
            const locationId = this.readLocationId(loc) || `context-${idx}`;
            locationsById.set(locationId, {
                locationId,
                displayName: this.readLocationName(loc) || locationId,
                displayQty: 0
            });
        });

        (apiResult?.locations || []).forEach((loc, idx) => {
            const locationId = this.readLocationId(loc) || `api-${idx}`;
            if (!locationsById.has(locationId)) {
                locationsById.set(locationId, {
                    locationId,
                    displayName: this.readLocationName(loc) || locationId,
                    displayQty: 0
                });
            }
        });

        const targetEntry = this.selectTargetInventoryEntry(apiResult?.totalInventory, productId);
        const targetRef = this.buildTargetReference(targetEntry, productId);

        (apiResult?.locations || []).forEach((loc) => {
            const locationId = this.readLocationId(loc);
            if (!locationId || !locationsById.has(locationId)) {
                return;
            }
            const qty = this.findProductQuantity(loc?.inventoryProducts || [], targetRef);
            if (qty !== null) {
                const row = locationsById.get(locationId);
                row.displayQty = qty;
                locationsById.set(locationId, row);
            }
        });

        this.locations = Array.from(locationsById.values());
        const sum = this.locations.reduce((acc, row) => acc + Number(row.displayQty || 0), 0);
        this.groupTotal = Number(targetEntry?.availableToOrder ?? sum);
        this.reservedTotal = 0;

        if (this.groupTotalOnly) {
            this.locations = [];
        }

        this.addDebug('inventory-productapi-summary', {
            apiLocationCount: (apiResult?.locations || []).length,
            apiGroupCount: (apiResult?.locationGroups || []).length,
            contextLocationCount: (contextResult?.locations || []).length,
            sumLocationQty: sum
        });
    }

    readLocationId(loc) {
        return (
            loc?.locationId ||
            loc?.inventoryLocationId ||
            loc?.locationIdentifier ||
            loc?.locationCode ||
            loc?.id ||
            null
        );
    }

    readLocationName(loc) {
        return loc?.locationName || loc?.name || null;
    }

    findProductQuantity(rows, targetRef) {
        const match = (rows || []).find((p) => {
            const pid = p?.product2Id || p?.productId || p?.id;
            const sku = p?.stockKeepingUnit || p?.productCode || p?.sku;
            return (
                (targetRef.productId && pid === targetRef.productId) ||
                (targetRef.stockKeepingUnit && sku === targetRef.stockKeepingUnit)
            );
        });

        if (match) {
            return this.readAvailableQty(match);
        }
        if ((rows || []).length === 1) {
            return this.readAvailableQty(rows[0]);
        }
        return null;
    }

    readAvailableQty(row) {
        const candidates = [row?.availableToOrder, row?.availableToFulfill, row?.quantity, row?.onHand];
        for (const value of candidates) {
            if (value !== null && value !== undefined && !Number.isNaN(Number(value))) {
                return Number(value);
            }
        }
        return 0;
    }

    selectTargetInventoryEntry(totalInventory, productId) {
        const rows = totalInventory || [];
        const direct = rows.find((inv) => inv?.product2Id === productId || inv?.productId === productId || inv?.id === productId);
        if (direct) return direct;
        if (rows.length === 1) return rows[0];
        return null;
    }

    buildTargetReference(totalEntry, productId) {
        return {
            productId: totalEntry?.product2Id || totalEntry?.productId || totalEntry?.id || productId,
            stockKeepingUnit: totalEntry?.stockKeepingUnit || totalEntry?.productCode || totalEntry?.sku || null
        };
    }

    get isLocationGroup() {
        return this.sourceType === 'LOCATION_GROUP';
    }

    get showLocationRows() {
        return !this.groupTotalOnly && Array.isArray(this.locations) && this.locations.length > 0;
    }

    get displayGroupTotal() {
        if (this.groupTotal === null || this.groupTotal === undefined || Number.isNaN(Number(this.groupTotal))) {
            return 0;
        }
        return Number(this.groupTotal);
    }

    get displayReservedTotal() {
        if (this.reservedTotal === null || this.reservedTotal === undefined || Number.isNaN(Number(this.reservedTotal))) {
            return 0;
        }
        return Number(this.reservedTotal);
    }

    get showReservedTotal() {
        return this.isLocationGroup;
    }

    get renderedReservedLabel() {
        const template = this.reservedLabelTemplate || '';
        return template.replace(/\{[^}]+\}/g, String(this.displayReservedTotal));
    }

    get showDebug() {
        return this.debugEnabled;
    }

    get shouldRender() {
        return !this.hideComponent;
    }

    get debugLogText() {
        return this.debugLogs.join('\n');
    }

    get disableCopyDebugButton() {
        return !this.debugLogs.length;
    }

    resolveProductId() {
        if (this.recordId && this.looksLikeSalesforceId(this.recordId)) {
            this.addDebug('product-id-from-recordId', { value: this.recordId });
            return this.recordId;
        }

        const params = new URLSearchParams(window.location.search || '');
        const queryKeys = ['recordId', 'productId', 'id', 'pid'];
        for (const key of queryKeys) {
            const value = params.get(key);
            if (value && this.looksLikeSalesforceId(value)) {
                this.addDebug('product-id-from-query', { key, value });
                return value;
            }
        }

        const pathParts = (window.location.pathname || '').split('/').filter(Boolean);
        for (let i = pathParts.length - 1; i >= 0; i -= 1) {
            const segment = decodeURIComponent(pathParts[i]);
            if (this.looksLikeSalesforceId(segment)) {
                this.addDebug('product-id-from-path', { value: segment });
                return segment;
            }
        }

        return null;
    }

    looksLikeSalesforceId(value) {
        return /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(value || '');
    }

    normalizeError(error) {
        if (!error) {
            return 'Unknown error';
        }
        if (Array.isArray(error?.body)) {
            return error.body.map((e) => e.message).join(', ');
        }
        if (typeof error?.body?.message === 'string') {
            return error.body.message;
        }
        if (typeof error?.message === 'string') {
            return error.message;
        }
        return JSON.stringify(error);
    }

    reduceError(error) {
        return {
            bodyMessage: error?.body?.message,
            message: error?.message,
            status: error?.status,
            statusText: error?.statusText
        };
    }

    addDebug(label, payload) {
        if (!this.debugEnabled) {
            return;
        }
        const timestamp = new Date().toISOString();
        const line = payload ? `[${timestamp}] ${label} ${JSON.stringify(payload)}` : `[${timestamp}] ${label}`;
        this.debugLogs = [...this.debugLogs, line];
    }

    async handleCopyDebugLog() {
        const text = this.debugLogText;
        if (!text) {
            return;
        }

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                this.template.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                this.template.removeChild(textarea);
            }
            this.copyMessage = 'デバッグログをコピーしました。';
        } catch (error) {
            this.copyMessage = `コピーに失敗しました: ${this.normalizeError(error)}`;
            this.addDebug('debug-copy-error', { message: this.copyMessage });
        }
    }

    isOciDisabledError(message) {
        const text = (message || '').toLowerCase();
        return (
            text.includes('inventory source configuration was not found')
        );
    }
}
