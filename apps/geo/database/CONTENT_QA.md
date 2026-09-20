# GEO semantic import QA

This file records semantic checks against the normalized UTF-8 import package that was loaded into production MariaDB.

## Snapshot gate

Production phpMyAdmin count verification on 2026-09-20 matched the package exactly:

- geo_lines: 554
- geo_stations: 10,860
- geo_station_lines: 10,860
- geo_addresses: 495,147
- distinct address_code: 487,728

## Semantic checks from the exact normalized package

### Gono Line

- line_code: `2146`
- line_name: `五能線`
- normalized station points: **43**

This matches the Forest F traveler expectation.

### Sumiyoshi

The normalized station master contains **9 station identities** named `住吉`.

The production `same-name.php` algorithm groups station coordinates using a 150 m connected-component radius. Applying the same rule to the package yields **6 places**:

- Tokyo: 2 station identities grouped
- Kobe / JR + Rokko Liner: 2 grouped
- Hanshin: 1
- Osaka / Hankai + Uemachi: 2 grouped
- Kumamoto: 1
- Nagasaki: 1

Expected API smoke result for `same-name.php?q=住吉`:
- station_count: 9
- place_count: 6
- grouping_radius_m: 150

### Nanokamachi / 七日町

Searching exact `town_name = '七日町'` or `block_name = '七日町'` in the normalized address package yields **17 records**.

Representative rows include:
- 秋田県仙北市角館町 七日町, reading `ﾅﾉｶﾏﾁ`
- 山形県山形市 七日町, reading `ﾅﾇｶﾏﾁ`

This confirms that the source intentionally contains different readings for the same kanji and that the normalized UTF-8 package preserves both kanji and kana data.

## Gate status

- Source normalization: PASS
- Production row-count verification: PASS
- Semantic package QA: PASS
- Remaining gate: production PHP API connection and HTTP smoke tests
