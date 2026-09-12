# Phase 3.2 — Portfolio City ビジュアル実装

## Baseline

Phase 3.2 starts from merged production baseline `41d13b81b9633b78b3b49134e58065156b9814da`.

Phase 3.1 fixed the city data contract, navigation, visited state, and four-district layout. Phase 3.2 keeps those contracts intact and begins replacing the common placeholder house with project-specific city architecture.

## Checkpoint 1 scope

- keep all 14 project IDs, routes, district assignments, and existing project implementations unchanged
- keep root `/` unchanged
- replace the one shared placeholder-house drawing with 14 distinct HTML/CSS silhouettes
- keep visuals dependency-free and local: no generated raster artwork, external icon pack, or JavaScript drawing library
- preserve keyboard, pointer, touch, localStorage, reduced-motion, and mobile behavior
- add subtle district-specific background marks for the four districts
- retain the existing editorial paper / Mincho visual language

## Visual vocabulary

The first visual pass uses the role of each building rather than decorative randomness:

- HoloScope: narrow observation tower and deck
- 天球儀: dome-shaped planetarium
- 素数点画: dotted gallery facade
- 用例採集: small collecting/archive storefront
- 人物索引: columned reference museum
- 技術早見表: stacked technical records tower
- SHISHA 店舗検索: striped information kiosk
- DQB2 部屋レシピ図鑑: layered workshop facade
- 間取図メーカー: gridded design office
- 迷路作成補助器: maze-pattern workshop
- アナグラム補助器: printshop / press-wheel facade
- 水族館: rounded water-tank architecture
- HOLOCA デッキラボ: awning card shop
- ボードゲーム単語集: marquee game shop

## Checkpoint 1 acceptance

- exactly 14 `.building-visual` nodes render from the existing project data
- CSS contains an explicit visual treatment for every locked project ID
- desktop 1440 px and mobile 390 px have no horizontal overflow
- all 14 computed building visual signatures are distinct in the browser QA probe
- no browser page errors
- Phase 3.1 contract/runtime/build behavior remains green

## Boundaries

This checkpoint does not add characters, animated pedestrians, new projects, new districts, new project detail routes, or homepage replacement. Those remain later visual/experience decisions.

The next Phase 3.2 checkpoint can deepen streets, landmarks, terrain, and map composition without changing the 14-work data contract.
## Checkpoint 2 scope

Checkpoint 2 turns the four district blocks into a more legible city map without changing the 14-work contract.

- add a map infrastructure layer with a north-south street, cross street, central plaza, and waterside bridge
- render one visible landmark marker for each district using the existing `districts.json` landmark data
- deepen district terrain cues with hill contours, archive-grid lines, workshop hatching, and waterside ripples
- keep infrastructure decorative and non-interactive so project navigation behavior remains unchanged
- hide the street overlay on narrow mobile layouts while retaining all four landmark markers
- remove duplicate landmark text from the district metadata once the marker is visible

## Checkpoint 2 acceptance

- exactly one `.city-map__infrastructure` layer renders on the city map
- exactly four `.district-landmark` markers render from the existing district data
- desktop renders two street axes, one plaza, and one bridge without horizontal overflow
- mobile suppresses the infrastructure overlay and keeps the landmark markers readable
- all 14 project buildings remain selectable and all existing routes remain unchanged
- contract, runtime, production build, JavaScript syntax, and browser page-error checks remain green

The next checkpoint can focus on map depth and wayfinding details such as district entrances, small street labels, and visit-state visual feedback, without adding characters or changing project routes.
