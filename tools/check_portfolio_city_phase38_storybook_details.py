from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DETAILS = ROOT / "portfolio-city" / "data" / "environment-details.json"
LAYOUT = ROOT / "portfolio-city" / "data" / "map-layout.json"
JS = ROOT / "portfolio-city" / "city.js"
CSS = ROOT / "portfolio-city" / "city.css"

ALLOWED_TYPES = {"stone-wall", "hedge", "flowerbed", "lamp", "bench", "star-marker", "book-cart", "crate-stack", "barrel", "reeds", "bollard"}
EXPECTED_DISTRICTS = {
    "observatory-hill",
    "archive-street",
    "workshop-alley",
    "waterside-play",
}
EXPECTED_COUNT = 28

def fail(message: str) -> None:
    raise SystemExit(f"Phase 3.8 storybook detail contract failed: {message}")

payload = json.loads(DETAILS.read_text(encoding="utf-8"))
layout = json.loads(LAYOUT.read_text(encoding="utf-8"))
if payload.get("schemaVersion") != 1 or not isinstance(payload.get("details"), list):
    fail("invalid environment-details schema")
details = payload["details"]
if len(details) != EXPECTED_COUNT:
    fail(f"expected {EXPECTED_COUNT} details, got {len(details)}")

world = layout["world"]
min_x = world.get("minX", 0)
min_y = world.get("minY", 0)
max_x = min_x + world["width"]
max_y = min_y + world["height"]
ids = set()
district_counts = {district: 0 for district in EXPECTED_DISTRICTS}
for item in details:
    detail_id = item.get("id")
    if not detail_id or detail_id in ids:
        fail(f"duplicate or missing id: {detail_id}")
    ids.add(detail_id)
    if item.get("type") not in ALLOWED_TYPES:
        fail(f"unexpected type for {detail_id}: {item.get('type')}")
    district = item.get("district")
    if district not in EXPECTED_DISTRICTS:
        fail(f"unexpected district for {detail_id}: {district}")
    district_counts[district] += 1
    x, y = item.get("x"), item.get("y")
    width, height = item.get("width"), item.get("height")
    if not all(isinstance(v, (int, float)) for v in (x, y, width, height)):
        fail(f"non-numeric geometry for {detail_id}")
    if not (min_x <= x <= max_x and min_y <= y <= max_y):
        fail(f"out-of-world position for {detail_id}")
    if width <= 0 or height <= 0:
        fail(f"non-positive size for {detail_id}")
if set(district_counts.values()) != {7}:
    fail(f"expected 7 details per district, got {district_counts}")
signatures = {
    "observatory-hill": {"star-marker"},
    "archive-street": {"book-cart"},
    "workshop-alley": {"crate-stack", "barrel"},
    "waterside-play": {"reeds", "bollard"},
}
for district, required in signatures.items():
    actual = {item["type"] for item in details if item["district"] == district}
    if not required.issubset(actual):
        fail(f"missing district signature props for {district}: {required - actual}")

js = JS.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
for token in (
    "environment-details.json",
    "function buildWorldDetails()",
    "worldDetails = fullTerrain ? buildWorldDetails() : null",
    "function buildBuildingForecourt(districtId)",
):
    if token not in js:
        fail(f"missing JS integration token: {token}")
for token in (
    ".world-details",
    ".building-forecourt",
    ".world-detail--stone-wall",
    ".world-detail--hedge",
    ".world-detail--flowerbed",
    ".world-detail--lamp",
    ".world-detail--bench",
    ".world-detail--star-marker",
    ".world-detail--book-cart",
    ".world-detail--crate-stack",
    ".world-detail--barrel",
    ".world-detail--reeds",
    ".world-detail--bollard",
    "pointer-events: none",
):
    if token not in css:
        fail(f"missing CSS integration token: {token}")

print(
    "Portfolio City Phase 3.8 storybook detail contract passed: "
    f"{len(details)} details / 7 per district / geometry-safe overlay"
)
