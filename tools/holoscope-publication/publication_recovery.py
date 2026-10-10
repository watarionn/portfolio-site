"""Retry an interrupted HoloScope production deployment after restart."""
from pathlib import Path
import json
import re
import urllib.request

import publication_production_auto as auto


def run():
    config = auto.read(auto.CONFIG)
    release_id = config["releaseId"]
    release = auto.RELEASES / release_id
    expected = auto.read(release / "manifest.json")["counts"]["streams"]
    site = auto.URL + "/holoscope/streams/"
    try:
        page = urllib.request.urlopen(site, timeout=30).read().decode("utf-8", errors="replace")
        match = re.search(r"(\d+)件\s*[·・]\s*\d+/\d+ページ", page)
        live_count = int(match.group(1)) if match else None
    except Exception:
        live_count = None
    if live_count == expected:
        return {"status": "CURRENT_RELEASE_LIVE", "release": release_id, "count": expected}
    stream_dir = release / "streams"
    all_slugs = [p.stem for p in stream_dir.glob("*.json") if p.stem != "index"]
    previous = []
    for candidate in auto.RELEASES.iterdir():
        if candidate.is_dir() and candidate.name != release_id and (candidate / "manifest.json").is_file():
            try:
                count = auto.read(candidate / "manifest.json")["counts"]["streams"]
            except Exception:
                continue
            if count < expected:
                previous.append((count, candidate))
    if previous:
        older = max(previous, key=lambda x: x[0])[1]
        old_slugs = {p.stem for p in (older / "streams").glob("*.json")}
        slugs = sorted(set(all_slugs) - old_slugs)
    else:
        slugs = all_slugs[-3:]
    if not slugs:
        raise RuntimeError("No article slugs available for live verification")
    auto.deploy_and_verify(slugs, expected)
    return {"status": "RECOVERED_LIVE", "release": release_id, "count": expected, "verified": slugs}


if __name__ == "__main__":
    print(json.dumps(run(), ensure_ascii=False))
