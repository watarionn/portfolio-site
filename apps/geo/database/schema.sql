-- GEO / 沿線・駅・住所 normalized MariaDB schema
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS geo_lines (
 line_code CHAR(4) NOT NULL, line_name VARCHAR(64) NOT NULL, line_name_short VARCHAR(32) NULL,
 line_name_abbrev VARCHAR(32) NULL, line_reading VARCHAR(96) NULL, corp_type VARCHAR(8) NULL,
 PRIMARY KEY(line_code), KEY idx_geo_lines_name(line_name), KEY idx_geo_lines_reading(line_reading)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geo_stations (
 station_code CHAR(7) NOT NULL, station_name VARCHAR(64) NOT NULL, station_reading VARCHAR(96) NULL,
 longitude DECIMAL(10,6) NULL, latitude DECIMAL(9,6) NULL, prefecture_code CHAR(2) NULL,
 PRIMARY KEY(station_code), KEY idx_geo_stations_name(station_name), KEY idx_geo_stations_reading(station_reading),
 KEY idx_geo_stations_pref(prefecture_code), KEY idx_geo_stations_position(latitude,longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geo_station_lines (
 station_code CHAR(7) NOT NULL, line_code CHAR(4) NOT NULL, source_order INT UNSIGNED NOT NULL,
 PRIMARY KEY(station_code,line_code), KEY idx_geo_station_lines_line(line_code,source_order),
 CONSTRAINT fk_geo_sl_station FOREIGN KEY(station_code) REFERENCES geo_stations(station_code) ON UPDATE CASCADE ON DELETE CASCADE,
 CONSTRAINT fk_geo_sl_line FOREIGN KEY(line_code) REFERENCES geo_lines(line_code) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS geo_addresses (
 address_record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, address_code CHAR(11) NOT NULL, postal_code CHAR(7) NULL,
 prefecture_code CHAR(2) NOT NULL, prefecture_name VARCHAR(16) NOT NULL, municipality_name VARCHAR(48) NULL,
 town_name VARCHAR(64) NULL, block_name VARCHAR(64) NULL, prefecture_kana VARCHAR(32) NOT NULL,
 municipality_kana VARCHAR(64) NULL, town_kana VARCHAR(96) NULL, block_kana VARCHAR(96) NULL,
 street_name_flag TINYINT UNSIGNED NOT NULL DEFAULT 0, common_name_flag TINYINT UNSIGNED NOT NULL DEFAULT 0,
 is_last TINYINT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY(address_record_id),
 KEY idx_geo_addr_code(address_code), KEY idx_geo_addr_postal(postal_code), KEY idx_geo_addr_pref_muni(prefecture_name,municipality_name),
 KEY idx_geo_addr_town(town_name), KEY idx_geo_addr_block(block_name), KEY idx_geo_addr_muni_kana(municipality_kana), KEY idx_geo_addr_town_kana(town_kana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
