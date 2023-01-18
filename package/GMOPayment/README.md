# Sample GMO Payment Adapter
This sample package contain component to implement client side tokenization flow payment without 3DS.
![](images/form.png)

## Setting instruction

For scratch org:
1. Replace `{your shop id}`, `{your shop pass}`, `{your site id}`, `{your site pass}` in `force-app/main/default/customMetadata/GMO_Configuration.GMOClientConfiguration.md-meta.xml` with GMO credentials. 
1. Push source to your org.
1. Create PaymentGateway record with command below. Replace `{your scratch org user}` with user alies or ID of an org you prefer to use.
    ```
    sh scripts/shell/payment.sh -u {your scratch org user} -a GMOPaymentAdapter -n GMOAdapterShop_NC
    ```
1. Select `GMOPaymentAdapter_Gateway` in Link Integration setting
    ![](images/link_integration.png)