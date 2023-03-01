# Sample GMO Payment Adapter
This sample package contain component to implement client side tokenization flow payment without 3DS.

You can use new card and save it.
![](images/form.png)
You can choose a card from saved list.
![](images/list.png)

## Setting instruction
1. Push/Deploy sources to your org.
1. Go to **Setup > Custom Metadata Types** and replace `{your shop id}`, `{your shop pass}`, `{your site id}`, `{your site pass}` in `GMOClientConfiguration` with GMO credentials. 
1. Go to **Setup > Named Credentials** and replace `{your shop id}`, `{your shop pass}`, `{your site id}`, `{your site pass}` in `GMOAdapterShop_NC` and `GMOAdapterSite_NC` with GMO credentials. 
1. Create PaymentGateway record with command below. Replace `{your org user}` with user alies or ID of an org you prefer to use.
    ```
    sh scripts/shell/payment.sh -u {your org user} -a GMOPaymentAdapter -n GMOAdapterShop_NC
    ```
1. Select `GMOPaymentAdapter_Gateway` in Link Integration setting
    ![](images/link_integration.png)
1. Set up Trusted Sites in Experience Builder for `https://stg.static.mul-pay.jp` and `https://pt01.mul-pay.jp`.
    ![](images/csp.png)
1. Assign access to Apex `GMOPaymentController` to shopper profile. (**Setup > Apex Classes > Security** in `GMOPaymentController`)


## Request type mapping 
### [REST API](https://developer.salesforce.com/docs/atlas.en-us.240.0.chatterapi.meta/chatterapi/connect_resources_payments.htm)
`/commerce/payments/authorizations` -> `Authorize`  
`/commerce/payments/authorizations/authorizationId/captures` -> `Capture`  
`/commerce/payments/authorizations/authorizationId/reversals` -> `AuthorizationReversal`  
`/commerce/payments/payments/paymentId/refunds` -> `ReferencedRefund`  
`/commerce/payments/sales` -> `Sale`  

### [Apex method](https://developer.salesforce.com/docs/atlas.ja-jp.apexcode.meta/apexcode/apex_ConnectAPI_Payments_static_methods.htm#unique_1099295387)
`authorize(authorizePayment)` -> `Authorize`  
`capture(AuthCaptureInput, authorizationId)`  -> `Capture`  
`reverseAuthorization(AuthReversalInput, authorizationId)` -> `AuthorizationReversal`  
`refund(ReferencedRefundInput, paymentId)`  -> `ReferencedRefund`  

### [SOM Core Action](https://help.salesforce.com/s/articleView?language=en_US&id=sf.flow_ref_elements_om_actions_list.htm&type=5)
`Ensure Funds Async` -> `Capture`  
`Ensure Refunds Async` -> `ReferencedRefund`  

## For prduction
This package use urls(e.g. `https://stg.static.mul-pay.jp`) for GMO staging environment. Please change url and credentials accordingly to go production.


## Out of scope (as of 2023/02)
- Payment for 3DS
- Showing card brand logo
- Validating security code  for card selection