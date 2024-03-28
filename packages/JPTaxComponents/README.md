# Sample components for japan taxation

## 前提条件

- [トランスレーションワークベンチを有効にしてください](https://help.salesforce.com/s/articleView?id=sf.wcc_setup_enable_translation.htm&type=5)
- [マルチ通過を有効にしてください](https://help.salesforce.com/s/articleView?id=sf.admin_enable_multicurrency.htm&type=5)

## 設定手順
1. ソースを全て組織にデプロイします
1. `Setup -> Custom Code -> APEX Classes` に遷移
1. `JapanTaxController` と `JapanTaxInvoiceVFPDFController` クラスの「セキュリティ」をクリックしてバイヤーのプロファイルを割り当ててください。
1. `Setup -> Custom Code -> Visualforce Pages` に遷移
1. `JapanTaxInvoiceVFPDF` ページの「セキュリティ」をクリックしてバイヤーのプロファイルを割り当ててください。

## コンポーネント

### 「Japan Tax Order Summary Totals」 と 「Japan Tax Invoice PDF Download Button (Experience)」

これらのコンポーネントは B2B/D2C Commerce LWR テンプレートの注文詳細ページで利用します。
![](images/orderdetail.png)

### 「Japan Tax Invoice PDF Download Button (Platform)」

これらのコンポーネントはプラットフォームの注文概要レコードページで利用します。
![](images/ordersummary.png)

## 「Japan Tax Checkout Summary」

このコンポーネントは B2B/D2C Commerce LWR テンプレートのチェックアウトページで利用します。
![](images/checkoutsummary.png)

## サンプル請求書
この PDF は「[適格請求書等保存方式
の概要](https://www.nta.go.jp/taxes/shiraberu/zeimokubetsu/shohi/keigenzeiritsu/pdf/0020006-027.pdf)」に基づいてレイアウトを作成しています。レイアウトの修正は `force-app/main/default/pages/JapanTaxInvoiceVFPDF.page` ファイルを修正して行います。
![](images/sampleinvoice.png)
![](images/invoiceinstruction.png)
