from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "tools/actress-finder/index.html"
CSS = ROOT / "tools/actress-finder/actress_finder.css"
JS = ROOT / "tools/actress-finder/actress_finder.js"
ROOT_HTML = ROOT / "index.html"


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        raise SystemExit(f"{label} missing: {', '.join(missing)}")


html = HTML.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")
root_html = ROOT_HTML.read_text(encoding="utf-8")

require(html, (
    "ACTRESS INDEX / RECOMMENDATION BRIEF", 'id="person-input"',
    'id="build-brief"', 'id="result-json"', 'id="results-panel"',
    './actress_finder.css', './actress_finder.js',
), "Actress Finder HTML contract")
require(js, (
    "function buildPrompt()", "function parseSuggestions(value)",
    "resultList.replaceChildren", "tagList.replaceChildren",
    "new URLSearchParams", "navigator.clipboard.writeText",
    "event.key === 'ArrowRight'", "event.key === '/'",
), "Actress Finder JS contract")

for forbidden in (
    "innerHTML", "onclick=", "onkeydown=", "api.anthropic.com",
    "api.openai.com", "fetch(", "x-api-key", "authorization",
):
    if forbidden in js.lower() or forbidden in html.lower():
        raise SystemExit(f"Actress Finder unsafe/external marker remains: {forbidden}")

require(css, (
    "Stage 9 portfolio framing / Actress Index Recommendation Brief",
    ".focus-options", ".result-row", ".metric-strip",
    "@media (max-width: 620px)",
), "Actress Finder CSS contract")

if '/OTHER/actress_finder.html' not in root_html or 'JavaScript / JSON' not in root_html:
    raise SystemExit("root portfolio Actress Finder row must use the Stage 9 technology label")
if html.count('id="person-input"') != 1 or html.count('id="result-json"') != 1:
    raise SystemExit("Actress Finder critical IDs must remain unique")

print(
    "Actress Finder Stage 9 contract passed: local-first brief builder, URL state, "
    "safe JSON import, keyboard focus controls, and responsive comparison list."
)
