-- Run after apps/geo/database/schema.sql and normalized CSV import.
SET NAMES utf8mb4;

SELECT 'geo_lines' AS metric, COUNT(*) AS value FROM geo_lines
UNION ALL SELECT 'geo_stations', COUNT(*) FROM geo_stations
UNION ALL SELECT 'geo_station_lines', COUNT(*) FROM geo_station_lines
UNION ALL SELECT 'geo_addresses', COUNT(*) FROM geo_addresses
UNION ALL SELECT 'distinct_address_codes', COUNT(DISTINCT address_code) FROM geo_addresses;

-- Expected: 554 / 10860 / 10860 / 495147 / 487728.

SELECT l.line_code, l.line_name, COUNT(sl.station_code) AS station_count
FROM geo_lines l
JOIN geo_station_lines sl ON sl.line_code=l.line_code
WHERE l.line_name='五能線'
GROUP BY l.line_code,l.line_name;

SELECT s.station_code,s.station_name,s.station_reading,s.prefecture_code,
       s.latitude,s.longitude,GROUP_CONCAT(l.line_name ORDER BY sl.source_order SEPARATOR ' / ') AS line_names
FROM geo_stations s
LEFT JOIN geo_station_lines sl ON sl.station_code=s.station_code
LEFT JOIN geo_lines l ON l.line_code=sl.line_code
WHERE s.station_name='住吉'
GROUP BY s.station_code,s.station_name,s.station_reading,s.prefecture_code,s.latitude,s.longitude
ORDER BY s.prefecture_code,s.station_code;

SELECT address_code,postal_code,prefecture_name,municipality_name,town_name,block_name,
       prefecture_kana,municipality_kana,town_kana,block_kana
FROM geo_addresses
WHERE town_name='七日町' OR block_name='七日町'
LIMIT 30;
