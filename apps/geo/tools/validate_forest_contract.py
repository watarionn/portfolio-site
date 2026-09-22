#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FOREST = ROOT / "apps/geo/public/data/forest.json"
SPECIALS = ROOT / "apps/geo/public/data/special-experiences.json"


def main() -> int:
    forest = json.loads(FOREST.read_text(encoding="utf-8"))
    specials = json.loads(SPECIALS.read_text(encoding="utf-8"))
    special_ids = {item["id"] for item in specials.get("experiences", [])}
    errors: list[str] = []
    item_count = 0

    if forest.get("schemaVersion") != 2:
        errors.append("forest schemaVersion must be 2")
    if forest.get("bindingVersion") != 1:
        errors.append("forest bindingVersion must be 1")

    for area_id, area in forest.get("areas", {}).items():
        special_id = area.get("specialExperienceId")
        if special_id and special_id not in special_ids:
            errors.append(f"{area_id}: unknown specialExperienceId {special_id}")

        for item in area.get("items", []):
            item_count += 1
            item_id = item.get("id", "?")
            if "reading" in item:
                errors.append(f"{area_id}/{item_id}: reading must come from MariaDB, not forest.json")
            if not isinstance(item.get("choices"), list) or len(item["choices"]) < 2:
                errors.append(f"{area_id}/{item_id}: choices missing")
            binding = item.get("binding")
            if not isinstance(binding, dict):
                errors.append(f"{area_id}/{item_id}: binding missing")
                continue

            if item.get("type") == "station":
                code = str(binding.get("stationCode", ""))
                if binding.get("kind") != "station" or len(code) != 7 or not code.isdigit():
                    errors.append(f"{area_id}/{item_id}: invalid station binding")
            elif item.get("type") == "address":
                record_id = binding.get("addressRecordId")
                if binding.get("kind") != "address" or not isinstance(record_id, int) or record_id <= 0:
                    errors.append(f"{area_id}/{item_id}: invalid address binding")
            else:
                errors.append(f"{area_id}/{item_id}: unknown item type")

    if item_count != 41:
        errors.append(f"expected 41 authored forest items, got {item_count}")

    if errors:
        for error in errors:
            print("FAIL", error)
        return 1

    print(f"forest contract passed: {item_count} items, {len(special_ids)} special experiences")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
