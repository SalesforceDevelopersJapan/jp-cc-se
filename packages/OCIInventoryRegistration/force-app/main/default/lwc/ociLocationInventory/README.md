# ociLocationInventory コンポーネント
`ociLocationInventory` は、PDP（商品詳細ページ）でロケーショングループ在庫と拠点別在庫を表示する LWC です。

## 必要権限（必須）
- システム権限: `Use Omnichannel Inventory APIs`（`PermissionsUseOmnichannelInventoryAPIs`）
- Apex クラスアクセス: `OciLocationInventoryController`
- `Product2` 参照権限
- オブジェクト: `Read`
- 項目: `StockKeepingUnit` / `ProductCode` の参照
- レコード共有: 対象商品を参照できること

## 権限付与方法（推奨）
- Profile または Permission Set に以下を設定してください。
- `Use Omnichannel Inventory APIs`（`PermissionsUseOmnichannelInventoryAPIs`）
- Apex Class Access: `OciLocationInventoryController`
- 付属の Permission Set: `OCI_Location_Inventory_User` を利用できます。
- Permission Set を使う場合、どのユーザーに割り当てるかは運用方針に応じて決めてください。

## 前提条件
- Apex クラスアクセス: `OciLocationInventoryController`
- ユーザー権限: `Use Omnichannel Inventory APIs`（`PermissionsUseOmnichannelInventoryAPIs`）
- 参照権限: `Product2` の参照（オブジェクト/FLS/共有）
- Commerce 側設定: WebStore の Inventory Source が設定済みであること
- Commerce 側設定: Location / LocationGroup の ExternalReference が設定されていること

## 動作概要
- まず Apex（Connect API）で在庫取得を試行します。
- ユーザーに OCI API 権限がない場合は Product API へフォールバックします。
- Product API フォールバック時は、環境により拠点別在庫が返らず、総在庫のみになる場合があります。

## 公開プロパティ
- `recordId`: 商品 ID（未指定時は URL から推定）
- `titleLabel`: セクション見出し
- `groupTotalOnly`: `true` で総在庫のみ表示
- `groupTotalLabel`: 総在庫ラベル
- `reservedLabelTemplate`: 予約済み表示テンプレート（`{value}` を置換）
- `debugEnabled`: `true` でデバッグログ表示

## トラブルシュート
- `This feature is not currently enabled for this user`
- `Use Omnichannel Inventory APIs` 未付与の可能性が高いです。
- 総在庫だけ表示され、拠点別が 0
- Product API フォールバック動作中の可能性があります。`debugEnabled=true` のログで `mode` を確認してください。
- `Use Omnichannel Inventory APIs` と Apex Class Access を確認してください。
- `SKU was not found on the product`
- `Product2.StockKeepingUnit` または `Product2.ProductCode` を設定してください。

## デプロイ対象ファイル
- `force-app/main/default/classes/OciLocationInventoryController.cls`
- `force-app/main/default/classes/OciLocationInventoryController.cls-meta.xml`
- `force-app/main/default/lwc/ociLocationInventory/ociLocationInventory.css`
- `force-app/main/default/lwc/ociLocationInventory/ociLocationInventory.html`
- `force-app/main/default/lwc/ociLocationInventory/ociLocationInventory.js`
- `force-app/main/default/lwc/ociLocationInventory/ociLocationInventory.js-meta.xml`
- `force-app/main/default/permissionsets/OCI_Location_Inventory_User.permissionset-meta.xml`
