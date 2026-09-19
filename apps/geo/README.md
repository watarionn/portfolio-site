# GEO / 沿線・駅・住所

Portfolio City向けの駅・路線・住所データ探索作品。

## Experience

- DATA LAB: 駅・路線・住所DBを明示的に検索する。
- EXPLORE: 同じDBを森の中で偶然発見する。
- 特殊体験: 同名駅、同字異読、沿線トラベラーへDATA LABとEXPLOREの両方から入れる。

## Production boundary

Production data lives in MariaDB. The browser never loads the 495,147-row address CSV directly.

- raw source: cp932 CSV, kept outside the public repository
- import preparation: `tools/prepare_geo_import.py`
- schema: `database/schema.sql`
- public PHP: `public/`
- forest/game definitions: JSON under `public/data/`
- discovery progress: browser localStorage in the first production version

Database credentials are server-only. Do not commit them.

The PHP layer should prefer `GEO_DB_HOST`, `GEO_DB_NAME`, `GEO_DB_USER`, `GEO_DB_PASS`, and `GEO_DB_CHARSET` when defined. A later integration step may deliberately map these to the site's existing protected DB constants.

## Verified source counts

- station/line records: 11,147
- unique station codes: 10,860
- line records: 591
- unique line codes: 554
- address records: 495,147
- unique address codes: 487,728

Important: `ENSCD` is not unique in the source and `JUCD` is not unique in the address source. Production tables therefore use surrogate row IDs and preserve source codes as indexed, non-unique fields.

## Route target

- `/geo/`
- `/geo/lab/`
- `/geo/explore/`
- `/geo/same-name/`
- `/geo/line/`

Final Portfolio City illustration work starts only after Layout Lock.
