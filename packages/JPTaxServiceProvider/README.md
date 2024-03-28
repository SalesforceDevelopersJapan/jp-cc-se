# Sample japan tax service provider
インボイス制度に対応した計算のための[税計算サービス](https://help.salesforce.com/s/articleView?id=sf.comm_set_up_tax.htm&type=5)と [Salesforce コマース拡張](https://developer.salesforce.com/docs/commerce/salesforce-commerce/guide/extensions.html)を利用したサンプルコードです。

## 前提条件
- **設定 > 州/国/テリトリー選択リスト** からスキャンを実行してください。
- ローカルに `sfdx`, `jq` コマンドが必要です。
- 税金の設定は [Salesforce 税金ソリューション](https://help.salesforce.com/s/articleView?id=sf.comm_what_is_tax_solution.htm&type=5) に基づいたオブジェクトの構成ですが、Tax Policy オブジェクトは今回利用していません。

## 設定手順
1. ソースコードをデプロイしてください。
1.  下記のコマンドを実行してデフォルトの税率（10%）を設定します。
    ```
    sh scripts/shell/default_taxrate.sh -u {your org user}
    ```
1. (Cart Calculate API が無効な場合) 下記のコマンドを実行してインテグレーションサービスとして登録します。
    ```
    sh scripts/shell/integrations.sh -u {your org user}
    ```
1. (Cart Calculate API が有効な場合) 下記のコマンドを実行して拡張プロバイダーとして登録します。
    ```
    sh scripts/shell/extentions.sh -u {your org user}
    ```
1. (Cart Calculate API が無効な場合) `Japan_Tax_Service` というインテグレーションを[このヘルプ](https://help.salesforce.com/s/articleView?id=sf.comm_set_up_tax.htm&type=5)に従ってリンクしてください。
1. (Cart Calculate API が有効な場合) `Japan_Tax_Service_DE` というカスタムプロバイダーを[このヘルプ](https://help.salesforce.com/s/articleView?id=sf.comm_set_up_tax.htm&type=5)に従って設定してください。


## 制限
- このサンプルはストアの税タイプがネットの場合にのみ対応しています。
- デフォルトの税率は `default_taxrate.sh` にて 税コード `defalt_tax` として TaxRate オブジェクトとして設定されますが、必要に応じて変更してください。 
