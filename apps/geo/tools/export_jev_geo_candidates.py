#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen


DEFAULT_API_BASE = "https://cf278796.cloudfree.jp/geo/api"


def get_json(api_base: str, path: str, params: dict[str, Any]) -> dict[str, Any]:
    url = api_base.rstrip("/") + "/" + path + "?" + urlencode(params)
    with urlopen(url, timeout=30) as response:
        value = json.loads(response.read().decode("utf-8"))
    if not isinstance(value, dict):
        raise ValueError("Geo API response must be an object")
    return value


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1 = a
    lat2, lon2 = b
    radius = 6371000.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(min(1.0, math.sqrt(x)))


def cluster_count(rows: list[dict[str, Any]], radius_m: float) -> int:
    points = [
        (float(row["latitude"]), float(row["longitude"]))
        for row in rows
        if row.get("latitude") not in (None, "")
        and row.get("longitude") not in (None, "")
    ]
    clusters: list[list[tuple[float, float]]] = []
    for point in points:
        for cluster in clusters:
            if haversine_m(point, cluster[0]) <= radius_m:
                cluster.append(point)
                break
        else:
            clusters.append([point])
    return len(clusters)


def station_facts_from_rows(name: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    exact = [row for row in rows if row.get("station_name") == name]
    if not exact:
        raise ValueError(f"station not found: {name}")

    readings = sorted({
        str(row.get("station_reading") or "")
        for row in exact
        if row.get("station_reading")
    })
    lines: set[str] = set()
    for row in exact:
        for line in str(row.get("line_names") or "").split("/"):
            line = line.strip()
            if line:
                lines.add(line)

    return {
        "name": name,
        "reading": readings[0] if readings else "",
        "record_count": len(exact),
        "reading_variant_count": len(readings),
        "reading_variants": readings,
        "physical_location_count_150m": cluster_count(exact, 150.0),
        "distinct_geography_count": cluster_count(exact, 3000.0),
        "line_count": len(lines),
        "line_names": sorted(lines),
    }


def fetch_station_facts(name: str, api_base: str = DEFAULT_API_BASE) -> dict[str, Any]:
    data = get_json(api_base, "stations.php", {"q": name, "limit": 100})
    return station_facts_from_rows(name, list(data.get("results") or []))


def build_export(names: list[str], api_base: str = DEFAULT_API_BASE) -> dict[str, Any]:
    candidates = [fetch_station_facts(name, api_base) for name in names]
    return {
        "contract": "geo-discovery-jev-advisory-v1",
        "mode": "advisory_only",
        "api_base": api_base,
        "candidates": candidates,
        "authority": {
            "write_database": False,
            "write_forest_json": False,
            "change_station_identity": False,
            "change_reading": False,
            "change_geography": False,
            "change_ui": False,
            "automatic_selection": False,
        },
        "source_truth": "existing Geo API / MariaDB",
    }


def parse_names(args: argparse.Namespace) -> list[str]:
    values: list[str] = []
    if args.name:
        values.extend(args.name)
    if args.names_file:
        raw = json.loads(args.names_file.read_text(encoding="utf-8-sig"))
        if isinstance(raw, dict):
            values.extend(str(x) for x in (raw.get("names") or []))
        elif isinstance(raw, list):
            values.extend(str(x) for x in raw)
        else:
            raise ValueError("names file must be an array or object with names")
    names = [value.strip() for value in values if value.strip()]
    if len(names) < 2:
        raise ValueError("at least two station names are required")
    if len(names) > 8:
        raise ValueError("at most eight station names are allowed")
    return names


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--name", action="append")
    p.add_argument("--names-file", type=Path)
    p.add_argument("--api-base", default=DEFAULT_API_BASE)
    p.add_argument("--output", type=Path)
    args = p.parse_args()

    value = build_export(parse_names(args), args.api_base)
    text = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
    else:
        print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
