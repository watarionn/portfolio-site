# Prompt Studio v0.1.0

AI Creation Workbench の Prompt Lab を独立させ、PromptDB v2 の入口にしたプロンプト制作ツール。

## v0.1 scope

- 意味ベースの Semantic Composer
- FLUX natural / GPT Image instruction / SDXL natural / SDXL tag / generic tag のDialect切替
- model / checkpoint 名の任意記録
- Positive / Instruction と Negative のライブ生成
- PromptDB v2 のブラウザ作業コピー
- 良いPromptを Library へ登録
- PromptDB v2 JSON import / export
- 旧 PromptDB v1 (`config.json`, `words/*.txt`, `sentences/*.txt`) の互換取込
- Concept DBからの簡易ランダム組み立て

## Architecture

`engine.js` は意味データからモデル別Promptを生成する。
`store.js` はPromptDB v2の作業コピー、merge、legacy importを担当する。
`app.js` は画面操作だけを担当する。

最終Prompt文字列を正本にせず、`semantic` を保存し、Dialectごとの `outputs` を派生データとして保持する。

## Canonical data

ブラウザの `localStorage` は作業コピー / キャッシュであり正本ではない。
PromptDBを確定するときはJSONを書き出し、GitHubまたはGoogle Drive側のcanonical PromptDBへ保存する。

## Legacy import

旧PromptDBフォルダを選択すると `words/*.txt` をv2 `concepts`へ、`sentences/*.txt` を `legacy-template` recipeとして取り込む。
旧資産を破棄せずPromptDB v2へ段階移行できる。

## Next

- PromptGenerator研究から slot composer / sequential / weighted random を吸収
- Concept / Recipe 編集UI
- Model InspectorからDialect recommendationを参照
- PoseDB参照
- canonical PromptDBの保存先と同期方式を確定