# MariaDB import runbook

## 1. Create the tables

Run `schema.sql` in phpMyAdmin for the database reserved for GEO.

Do not place database credentials in Git.

## 2. Prepare UTF-8 import files

The source files are cp932. Convert them with:

```text
python apps/geo/tools/prepare_geo_import.py \
  --stations /path/to/hLF-eki.csv \
  --lines /path/to/hLF-ensen.csv \
  --addresses /path/to/hmaf.csv \
  --output build/geo-import
```

The address dataset is split into 50,000-row files by default so phpMyAdmin does not need to accept one 44 MB upload.

Expected source counts for the 2026-09-19 dataset:

- geo_station_records: 11,147
- geo_line_records: 591
- geo_address_records: 495,147

## 3. Import order

1. `geo_line_records.csv`
2. `geo_station_records.csv`
3. `geo_address_records-01.csv` ... remaining address parts

Use UTF-8 / utf8mb4 and CSV with the first row as column names.

## 4. Verify

```sql
SELECT COUNT(*) FROM geo_line_records;
SELECT COUNT(*) FROM geo_station_records;
SELECT COUNT(*) FROM geo_address_records;

SELECT COUNT(DISTINCT station_code) FROM geo_station_records;
SELECT COUNT(DISTINCT line_code) FROM geo_line_records;
SELECT COUNT(DISTINCT address_code) FROM geo_address_records;
```

Expected distinct counts:

- station_code: 10,860
- line_code: 554
- address_code: 487,728

The lower distinct counts are intentional. Source line codes and address codes can repeat and must not be deduplicated during import.
