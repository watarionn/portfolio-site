# AI Creation Workbench v1.0.0

Prompt・Pose・Model・Assetをひとつの画面で行き来する、ローカルファースト制作支援ワークベンチです。

## Workspaces

- **Prompt Lab**: PromptDB互換フォルダ、seed再現、重複除外、TXT/CSV/JSON出力
- **Pose Studio**: 関節ドラッグ、プリセット、参照画像、OpenPose風描画、PNG/SVG/JSON保存
- **Model Inspector**: Civitai URL解析、API / Offline JSON、CSV/JSON出力
- **Asset Organizer**: PNG/JSON再帰監査、pair/orphan判定、manifest、非破壊collect
- **Notebook**: 制作メモ、Prompt/Modelお気に入り、Workspace JSON

## Start

`index.html` をブラウザで開くか、静的Webサーバーでこのフォルダを配信します。初回起動時のガイドからサンプルWorkspaceを読み込むと、外部通信なしで主要機能を試せます。

## Keyboard

- `1`〜`5`: Workspace切替
- `N`: Notebook
- `?`: Help
- `Esc`: Modalを閉じる
- Prompt Lab内で `Ctrl/Cmd + Enter`: Prompt生成

## Data handling

Prompt / Pose / Asset / Notebookはブラウザ内処理です。Model InspectorだけはAPIモードで取得するときにCivitai APIへ通信します。API keyはlocalStorageへ保存しません。詳しくは `PRIVACY.md` を参照してください。

## Sample

`samples/offline-model-demo.json` に、Offline Model Inspector用のローカルサンプルを同梱しています。

## Tech

HTML5 / CSS3 / Vanilla JavaScript / SVG / localStorage / File API / File System Access API（対応ブラウザのみ）
