# 沿線・駅・住所 Production Architecture: MariaDB

Status: implementation baseline
Date: 2026-09-19

## Source audit

The three adopted CP932 CSV masters were inspected directly.

| source | rows | role |
| --- | ---: | --- |
| hLF-ensen.csv | 591 | railway lines |
| hLF-eki.csv | 11,147 | station-line records |
| hmaf.csv | 495,147 | address records |

hLF-eki contains 10,860 unique EKICD values. EKICD is therefore a station identity, while the 11,147 source rows express station-to-line membership. 279 station codes occur on more than one source row.

hmaf contains 487,728 unique JUCD values across 495,147 rows. JUCD is therefore not safe as the sole primary key. The production address table uses a surrogate address_id and indexes address_code separately.

## Boundary

MariaDB owns factual geography data:

- geo_lines
- geo_stations
- geo_station_lines
- geo_addresses

JSON owns authored experience data:

- forest graph and intentional G -> G self-loop
- landmarks and questions
- special experience definitions

Browser localStorage owns the exploration notebook. No user database is introduced in this phase.

## Import contract

Source CSV files remain master inputs and are not published below the web root.

1. Read source as CP932.
2. Convert text to UTF-8.
3. Load geo_lines from hLF-ensen.csv.
4. Load geo_stations by unique EKICD from hLF-eki.csv.
5. Load geo_station_lines from every unique EKICD + ENSCD pair.
6. Load every hmaf.csv row into geo_addresses.
7. Verify counts before cutover.

Expected validation counts:

- geo_lines: 591
- geo_stations: 10,860
- station source records: 11,147
- geo_addresses: 495,147

The station-line junction count is verified from the normalized import rather than assumed from raw row count.

## PHP boundary

Production PHP connects to MariaDB with PDO. Credentials live only in a server-side config file excluded from Git/deployment. Public endpoints return JSON and never expose SQL errors or credentials.

Planned endpoints:

- /geo/api/stations.php?q=
- /geo/api/lines.php?q=
- /geo/api/addresses.php?q=
- /geo/api/same-name.php?name=

Search input is trimmed, length-limited, and passed only through prepared statements. Result counts are capped and pagination is explicit.

## Search policy

Station and line lookup can use indexed exact/prefix matching first, with contained-text matching as a secondary path.

Address search must not scan the CP932 CSV at request time. Queries should prefer structured indexed fields (prefecture / municipality / locality / postal code). A later normalization column may be added after real query profiling; it is deliberately not invented before the first MariaDB benchmark.

## Deployment safety

Do not commit database credentials, phpMyAdmin exports containing secrets, or the 44 MB address master into the public deployment tree.

phpMyAdmin is an administration surface only. The application connects directly to MariaDB through PDO.

This architecture is independent of the active Phase 3.9 World Map PR. No production merge/deploy is authorized by this document.

## Next gate

1. create reproducible CP932 -> UTF-8 import tooling
2. add server-side config.example.php + PDO bootstrap
3. implement read-only API endpoints
4. import into the Shin Free Server MariaDB instance
5. run count/query benchmarks
6. migrate v9 DATA LAB to the API
7. JSON-ize EXPLORE
8. responsive QA at 1440 / 820 / 390
9. Layout Lock
