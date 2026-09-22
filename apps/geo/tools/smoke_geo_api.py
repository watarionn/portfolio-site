#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "portfolio-geo-smoke/1.0"})
    with urllib.request.urlopen(req, timeout=20) as res:
        if res.status != 200:
            raise RuntimeError(f"{url}: HTTP {res.status}")
        return json.load(res)


def api(base: str, path: str, **query: object) -> dict:
    url = base.rstrip("/") + "/api/" + path
    if query:
        url += "?" + urllib.parse.urlencode(query)
    payload = get_json(url)
    if payload.get("ok") is not True:
        raise RuntimeError(f"{url}: API returned ok=false: {payload}")
    return payload


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--base", required=True, help="GEO public base URL, e.g. https://example.com/geo")
    a = p.parse_args()

    checks: list[tuple[str, bool, str]] = []

    stats = api(a.base, "stats.php")
    expected = {
        "stations": 10860,
        "station_lines": 10860,
        "lines": 554,
        "address_records": 495147,
        "address_codes": 487728,
    }
    actual = stats.get("stats", {})
    checks.append(("stats", actual == expected, f"actual={actual}"))

    gono = api(a.base, "line-stations.php", q="五能線")
    checks.append(("gono", gono.get("station_point_count") == 43, f"station_point_count={gono.get('station_point_count')}"))

    sumiyoshi = api(a.base, "same-name.php", q="住吉")
    sum_ok = (
        sumiyoshi.get("grouping_radius_m") == 150
        and sumiyoshi.get("station_count") == 9
        and sumiyoshi.get("place_count") == 6
    )
    checks.append(("sumiyoshi", sum_ok, f"station_count={sumiyoshi.get('station_count')} place_count={sumiyoshi.get('place_count')}"))

    nanoka = api(a.base, "addresses.php", q="七日町", limit=50)
    rows = nanoka.get("results", [])
    content_ok = any(r.get("town_name") == "七日町" or r.get("block_name") == "七日町" for r in rows)
    checks.append(("nanokamachi", content_ok, f"returned={len(rows)} mode={nanoka.get('mode')}"))

    failed = False
    for name, ok, detail in checks:
        print(f"{'PASS' if ok else 'FAIL'} {name}: {detail}")
        failed |= not ok
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
