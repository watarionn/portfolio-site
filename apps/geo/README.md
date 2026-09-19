# GEO / 沿線・駅・住所

Portfolio City向けの駅・路線・住所データ探索作品。

## Experience

- DATA LAB: 駅・路線・住所DBを明示的に検索する。
- EXPLORE: 同じDBを森の中で偶然発見する。
- 特殊体験: 同名駅、同字異読、沿線トラベラーへDATA LABとEXPLOREの両方から入れる。

## Production boundary

Production factual data lives in MariaDB. The browser never loads the 495,147-row address CSV directly.

- raw source: CP932 CSV, outside the public deployment
- import preparation: `tools/prepare_geo_import.py`
- canonical schema: `database/schema.sql`
- public PHP/API: `public/`
- forest/game definitions: JSON under `public/data/`
- discovery progress: browser localStorage

Database credentials are server-only. PHP prefers `GEO_DB_HOST`, `GEO_DB_NAME`, `GEO_DB_USER`, `GEO_DB_PASS`, and `GEO_DB_CHARSET`.

## Verified source contract

- raw station rows: 11,147
- normalized stations: 10,860
- normalized station-line pairs: 10,860
- raw line rows: 591
- normalized lines: 554
- address rows: 495,147
- distinct address codes: 487,728

ENSCD/EKICD include historical revisions in the adopted snapshot. The importer uses the last occurrence per duplicated code as the current identity. JUCD is not unique, so addresses use a surrogate row id and an indexed non-unique address code.

## Route target

- `/geo/`
- `/geo/lab/`
- `/geo/explore/`
- `/geo/same-name/`
- `/geo/line/`

Final Portfolio City illustration work starts only after Layout Lock.
