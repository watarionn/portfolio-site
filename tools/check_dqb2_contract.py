from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "works/dqb2/index.html"
CSS = ROOT / "works/dqb2/dqb2.css"
JS = ROOT / "works/dqb2/dqb2.js"
ROOT_HTML = ROOT / "index.html"


def fail(message: str) -> None:
    print(f"DQB2 contract failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def require(text: str, markers: tuple[str, ...], label: str) -> None:
    for marker in markers:
        if marker not in text:
            fail(f"{label} marker missing: {marker}")


def main() -> None:
    html = HTML.read_text(encoding="utf-8")
    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    root_html = ROOT_HTML.read_text(encoding="utf-8")

    require(html, (
        'class="project-intro"', 'id="material-count"', 'id="visible-count"',
        'data-scope="items"', 'data-scope="effect"', 'id="result-count"',
        'aria-hidden="true"', 'id="toast"',
    ), "HTML")
    for attribute in ("onclick=", "oninput=", "onchange=", "onkeydown=", "onerror="):
        if attribute in html or attribute in js:
            fail(f"inline event handler remains: {attribute}")

    require(js, (
        "Stage 9: Builder's Field Guide interaction layer",
        "function getUniqueMaterialCount()", "function syncUrlState()",
        "function trapModalFocus(event)", "navigator.clipboard.writeText(text)",
        'modal.setAttribute("aria-hidden", "false")',
        'modal.setAttribute("aria-hidden", "true")', "grid.replaceChildren()",
    ), "JavaScript")
    if "innerHTML" in js or "insertAdjacentHTML" in js:
        fail("unsafe HTML-string rendering returned")

    data_block = js.split("/* ─── Stage 9:", 1)[0]
    room_count = len(re.findall(r'^\s*\["', data_block, flags=re.MULTILINE))
    if room_count != 191:
        fail(f"expected 191 room recipes, got {room_count}")

    require(css, (
        ".block-illustration", ".room-grid", ".modal-overlay",
        "@media (max-width: 560px)", "body.modal-open",
    ), "CSS")
    require(root_html, (
        "DQB2 部屋レシピ図鑑", "Dataset / JavaScript",
    ), "root portfolio")

    print("DQB2 Stage 9 contract passed: 191 recipes, safe DOM rendering, search scopes, responsive field-guide UI.")


if __name__ == "__main__":
    main()
