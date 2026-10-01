# Prompt Studio v1.0.0

Prompt Studioは、モデルに依存しない意味データを組み立て、FLUX / SDXL / GPT Imageなどの書式へ変換し、良いPromptをPromptDBへ蓄積する独立制作ツール。

## Compose

- Semantic Composer
  - Subject / Appearance / Expression / Outfit / Action / Pose
  - Environment / Lighting / Camera / Composition / Mood / Style
  - Visible text / Constraints / Negative
- Model / Dialect
  - FLUX natural language
  - GPT Image instruction
  - SDXL natural language
  - SDXL tag / booru style
  - Generic compact tags
- Checkpoint / model nameの任意記録
- Positive / instructionとNegativeのライブ生成
- FLUX / GPT ImageではNegative欄を自動的に使わない

## Slot Composer

PromptGenerator研究で有用だった「部品をスロットとして組む」操作を、PromptDB v2のSemantic設計へ合わせて実装した。

各Slotは次を持つ。

- Semantic field
- Concept source category
- mode
  - manual
  - weighted random
  - sequential
- enabled / disabled
- current / resolved value

Slotはドラッグ、または上下ボタンで並べ替えできる。

`Resolve slots`でSemantic fieldsへ値を流し込み、そのまま各モデル向けPromptへ変換する。

## PromptDB v2.1

ブラウザ内DBは作業コピーであり正本ではない。確定時はJSONを書き出し、GitHubまたはGoogle Drive側へ保存する。

### Concepts

Conceptは最終Prompt文字列ではなく意味資産。

```json
{
  "id": "pose.standing.abc123",
  "value": "standing naturally",
  "label_ja": "自然に立つ",
  "tags": ["standing", "neutral"],
  "weight": 1
}
```

`weight`はweighted random時の抽選比率。

旧PromptDB v2の文字列配列は読み込み時にv2.1 Conceptへ自動正規化する。

### Recipes

Slotの並び、source category、modeを保存し、再読み込みできる。

旧PromptDBの`sentences/*.txt`はlegacy template Recipeとして保持する。

### Library

Prompt Studioで良い結果ができたら`DBに登録`で保存する。

保存内容は以下。

- title / tags
- model name
- semantic source
- 各Dialectの派生Prompt
- created_at / updated_at

## Legacy compatibility

旧PromptDBフォルダの、

- `config.json`
- `words/*.txt`
- `sentences/*.txt`

をフォルダごと取り込める。

`words/*.txt`はConceptsへ、`sentences/*.txt`はlegacy Recipeへ移行する。

## Internal modules

- `engine.js`: Semantic → Dialect変換、Concept正規化、weighted selection
- `store.js`: PromptDB v2.1、Concept / Recipe / Library CRUD、legacy import
- `app.js`: 基本UI、Library、Import / Export
- `slots.js`: Slot Composer、random / sequential、Recipe保存・読込
- `db-editor.js`: Concepts / Recipes編集UI

## Canonical policy

- GitHub / Google Drive: canonical PromptDB
- browser localStorage: working copy / cache only
- Prompt文字列だけを正本にしない
- Semantic sourceを正本にし、モデル別Promptは派生データとして扱う
