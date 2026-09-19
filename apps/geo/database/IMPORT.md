# MariaDB import runbook

## 1. Create the tables

Run `schema.sql` in phpMyAdmin for the database reserved for GEO. Do not place database credentials in Git.

## 2. Prepare UTF-8 import files

The adopted source files are CP932. Convert and normalize them with:

```text
python apps/geo/tools/prepare_geo_import.py \
  --stations /path/to/hLF-eki.csv \
  --lines /path/to/hLF-ensen.csv \
  --addresses /path/to/hmaf.csv \
  --output build/geo-import
```

The address dataset is split into 50,000-row files by default.

The line/station masters include historical revisions that reuse ENSCD/EKICD. In the adopted snapshot the later occurrence is the newer record, so the importer uses the last source occurrence for each duplicated code. The raw source counts remain recorded in `manifest.json`.

Expected normalized counts:

- geo_lines: 554
- geo_stations: 10,860
- geo_station_lines: 10,860
- geo_addresses: 495,147
- distinct address_code: 487,728

Expected raw audit counts:

- hLF-ensen.csv: 591
- hLF-eki.csv: 11,147
- hmaf.csv: 495,147

The importer exits non-zero if these snapshot counts do not match.

## 3. Import order

1. `geo_lines.csv`
2. `geo_stations.csv`
3. `geo_station_lines.csv`
4. `geo_addresses-01.csv` ... remaining address parts

Use UTF-8 / utf8mb4 and CSV with the first row as column names.

## 4. Verify

```sql
SELECT COUNT(*) FROM geo_lines;
SELECT COUNT(*) FROM geo_stations;
SELECT COUNT(*) FROM geo_station_lines;
SELECT COUNT(*) FROM geo_addresses;
SELECT COUNT(DISTINCT address_code) FROM geo_addresses;
```

Expected: 554 / 10,860 / 10,860 / 495,147 / 487,728.

## 5. Smoke queries

```sql
SELECT station_code, station_name, station_reading
FROM geo_stations WHERE station_name = '住吉';

SELECT l.line_name, s.station_code, s.station_name
FROM geo_lines l
JOIN geo_station_lines sl ON sl.line_code = l.line_code
JOIN geo_stations s ON s.station_code = sl.station_code
WHERE l.line_name = '五能線'
ORDER BY sl.source_order;

SELECT address_code, prefecture_name, municipality_name, town_name, block_name
FROM geo_addresses
WHERE town_name LIKE '七日町%'
LIMIT 20;
```

Only after the count checks and smoke queries pass should the PHP API be pointed at the database.
