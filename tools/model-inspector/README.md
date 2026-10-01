# Model Inspector 1.0.0

Model Inspectorは、画像生成モデルを調べ、制作向けのModel DBとして保存し、Prompt Studioへ渡すための独立ツール。

## モデルを調べる

- Civitai model URL / model-version URL / download URLを解析
- 保存済みCivitai API JSONをオフライン資料として読込
- Autoでは保存JSONを優先し、見つからない場合だけCivitai APIへ通信
- API keyは入力時だけ使用し、localStorageへ保存しない
- 取得結果をCSV保存
- 取得結果からModel DBへ登録

## Model DB

各モデルは次の制作情報を持てる。

- モデル名 / バージョン名
- Family
- Checkpoint / LoRA / VAE / ControlNetなどの種類
- Base model / Creator
- ファイル名 / 容量 / SHA256
- Civitai URL / Model ID / Version ID
- Trigger words
- 推奨プロンプト書式
- 推奨解像度
- ControlNet / IP-Adapter対応
- VRAM目安
- 推奨設定
- 自分用評価 / タグ / メモ

ブラウザ内のDBは作業コピー。長期保存時は `model-db.json` を書き出し、GitHubまたはGoogle Driveへ置く。

## Prompt Studio連携

Model DBの「Prompt Studioで使う」を押すと、モデル名と推奨プロンプト書式を `/prompt-studio/` へ渡す。

Prompt Studio側では受け取ったモデル名を `Checkpoint / モデル名` に設定し、対応する出力書式を選択する。

## ローカルファイル

ローカルの `.safetensors` / `.ckpt` / `.pt` / `.pth` / `.gguf` を選ぶと、ファイル名と容量だけを登録画面へ反映する。ファイル本体はアップロードしない。

ブラウザのWeb Cryptoは巨大モデルのストリーミングSHA256計算に向かないため、ローカルファイルのSHA256はv1では自動全量計算しない。Civitai APIから取得できるSHA256は自動入力し、それ以外は必要に応じて手入力する。

## データ形式

`model-db.json`

- `format`: `model-db`
- `schema_version`: `1`
- `entries`: モデル情報配列

旧WorkbenchのModel Inspector JSONはインポート時に互換読込できるが、UI上で旧形式を意識させない。

## 内部構成

- `engine.js`: Civitai URL解析、API / Offline JSON、Family・書式推定
- `store.js`: Model DB保存・重複統合・Import / Export
- `app.js`: UI、検索、編集、CSV、Prompt Studio連携
