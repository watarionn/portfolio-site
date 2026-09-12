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
- a dedicated `tools/check_portfolio_city_contract.py` guard for the 14-work / 4-district boundary

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

## Cost and merge safety

Work is performed on a dedicated branch and kept as a Draft pull request. Branch commits use `[skip ci]` so metered GitHub-hosted Actions are not intentionally executed during the implementation loop. Ready-for-review, merge, and production publication remain separate explicit gates.
