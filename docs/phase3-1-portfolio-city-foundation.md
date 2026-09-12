# Phase 3.1 — Portfolio City 基盤実装

## Baseline

Phase 3.1 starts from public canonical `main` commit `8cddf852880f3e531b56674668a6231cb73d3b68`, the Stage 9 closure baseline.

The existing production homepage and the fourteen existing work surfaces remain unchanged. Portfolio City is introduced as an independent preview under `portfolio-city/`.

## Foundation scope

- data-driven city model with exactly 14 existing works
- four initial districts: 観測丘 / 資料通り / 工作横丁 / 水辺・遊び地区
- independent `/portfolio-city/` entry with `city.html` as the city shell
- CSS-only placeholder buildings so the information architecture can be validated before artwork is produced
- shared MAP / WORKS / PROFILE / CONTACT navigation
- desktop city-map presentation and mobile MAP / WORKS switch
- pointer, focus, click/tap, and keyboard building selection
- direct links back to the unchanged existing work URLs
- per-device visited state stored in localStorage
- reduced-motion behavior
- reserved asset directories for later building, landmark, character, and environment work
- `tools/check_portfolio_city_contract.py` guards the 14-work / 4-district / route boundary
- `tools/check_portfolio_city_runtime.mjs` executes the real `city.js` against dependency-free DOM, JSON, fetch, and localStorage mocks
- the normal public validation workflow is wired to run both Portfolio City contracts when that workflow is intentionally used

## Runtime contract coverage

The runtime harness is designed to verify:

- 4 districts are rendered
- 14 map buildings are rendered
- 14 WORKS rows are rendered
- initial HoloScope selection and route
- focus-driven selection and ArrowRight keyboard movement
- visited-state persistence through `localStorage`
- visited styling in both map and WORKS directory
- MAP / WORKS / PROFILE navigation state
- mobile MAP switching state
- all WORKS links keep the locked existing project URLs

## Locked district assignment

### 観測丘
- HoloScope → 観測塔
- 天球儀 → プラネタリウム
- 素数点画 → 点画ギャラリー

### 資料通り
- 用例採集 → ことば採集所
- 人物索引 → 人物資料館
- 技術早見表 → 技術資料センター
- SHISHA 店舗検索 → 街の案内所

### 工作横丁
- DQB2 部屋レシピ図鑑 → 工務店
- 間取図メーカー → 設計事務所
- 迷路作成補助器 → 迷路工房
- アナグラム補助器 → 活版印刷店

### 水辺・遊び地区
- 水族館 → 市立水族館
- HOLOCA デッキラボ → カードショップ
- ボードゲーム単語集 → ゲームショップ

## Boundaries

Phase 3.1 does not replace the current `/` homepage, modify any existing project implementation, change project URLs, add SECRET to the city inventory, or introduce production credentials/runtime data.

The visual building art is intentionally provisional. Later phases can replace CSS placeholders without changing the project/district data contract.

## Remaining QA gate

The next gate is execution rather than further feature expansion:

1. run the static Portfolio City contract
2. run the Node runtime contract
3. build the deployment artifact
4. run JavaScript syntax checks
5. browser-check the city at 1440 px and 390 px
6. verify MAP / WORKS / PROFILE / CONTACT, building selection, keyboard operation, localStorage restore, project links, horizontal overflow, and page errors

Remote Desktop Commander device `YWSHTMR` was explicitly explored on 2026-09-12 and was offline, so these local/browser execution checks are still pending. They must not be silently treated as passed.

## Cost and merge safety

Work is performed on a dedicated branch and kept as a Draft pull request. Branch commits use `[skip ci]` so metered GitHub-hosted Actions are not intentionally executed during the implementation loop. GitHub-hosted Actions remain unused for this phase unless explicitly approved later.

Ready-for-review, merge, and production publication remain separate explicit gates.
