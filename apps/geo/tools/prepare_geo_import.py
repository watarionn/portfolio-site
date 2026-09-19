#!/usr/bin/env python3
"""Prepare cp932 GEO source CSVs for MariaDB/phpMyAdmin import.

No source dataset is committed to the repository.

Example:
    python apps/geo/tools/prepare_geo_import.py \
      --stations /path/to/hLF-eki.csv \
      --lines /path/to/hLF-ensen.csv \
      --addresses /path/to/hmaf.csv \
      --output build/geo-import
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

STATION_COLUMNS = [
    "station_code", "line_code", "line_name", "line_name_short",
    "line_name_abbrev", "line_reading", "corp_type", "station_name",
    "station_reading", "longitude", "latitude", "prefecture_code",
]
LINE_COLUMNS = [
    "line_code", "line_name", "line_name_short",
    "line_name_abbrev", "line_reading", "corp_type",
]
ADDRESS_COLUMNS = [
    "address_code", "postal_code", "prefecture_code", "prefecture_name",
    "municipality_name", "town_name", "block_name", "prefecture_kana",
    "municipality_kana", "town_kana", "block_kana", "street_name_flag",
    "common_name_flag", "is_last",
]


def clean(value: str | None) -> str:
    return "" if value is None else value.strip()


def write_rows(source: Path, output: Path, transform, columns, chunk_size: int | None = None):
    count = 0
    part = 0
    writer = None
    handle = None

    def open_part():
        nonlocal part, writer, handle
        if handle:
            handle.close()
        part += 1
        target = output if chunk_size is None else output.with_name(f"{output.stem}-{part:02d}{output.suffix}")
        handle = target.open("w", encoding="utf-8", newline="")
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()

    open_part()
    try:
        with source.open("r", encoding="cp932", newline="") as src:
            for raw in csv.DictReader(src):
                if chunk_size and count and count % chunk_size == 0:
                    open_part()
                writer.writerow(transform(raw))
                count += 1
    finally:
        if handle:
            handle.close()
    return count, part


def station_row(r):
    return dict(zip(STATION_COLUMNS, [
        clean(r.get("EKICD")), clean(r.get("ENSCD")), clean(r.get("ENSNM")),
        clean(r.get("ENSNM2")), clean(r.get("ENSNM3")), clean(r.get("ENSNMK")),
        clean(r.get("CORP_TYPE")), clean(r.get("EKINM")), clean(r.get("EKINMK")),
        clean(r.get("LNG")), clean(r.get("LAT")), clean(r.get("JUCD")),
    ]))


def line_row(r):
    return dict(zip(LINE_COLUMNS, [
        clean(r.get("ENSCD")), clean(r.get("ENSNM")), clean(r.get("ENSNM2")),
        clean(r.get("ENSNM3")), clean(r.get("ENSNMK")), clean(r.get("CORP_TYPE")),
    ]))


def address_row(r):
    code = clean(r.get("JUCD"))
    return dict(zip(ADDRESS_COLUMNS, [
        code, clean(r.get("POST_POSTCD")), code[:2], clean(r.get("JUNM1")),
        clean(r.get("JUNM2")), clean(r.get("JUNM3")), clean(r.get("JUNM4")),
        clean(r.get("JUNMK1")), clean(r.get("JUNMK2")), clean(r.get("JUNMK3")),
        clean(r.get("JUNMK4")), clean(r.get("TOORINA_FLAG")),
        clean(r.get("TUUSHOU_FLAG")), clean(r.get("IS_LAST")),
    ]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stations", required=True, type=Path)
    parser.add_argument("--lines", required=True, type=Path)
    parser.add_argument("--addresses", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--address-chunk-size", type=int, default=50000)
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)

    station_count, _ = write_rows(
        args.stations, args.output / "geo_station_records.csv",
        station_row, STATION_COLUMNS
    )
    line_count, _ = write_rows(
        args.lines, args.output / "geo_line_records.csv",
        line_row, LINE_COLUMNS
    )
    address_count, address_parts = write_rows(
        args.addresses, args.output / "geo_address_records.csv",
        address_row, ADDRESS_COLUMNS, args.address_chunk_size
    )

    manifest = {
        "encoding": "utf-8",
        "station_records": station_count,
        "line_records": line_count,
        "address_records": address_count,
        "address_parts": address_parts,
        "address_chunk_size": args.address_chunk_size,
    }
    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
