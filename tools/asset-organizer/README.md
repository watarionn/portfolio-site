# Asset Organizer 1.0.0

Asset Organizerは、画像生成や制作で増えた画像とJSONをブラウザ内で監査し、対応関係を崩さず安全に整理する独立ツール。

## フォルダ監査

- PNG / JPG / JPEG / WEBP / JSONを再帰監査
- 同じ相対stemの画像とJSONをPAIRとして認識
- IMAGE_ONLY / JSON_ONLY / BROKEN_JSONを検出
- 画像寸法・ファイルサイズを取得
- JSON構文エラーを検出
- 別フォルダに同じbasenameがあるcollect名衝突を検出
- Manifest JSON / CSV出力
- collect計画JSON出力

トップ階層の `collect/` は監査対象から除外する。

## 非破壊collect

File System Access API対応ブラウザでは、選択した元フォルダ直下へ `collect/` を作り、対応ファイルをコピーできる。

- 元ファイルを移動・削除しない
- 既存collectファイルを上書きしない
- 同名stemは `name`, `name_1`, `name_2` の順で割当
- 画像とJSONはペア単位で同じcollect stemを使用

## Asset DB

Asset DBはファイル本体ではなく監査メタデータの台帳。

- stem / 元パス
- PAIR / orphan / broken JSON状態
- ファイルサイズ
- 画像寸法
- collect stem
- 同名衝突
- タグ
- メモ

ブラウザ内は作業コピー。長期保存時は `asset-db.json` を書き出してGitHubまたはGoogle Driveへ保存する。

旧AI Creation Workbenchの `ai-creation-workbench-assets` manifestも読み込み互換対象。

## ファイル

- `engine.js`: 監査、画像/JSON解析、collect計画、非破壊copy
- `store.js`: Asset DB
- `app.js`: UI、検索、Export / Import
