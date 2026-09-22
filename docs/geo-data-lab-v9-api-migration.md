# DATA LAB v9 API migration

The Drive prototype `ensen_eki_jusho_data_lab_v9.html` proved the two-surface concept:

- DATA LAB = explicit search
- EXPLORE = authored discovery / forest

The prototype embedded the complete station, line, and address masters directly in one HTML file. Production keeps the v9 interaction contract but not that data-delivery model.

## Production migration

DATA LAB now queries the read-only MariaDB APIs:

- station search -> `api/stations.php`
- line search -> `api/lines.php`
- address search -> `api/addresses.php`
- data counts -> `api/stats.php`

The v9 "dataから見る" entry points are preserved as real production experiences:

- 同名駅 -> `same-name/`
- 同じ字・違う読み -> address search seeded with 七日町
- 沿線 -> `line/` seeded with 五能線

The forest is not embedded as an iframe inside DATA LAB in production. It remains the independent EXPLORE surface, preserving the project's "調べる日本 / 偶然出会う日本" split.

## Runtime guarantees

- no master CSV or full address array is shipped to the browser
- result limit remains bounded at 50 for DATA LAB search
- query state is shareable via `?mode=...&q=...`
- legacy `?view=reading-contrast` continues to open the 七日町 comparison
- all returned database text is rendered with DOM `textContent`, not executable HTML
