# 沿線・駅・住所 Production Architecture

Updated: 2026-09-19

## Decision

Production factual data uses MariaDB through PHP/PDO. CSV is an import source, not a browser/runtime database. EXPLORE topology stays authored JSON and notebook progress stays in localStorage.

## Verified source and normalization audit

| source | raw rows | normalized identity |
| --- | ---: | ---: |
| hLF-ensen.csv | 591 | 554 lines |
| hLF-eki.csv | 11,147 | 10,860 stations / 10,860 station-line pairs |
| hmaf.csv | 495,147 | 487,728 distinct address codes |

ENSCD/EKICD can be reused by historical revisions. In the adopted snapshot later rows are newer, so the importer uses the last occurrence per duplicated code. Address JUCD is non-unique and remains an indexed CHAR(11), with a surrogate row id.

## Runtime boundary

```text
CP932 CSV -> prepare_geo_import.py -> UTF-8 normalized CSV
          -> MariaDB (geo_lines / geo_stations / geo_station_lines / geo_addresses)
          -> PHP/PDO JSON API -> DATA LAB / special experiences / EXPLORE lookups
```

No raw master CSV is published under the web root. Credentials remain server-only.

## Local source QA, 2026-09-19

The adopted source files were reprocessed against the normalized contract:

- line raw / normalized: 591 / 554
- station raw / normalized: 11,147 / 10,860
- unique station-line pairs: 10,860
- address raw / distinct address codes: 495,147 / 487,728
- 五能線 resolves to line code 2146 and 43 current station points in source order
- 住吉 resolves to 9 current station identities before the existing 150 m physical-place grouping

These checks establish the pre-MariaDB baseline. Server import and API benchmarks remain the next deployment gate.

## Search policy

Station/line searches use indexed identity/name fields and bounded results. Address search prefers indexed component-prefix matches and only uses bounded contains fallback when needed. The browser never receives the complete address dataset.

Same-name station display distinguishes station identities from physical places. The existing 150 m grouping remains an application-derived view until a stronger place-identity rule is approved.

## Routes

- /geo/
- /geo/lab/
- /geo/explore/
- /geo/same-name/
- /geo/line/

GEO remains isolated from the active Portfolio City world-hierarchy migration until Layout Lock. Final illustration assets are deferred until then.

## Next gate

1. create/configure the Shin Free Server MariaDB database
2. apply apps/geo/database/schema.sql
3. import the normalized UTF-8 CSVs
4. run count + 五能線 / 住吉 / 七日町 smoke queries
5. connect the protected PDO config
6. benchmark the read-only APIs
7. migrate DATA LAB v9 from embedded data to the API
