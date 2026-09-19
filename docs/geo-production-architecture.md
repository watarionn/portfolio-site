# 沿線・駅・住所 Production Architecture

Updated: 2026-09-19

## Decision

The production data layer uses the hosting MariaDB instance administered through phpMyAdmin.

CSV is an import source, not a browser/runtime database.

## Source audit

The three Drive sources were inspected directly as cp932 CSV.

| source | rows | important key behavior |
| --- | ---: | --- |
| hLF-eki.csv | 11,147 | EKICD has 10,860 distinct values |
| hLF-ensen.csv | 591 | ENSCD has 554 distinct values |
| hmaf.csv | 495,147 | JUCD has 487,728 distinct values |

Address JUCD is CHAR(11), not numeric. Some valid codes contain letters. It must never be cast to an integer.

Line codes and address codes are intentionally non-unique in the source. Surrogate record IDs preserve every source row.

## Runtime boundary

```text
cp932 CSV (Drive / local source)
        |
        v
prepare_geo_import.py
        |
        v
UTF-8 import chunks
        |
        v
MariaDB
  geo_station_records
  geo_line_records
  geo_address_records
        |
        v
PHP/PDO JSON API
        |
        +--> DATA LAB
        +--> same-name station experience
        +--> line traveler
        +--> EXPLORE data lookups
```

The forest topology, questions, authored landmarks, and special-experience links remain JSON because they are authored experience definitions rather than database facts.

## Address search

The first production implementation uses bounded component search and a strict result limit.

1. Prefer indexed prefix matches against prefecture / municipality / town / block.
2. If no prefix result exists, allow a bounded contains fallback.
3. Never return the full 495k-row dataset to the browser.
4. Benchmark on the actual hosting MariaDB before considering a custom n-gram index.

This deliberately avoids depending on a Japanese FULLTEXT parser/plugin that may not be configurable on shared hosting.

## Same-name stations

Do not equate source row count with physical station count. A station name can have multiple line records for one interchange.

The current Sumiyoshi prototype has 9 source rows and groups them into 6 displayed points using the existing 150 m trial rule. Production grouping remains an application-level derived view until a stable station-place identity rule is approved.

## Portfolio City integration

Target public routes:

- /geo/
- /geo/lab/
- /geo/explore/
- /geo/same-name/
- /geo/line/

The GEO implementation should remain isolated from the active Portfolio City world-hierarchy migration until its own Layout Lock. Registration into Portfolio City's project inventory is a later integration step.

Final Portfolio City illustration assets are not produced during this architecture phase.
