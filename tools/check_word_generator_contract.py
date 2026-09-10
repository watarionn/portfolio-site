from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "tools/word-generator/index.html"
CSS = ROOT / "tools/word-generator/word_generator.css"
JS = ROOT / "tools/word-generator/word_generator.js"
DATA = ROOT / "tools/word-generator/words_data.js"


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        raise SystemExit(f"{label} missing: {', '.join(missing)}")


html = HTML.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")
data = DATA.read_text(encoding="utf-8")

require(html, (
    "WORD DRAW TABLE", 'id="metric-kata"', 'id="metric-eigo"',
    'id="timer-display"', 'id="draw-history"', 'data-seconds="30"',
    'data-seconds="60"', 'data-seconds="90"',
), "word generator HTML contract")

require(js, (
    "function setMode(", "function addHistory(", "history = history.slice(0, 5)",
    "function updateDatasetMetrics()", "kataGenreGrid.replaceChildren()",
    "ngList.replaceChildren()", "function toggleTimer()", "function resetTimer()",
    "event.key === 'ArrowRight'", "event.key.toLowerCase() === 'd'",
    "event.key.toLowerCase() === 't'",
), "word generator JS contract")

for forbidden in ("ngList.innerHTML", "onclick=", "onkeydown=", "onchange="):
    if forbidden in js or forbidden in html:
        raise SystemExit(f"unsafe/legacy word generator rendering remains: {forbidden}")

require(css, (
    "Stage 9 portfolio framing / Word Draw Table",
    ".round-timer", ".history-panel", ".draw-layout",
    "@media (max-width: 620px)",
), "word generator CSS contract")

kata_block = data.split("const KATA_WORDS = [", 1)[1].split("const EIGO_WORDS = [", 1)[0]
eigo_block = data.split("const EIGO_WORDS = [", 1)[1]
kata_rows = len(re.findall(r'\"word\"\s*:', kata_block))
eigo_rows = len(re.findall(r'\"word\"\s*:', eigo_block))
if (kata_rows, eigo_rows) != (651, 93):
    raise SystemExit(f"word dataset row-count drift: KATA={kata_rows}, EIGO={eigo_rows}")

if html.count('id="timer-display"') != 1 or html.count('id="draw-history"') != 1:
    raise SystemExit("word generator critical IDs must remain unique")

print(
    "Word Generator Stage 9 contract passed: 651/93 datasets preserved, "
    "deck progress, history, timer, keyboard tabs, shortcuts, and responsive table UI."
)
