-- Along-line / station / address DATA LAB
-- MariaDB production schema. Source CSV files are CP932 and must be converted
-- to UTF-8 during the import step, not served directly from the public web root.

CREATE TABLE geo_lines (
  line_code INT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  name_alt VARCHAR(64) NOT NULL,
  name_short VARCHAR(32) NOT NULL,
  name_kana VARCHAR(96) NOT NULL,
  corp_type VARCHAR(8) NOT NULL,
  PRIMARY KEY (line_code),
  KEY idx_geo_lines_name (name),
  KEY idx_geo_lines_kana (name_kana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE geo_stations (
  station_code INT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  name_kana VARCHAR(96) NOT NULL,
  longitude DECIMAL(10,6) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  prefecture_code CHAR(2) NOT NULL,
  PRIMARY KEY (station_code),
  KEY idx_geo_stations_name (name),
  KEY idx_geo_stations_kana (name_kana),
  KEY idx_geo_stations_prefecture (prefecture_code),
  KEY idx_geo_stations_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE geo_station_lines (
  station_code INT UNSIGNED NOT NULL,
  line_code INT UNSIGNED NOT NULL,
  source_order INT UNSIGNED NOT NULL,
  PRIMARY KEY (station_code, line_code),
  KEY idx_geo_station_lines_line (line_code, source_order),
  CONSTRAINT fk_geo_station_lines_station FOREIGN KEY (station_code)
    REFERENCES geo_stations (station_code) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_geo_station_lines_line FOREIGN KEY (line_code)
    REFERENCES geo_lines (line_code) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE geo_addresses (
  address_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  address_code CHAR(11) NOT NULL,
  postal_code CHAR(7) NULL,
  prefecture VARCHAR(16) NOT NULL,
  municipality VARCHAR(32) NOT NULL,
  locality VARCHAR(64) NOT NULL,
  detail VARCHAR(64) NOT NULL,
  prefecture_kana VARCHAR(32) NOT NULL,
  municipality_kana VARCHAR(64) NOT NULL,
  locality_kana VARCHAR(96) NOT NULL,
  detail_kana VARCHAR(96) NOT NULL,
  street_name_flag TINYINT(1) NOT NULL,
  common_name_flag TINYINT(1) NOT NULL,
  is_last TINYINT(1) NOT NULL,
  PRIMARY KEY (address_id),
  KEY idx_geo_addresses_code (address_code),
  KEY idx_geo_addresses_postal (postal_code),
  KEY idx_geo_addresses_pref_muni (prefecture, municipality),
  KEY idx_geo_addresses_locality (locality),
  KEY idx_geo_addresses_muni_locality (municipality, locality),
  KEY idx_geo_addresses_locality_kana (locality_kana)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
