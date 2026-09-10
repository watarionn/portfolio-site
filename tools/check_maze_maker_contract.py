from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "tools/maze-maker/index.html"
CSS = ROOT / "tools/maze-maker/maze_maker.css"
JS = ROOT / "tools/maze-maker/maze_maker.js"


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    missing = [marker for marker in markers if marker not in text]
    if missing:
        raise SystemExit(f"{label} missing: {', '.join(missing)}")


html = HTML.read_text(encoding="utf-8")
css = CSS.read_text(encoding="utf-8")
js = JS.read_text(encoding="utf-8")

require(html, (
    "Maze Draft Board", 'id="btn-undo"', 'id="btn-redo"',
    'id="btn-clear"', 'id="grid-size-stat"', 'role="grid"',
    'id="status-live"', 'data-size="15x25"',
), "maze HTML contract")

require(js, (
    "const MAX_HISTORY = 80", "function undo()", "function redo()",
    "function focusCell", "function updateStats", "mazeBody.replaceChildren()",
    "function escapeHtmlText", "escapeHtmlText(txt)",
    "event.key === 'Enter'", "event.key === 'Delete'",
), "maze JS contract")

for forbidden in ("mazeBody.innerHTML", "btn.innerHTML", "onclick=", "onmousedown="):
    if forbidden in js:
        raise SystemExit(f"unsafe/legacy maze rendering remains: {forbidden}")

require(css, (
    "Stage 9 portfolio framing / Maze Draft Board",
    ".route-illustration", ".maze-stats", "@media (max-width: 560px)",
), "maze CSS contract")

if html.count('id="btn-undo"') != 1 or html.count('id="maze-grid"') != 1:
    raise SystemExit("maze critical IDs must remain unique")

print("Maze Maker Stage 9 contract passed: undo/redo, keyboard grid, safe HTML export, responsive draft-board UI.")
