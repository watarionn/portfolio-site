#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITY = ROOT / "portfolio-city"

EXPECTED_DISTRICTS = {
    "observatory-hill": {"holoscope", "sphere", "prime-dot-art"},
    "archive-street": {"yorei", "actress-finder", "cheatsheet", "shisha"},
    "workshop-alley": {"dqb2", "madori", "maze-maker", "anagram"},
    "waterside-play": {"aquarium", "holoca", "word-generator"},
}

EXPECTED_ROUTES = {
    "holoscope": "/holoscope/",
    "sphere": "/SPHERE/sphere.html",
    "prime-dot-art": "/PRIME_DOT_ART/prime_dot_art.html",
    "yorei": "/YOREI/yorei.html",
    "actress-finder": "/OTHER/actress_finder.html",
    "cheatsheet": "/CHEATSHEET/",
    "shisha": "/SHISHA/",
    "dqb2": "/DQB2/dqb2.html",
    "madori": "/MADORI/madori.html",
    "maze-maker": "/MAZE_MAKER/maze_maker.html",
    "anagram": "/ANAGRAM/anagram.html",
    "aquarium": "/AQUARIUM/aquarium.php",
    "holoca": "/HOLOCA/holoca.html",
    "word-generator": "/WORD_GENERATOR/word_generator.html",
}

REQUIRED_FILES = {
    "portfolio-city/index.html",
    "portfolio-city/city.html",
    "portfolio-city/city.css",
    "portfolio-city/city.js",
    "portfolio-city/data/projects.json",
    "portfolio-city/data/districts.json",
    "portfolio-city/assets/README.md",
    "portfolio-city/assets/buildings/.gitkeep",
    "portfolio-city/assets/landmarks/.gitkeep",
    "portfolio-city/assets/characters/.gitkeep",
    "portfolio-city/assets/environment/.gitkeep",
    "tools/check_portfolio_city_runtime.mjs",
}


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: Portfolio City contract: {message}")


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path.relative_to(ROOT)}: {exc}")


def main() -> int:
    missing = sorted(path for path in REQUIRED_FILES if not (ROOT / path).is_file())
    if missing:
        fail("missing foundation files: " + ", ".join(missing))

    project_payload = load_json(CITY / "data/projects.json")
    district_payload = load_json(CITY / "data/districts.json")
    if project_payload.get("schemaVersion") != 1:
        fail("projects schemaVersion must be 1")
    if district_payload.get("schemaVersion") != 1:
        fail("districts schemaVersion must be 1")

    projects = project_payload.get("projects")
    districts = district_payload.get("districts")
    if not isinstance(projects, list) or len(projects) != 14:
        fail("exactly 14 projects are required")
    if not isinstance(districts, list) or len(districts) != 4:
        fail("exactly 4 districts are required")

    district_ids = [item.get("id") for item in districts if isinstance(item, dict)]
    if len(district_ids) != len(set(district_ids)) or set(district_ids) != set(EXPECTED_DISTRICTS):
        fail("district IDs differ from the Phase 3.1 plan")

    project_ids = [item.get("id") for item in projects if isinstance(item, dict)]
    if len(project_ids) != len(set(project_ids)) or set(project_ids) != set(EXPECTED_ROUTES):
        fail("project IDs differ from the locked 14-work inventory")

    actual_assignments: dict[str, set[str]] = {key: set() for key in EXPECTED_DISTRICTS}
    for project in projects:
        if not isinstance(project, dict):
            fail("every project must be an object")
        project_id = project.get("id")
        district_id = project.get("district")
        route = project.get("route")
        if district_id not in actual_assignments:
            fail(f"unknown district assignment for {project_id}: {district_id}")
        actual_assignments[district_id].add(project_id)
        if route != EXPECTED_ROUTES[project_id]:
            fail(f"route changed for {project_id}: {route}")
        if route.startswith("/SECRET/"):
            fail("SECRET must not be part of the 14-work city inventory")
        for required in ("title", "building", "type", "summary", "order"):
            if project.get(required) in (None, ""):
                fail(f"{project_id} is missing {required}")

    if actual_assignments != EXPECTED_DISTRICTS:
        fail("project-to-district assignments differ from the Phase 3.1 plan")

    html = (CITY / "city.html").read_text(encoding="utf-8")
    for marker in ("MAP", "WORKS", "PROFILE", "CONTACT", 'id="cityMap"', 'id="projectInspector"', 'id="worksDirectory"'):
        if marker not in html:
            fail(f"city.html is missing required marker: {marker}")

    js = (CITY / "city.js").read_text(encoding="utf-8")
    for marker in ("portfolio-city.visited.v1", "localStorage", "ArrowRight", "ArrowLeft", "replaceChildren", "prefers-reduced-motion", "buildBuildingVisual"):
        if marker not in js:
            fail(f"city.js is missing required behavior: {marker}")
    if ".innerHTML" in js:
        fail("city.js must not render data with innerHTML")

    css = (CITY / "city.css").read_text(encoding="utf-8")
    for marker in ("@media (max-width: 680px)", "@media (prefers-reduced-motion: reduce)", ".district--north", ".district--south"):
        if marker not in css:
            fail(f"city.css is missing required responsive/map rule: {marker}")

    for project_id in EXPECTED_ROUTES:
        if f'data-project-id="{project_id}"' not in css:
            fail(f"city.css is missing a distinct Phase 3.2 building visual for {project_id}")

    deployment = load_json(ROOT / "config/deployment-map.json")
    matches = [entry for entry in deployment.get("entries", []) if entry.get("id") == "portfolio-city"]
    if matches != [{"id": "portfolio-city", "sourceRoot": "portfolio-city", "productionRoot": "portfolio-city"}]:
        fail("deployment map must contain exactly one portfolio-city entry")

    validation_workflow = (ROOT / ".github/workflows/validate-public.yml").read_text(encoding="utf-8")
    if "node tools/check_portfolio_city_runtime.mjs" not in validation_workflow:
        fail("validate-public workflow must run the Portfolio City runtime contract")

    print("Portfolio City Phase 3.2 contract passed: 14 works / 4 districts / 14 handcrafted visuals / runtime guard")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
