from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHP = ROOT / "apps/aquarium/public/aquarium.php"
INDEX = ROOT / "apps/aquarium/public/index.php"
CSS = ROOT / "apps/aquarium/public/aquarium.css"
JS = ROOT / "apps/aquarium/public/aquarium.js"


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        raise SystemExit(f"{label} missing: {', '.join(missing)}")


php = PHP.read_text(encoding="utf-8")
index = INDEX.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")

if PHP.read_bytes() != INDEX.read_bytes():
    raise SystemExit("AQUARIUM PHP entrypoints must remain byte-identical")

require(php, (
    "AQUARIUM", 'id="fish-search"', 'id="visible-count"', 'id="total-count"',
    'data-scope="all"', 'data-scope="name"', 'data-scope="reading"',
    'id="random-fish"', 'id="reveal-visible"', 'class="fish-card-trigger"',
), "aquarium PHP contract")
require(js, (
    "function normalizeText(", "function setCardFlipped(", "function applyFilter(",
    "function setScope(", "history.replaceState", "scrollIntoView",
    "event.key === '/'", "event.key === 'ArrowRight'",
), "aquarium JS contract")

for forbidden in ("innerHTML", "onclick=", "onkeydown=", "onchange="):
    if forbidden in js or forbidden in php:
        raise SystemExit(f"unsafe/legacy aquarium rendering remains: {forbidden}")

require(css, (
    "Stage 9 portfolio framing / Aquarium Field Index",
    ".explorer", ".scope-switch", ".fish-card-trigger", ".empty-state",
    "@media (max-width: 680px)",
), "aquarium CSS contract")

for marker in (
    "SELECT KANJI, YOMI_1, YOMI_2 FROM FISH",
    "require_once __DIR__ . '/../../config.php';",
    "new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME)",
):
    if marker not in php:
        raise SystemExit(f"AQUARIUM DB boundary drift: {marker}")

if php.count("SELECT KANJI, YOMI_1, YOMI_2 FROM FISH") != 1:
    raise SystemExit("AQUARIUM must keep a single FISH read query")
print(
    "AQUARIUM Stage 9 contract passed: DB boundary preserved, searchable fish index, "
    "scope controls, card reveal, random discovery, keyboard navigation, and responsive UI."
)
