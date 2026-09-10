from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "tools/anagram/index.html"
CSS = ROOT / "tools/anagram/anagram.css"
JS = ROOT / "tools/anagram/anagram.js"


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        raise SystemExit(f"{label} missing: {', '.join(missing)}")


html = HTML.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")

require(html, (
    "Letter Workbench", 'id="composeModeBtn"', 'id="chunkModeBtn"',
    'id="remainingCount"', 'id="compositionText"', 'id="copyResultBtn"',
    'id="shuffleBtn"',
), "anagram HTML contract")
require(js, (
    "new Intl.Segmenter", "function evaluateUsage()", "let chunkSelected = new Set()",
    "tile.state = 'built'", "function moveTileBy", "event.altKey",
    "function copyText", "tileArea.replaceChildren()",
    "chunkList.replaceChildren()", "builtTiles.replaceChildren()",
), "anagram JS contract")

for forbidden in (
    "tileArea.innerHTML", "chunkList.innerHTML", "builtTiles.innerHTML",
    "onclick=", "ondrop=", "onkeydown=",
):
    if forbidden in js:
        raise SystemExit(f"unsafe/legacy anagram rendering remains: {forbidden}")

require(css, (
    "Stage 9 portfolio framing / Letter Workbench",
    ".letter-illustration", ".tile.state-built", "@media (max-width: 520px)",
), "anagram CSS contract")

if html.count('id="composeModeBtn"') != 1 or html.count('id="tileArea"') != 1:
    raise SystemExit("anagram critical IDs must remain unique")

print("Anagram Stage 9 contract passed: split compose/chunk modes, grapheme tiles, keyboard reorder, copy output, responsive workbench UI.")
