#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITY = ROOT / "portfolio-city"

EXPECTED_DISTRICTS = {
    "observatory-hill": {"holoscope", "sphere", "prime-dot-art"},
    "archive-street": {"yorei", "actress-finder", "cheatsheet", "shisha"},
    "workshop-alley": {"dqb2", "madori", "maze-maker", "anagram", "mindmap-maker"},
    "waterside-play": {"aquarium", "holoca", "word-generator"},
}

ENVIRONMENT_ASSETS = {
    "mountains.svg", "cloud.svg", "tree-cluster.svg", "fountain.svg",
    "market-stall.svg", "reeds.svg", "person.svg", "flowerbed.svg",
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
    "mindmap-maker": "/MINDMAP_MAKER/",
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
    "portfolio-city/data/map-layout.json",
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
    layout_payload = load_json(CITY / "data/map-layout.json")
    if project_payload.get("schemaVersion") != 1:
        fail("projects schemaVersion must be 1")
    if district_payload.get("schemaVersion") != 1:
        fail("districts schemaVersion must be 1")
    if layout_payload.get("schemaVersion") != 1:
        fail("map-layout schemaVersion must be 1")

    projects = project_payload.get("projects")
    districts = district_payload.get("districts")
    if not isinstance(projects, list) or len(projects) != 15:
        fail("exactly 15 projects are required")
    if not isinstance(districts, list) or len(districts) != 4:
        fail("exactly 4 districts are required")

    district_ids = [item.get("id") for item in districts if isinstance(item, dict)]
    if len(district_ids) != len(set(district_ids)) or set(district_ids) != set(EXPECTED_DISTRICTS):
        fail("district IDs differ from the Phase 3.1 plan")

    project_ids = [item.get("id") for item in projects if isinstance(item, dict)]
    if len(project_ids) != len(set(project_ids)) or set(project_ids) != set(EXPECTED_ROUTES):
        fail("project IDs differ from the locked 15-work inventory")

    for project_id in EXPECTED_ROUTES:
        svg_path = CITY / "assets/buildings" / f"{project_id}.svg"
        if not svg_path.is_file():
            fail(f"missing illustrated building asset: {project_id}.svg")
        svg_text = svg_path.read_text(encoding="utf-8")
        if "<svg" not in svg_text or "viewBox=" not in svg_text:
            fail(f"invalid illustrated building asset: {project_id}.svg")

    for asset_name in ENVIRONMENT_ASSETS:
        svg_path = CITY / "assets/environment" / asset_name
        if not svg_path.is_file():
            fail(f"missing Phase 3.4 environment asset: {asset_name}")
        svg_text = svg_path.read_text(encoding="utf-8")
        if "<svg" not in svg_text or "viewBox=" not in svg_text:
            fail(f"invalid Phase 3.4 environment asset: {asset_name}")

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
            fail("SECRET must not be part of the 15-work city inventory")
        for required in ("title", "building", "type", "summary", "order"):
            if project.get(required) in (None, ""):
                fail(f"{project_id} is missing {required}")

    if actual_assignments != EXPECTED_DISTRICTS:
        fail("project-to-district assignments differ from the Phase 3.1 plan")

    world = layout_payload.get("world", {})
    if world.get("chunkWidth") != 1024 or world.get("chunkHeight") != 768:
        fail("logical chunk size must remain 1024 x 768")
    if {k: world.get(k) for k in ("minX", "minY", "width", "height")} != {"minX": -1024, "minY": -768, "width": 5120, "height": 3840}:
        fail("Phase 3.6 R5 world bounds must match the locked negative-origin world")
    chunks = layout_payload.get("chunks")
    expected_chunk_ids = {"1:-1", "0:0", "1:0", "2:0", "-1:1", "0:1", "1:1", "2:1", "3:1", "0:2", "1:2", "2:2", "1:3"}
    if not isinstance(chunks, list) or len(chunks) != 13:
        fail("Phase 3.6 R5 must register exactly 13 terrain chunks")
    chunk_ids = [item.get("id") for item in chunks if isinstance(item, dict)]
    if set(chunk_ids) != expected_chunk_ids or len(chunk_ids) != len(set(chunk_ids)):
        fail("map-layout chunk IDs must match the locked 13-chunk topology")
    for chunk in chunks:
        image = chunk.get("image")
        if not image or not (CITY / image).is_file():
            fail(f"missing registered terrain asset for chunk {chunk.get('id')}: {image}")
    placements = layout_payload.get("projectPlacements")
    if not isinstance(placements, list) or len(placements) != 15:
        fail("map-layout must contain exactly one placement per current project")
    placement_ids = [item.get("projectId") for item in placements if isinstance(item, dict)]
    if set(placement_ids) != set(EXPECTED_ROUTES) or len(placement_ids) != len(set(placement_ids)):
        fail("map-layout placements must match the locked 15-work inventory exactly once")
    if any(item.get("anchor") != "bottom-center" for item in placements):
        fail("all Phase 3.5 project placements must use bottom-center anchors")
    regions = layout_payload.get("districtRegions")
    region_ids = [item.get("districtId") for item in regions or [] if isinstance(item, dict)]
    if set(region_ids) != set(EXPECTED_DISTRICTS) or len(region_ids) != 4:
        fail("map-layout must define one world-space region per district")

    html = (CITY / "city.html").read_text(encoding="utf-8")
    for marker in ("MAP", "WORKS", "PROFILE", "CONTACT", 'id="worldHierarchyShell"', 'id="worldHierarchyWorld"', 'id="worldHierarchyDistrict"', 'id="worldHierarchyPreview"', 'data-world-hierarchy-version="m1"', 'class="panel-heading panel-heading--map"', "PORTFOLIO CITY / WORLD MAP", "地区を選んで探索", 'id="worksDirectory"'):
        if marker not in html:
            fail(f"city.html is missing required marker: {marker}")
    for legacy_marker in ('id="cityMap"', 'id="cityMapViewport"', 'id="projectInspector"', 'class="map-legend"', 'data-layout="living-city"'):
        if legacy_marker in html:
            fail(f"city.html must not expose the retired legacy map presentation: {legacy_marker}")
    if 'city-hero' in html or 'city-status' in html:
        fail("Portfolio City HERO/status block must remain removed")

    world_js = (CITY / "world-hierarchy-shell.js").read_text(encoding="utf-8")
    for marker in ("terrainManifest", "world-master-tile", "world-h2-viewport", "world-map-frame", "world-map-frame__matte", "world-map-frame__corner", "world-district-card", "openDistrictCard", "closeDistrictCard", "bindDistrictCardAccessibility", "districtCardOpen", "aria-haspopup", "aria-expanded", "preventScroll", "--district-card-mobile-top", "enabled: true"):
        if marker not in world_js:
            fail(f"world-hierarchy-shell.js is missing canonical world behavior: {marker}")
    if "world39" in world_js:
        fail("public world39 presentation switch must remain retired")

    js = (CITY / "city.js").read_text(encoding="utf-8")
    for marker in ("portfolio-city.visited.v1", "localStorage", "ArrowRight", "ArrowLeft", "replaceChildren", "prefers-reduced-motion", "buildBuildingVisual", "buildMapInfrastructure", "buildDistrictLandmark", "buildDistrictScene", "is-active-district", "district__progress", "city-map__street-label", "district__complete", "aria-pressed", "city-map__path", "city-map__shoreline", "district-scene__tree", "district-scene__lamp", "district-scene__bench", "district-scene__sign", "positionInspector", "setInspectorOpen", "is-hover-district", "buildCityArtLayers", "city-art--far", "city-art--mid", "city-art--near", "city-map__guide", "work-row__thumb"):
        if marker not in js:
            fail(f"city.js is missing required behavior: {marker}")
    if ".innerHTML" in js:
        fail("city.js must not render data with innerHTML")
    for forbidden in ("--building-image", "--inspector-image", "--work-thumb"):
        if forbidden in js:
            fail(f"city.js must not use inline mobile image variable: {forbidden}")

    css = (CITY / "city.css").read_text(encoding="utf-8")
    for marker in ("@media (max-width: 680px)", "@media (prefers-reduced-motion: reduce)", ".panel-heading--map", ".city-panel--map", ".world-map-frame", ".world-map-frame__matte", ".world-map-frame__corner", ".world-district-card", ".world-district-card__actions", "position: sticky", ".district--north", ".district--south", ".city-map__road--spine", ".city-map__bridge", ".district-landmark", ".district-scene", ".is-active-district", ".city-map__street-label", ".district__progress", ".map-legend", ".district__complete", ".is-complete-district", "@media (min-width: 981px)", ".city-map__path", ".city-map__shoreline", ".district-scene__tree", ".project-inspector.is-open", ".project-inspector__close", "pointer-events: none", ".city-art__mountains", ".city-art__tree-cluster", ".city-art__person", "Phase 3.4 / Checkpoint 2", "--project-image", ".project-inspector__visual", ".work-row__thumb"):
        if marker not in css:
            fail(f"city.css is missing required responsive/map rule: {marker}")

    for project_id in EXPECTED_ROUTES:
        if f'data-project-id="{project_id}"' not in css:
            fail(f"city.css is missing a distinct building rule for {project_id}")
        if f'assets/buildings/{project_id}.svg' not in css:
            fail(f"city.css is missing the illustrated building asset reference for {project_id}")

    deployment = load_json(ROOT / "config/deployment-map.json")
    matches = [entry for entry in deployment.get("entries", []) if entry.get("id") == "portfolio-city"]
    if matches != [{"id": "portfolio-city", "sourceRoot": "portfolio-city", "productionRoot": "portfolio-city"}]:
        fail("deployment map must contain exactly one portfolio-city entry")

    validation_workflow = (ROOT / ".github/workflows/validate-public.yml").read_text(encoding="utf-8")
    if "node tools/check_portfolio_city_runtime.mjs" not in validation_workflow:
        fail("validate-public workflow must run the Portfolio City runtime contract")

    print("Portfolio City Phase 4 P4-F contract passed: release-candidate world UI / district flow / mobile bottom sheet")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
