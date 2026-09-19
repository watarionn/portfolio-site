-- GEO / 沿線・駅・住所
-- MariaDB 10.5+ compatible baseline.
-- Source CSVs are cp932; import-prepared files are UTF-8.
-- Source codes are intentionally NOT declared unique.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS geo_station_records (
    station_record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    station_code CHAR(7) NOT NULL,
    line_code CHAR(4) NOT NULL,
    line_name VARCHAR(64) NOT NULL,
    line_name_short VARCHAR(32) NULL,
    line_name_abbrev VARCHAR(32) NULL,
    line_reading VARCHAR(96) NULL,
    corp_type VARCHAR(8) NULL,
    station_name VARCHAR(64) NOT NULL,
    station_reading VARCHAR(96) NULL,
    longitude DECIMAL(10,6) NULL,
    latitude DECIMAL(9,6) NULL,
    prefecture_code CHAR(2) NULL,
    PRIMARY KEY (station_record_id),
    KEY idx_geo_station_code (station_code),
    KEY idx_geo_station_name (station_name),
    KEY idx_geo_station_reading (station_reading),
    KEY idx_geo_station_line (line_code),
    KEY idx_geo_station_prefecture (prefecture_code),
    KEY idx_geo_station_position (longitude, latitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geo_line_records (
    line_record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    line_code CHAR(4) NOT NULL,
    line_name VARCHAR(64) NOT NULL,
    line_name_short VARCHAR(32) NULL,
    line_name_abbrev VARCHAR(32) NULL,
    line_reading VARCHAR(96) NULL,
    corp_type VARCHAR(8) NULL,
    PRIMARY KEY (line_record_id),
    KEY idx_geo_line_code (line_code),
    KEY idx_geo_line_name (line_name),
    KEY idx_geo_line_short (line_name_short),
    KEY idx_geo_line_reading (line_reading)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geo_address_records (
    address_record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    address_code CHAR(11) NOT NULL,
    postal_code CHAR(7) NULL,
    prefecture_code CHAR(2) NOT NULL,
    prefecture_name VARCHAR(16) NOT NULL,
    municipality_name VARCHAR(48) NULL,
    town_name VARCHAR(64) NULL,
    block_name VARCHAR(64) NULL,
    prefecture_kana VARCHAR(32) NOT NULL,
    municipality_kana VARCHAR(64) NULL,
    town_kana VARCHAR(96) NULL,
    block_kana VARCHAR(96) NULL,
    street_name_flag TINYINT UNSIGNED NOT NULL DEFAULT 0,
    common_name_flag TINYINT UNSIGNED NOT NULL DEFAULT 0,
    is_last TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (address_record_id),
    KEY idx_geo_address_code (address_code),
    KEY idx_geo_address_postal (postal_code),
    KEY idx_geo_address_prefecture (prefecture_code),
    KEY idx_geo_address_pref_name (prefecture_name),
    KEY idx_geo_address_municipality (municipality_name),
    KEY idx_geo_address_town (town_name),
    KEY idx_geo_address_block (block_name),
    KEY idx_geo_address_municipality_kana (municipality_kana),
    KEY idx_geo_address_town_kana (town_kana),
    KEY idx_geo_address_last (is_last)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
