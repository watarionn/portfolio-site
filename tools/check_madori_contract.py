from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "works/madori/index.html"
JS_PATH = ROOT / "works/madori/madori.js"

class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.by_id = {}

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if data.get("id"):
            self.by_id[data["id"]] = (tag, data)


def require(condition, message):
    if not condition:
        raise SystemExit(f"MADORI contract failed: {message}")

html = HTML_PATH.read_text(encoding="utf-8")
js = JS_PATH.read_text(encoding="utf-8")
parser = Collector()
parser.feed(html)

for tab_id, panel_id in (("tab2d", "view2d"), ("tab3d", "view3d")):
    tag, attrs = parser.by_id[tab_id]
    require(tag == "button", f"{tab_id} must be a button")
    require(attrs.get("role") == "tab", f"{tab_id} must keep role=tab")
    require(attrs.get("aria-controls") == panel_id, f"{tab_id} aria-controls mismatch")
for panel_id, tab_id in (("view2d", "tab2d"), ("view3d", "tab3d")):
    _, attrs = parser.by_id[panel_id]
    require(attrs.get("role") == "tabpanel", f"{panel_id} must keep role=tabpanel")
    require(attrs.get("aria-labelledby") == tab_id, f"{panel_id} aria-labelledby mismatch")

for control_id in ("drawer-handle", "panel-toggle-btn"):
    tag, attrs = parser.by_id[control_id]
    require(tag == "button", f"{control_id} must be keyboard-operable")
    require(attrs.get("aria-expanded") == "false", f"{control_id} initial aria-expanded must be false")

require('class="drawer-nav" role="group"' in html, "drawer category controls must use group semantics")
require('id="editor-status"' in html and 'aria-live="polite"' in html, "editor status live region missing")
require(parser.by_id["c3d"][1].get("aria-label") == "3D間取りビュー", "3D canvas label missing")

require("URL.revokeObjectURL(url)" in js, "JSON object URL must be revoked")
require("fillLight.position.set(-200, 200, -200)" in js, "secondary light position must be explicit")
require("position.set(-200, 200, -200) &&" not in js, "legacy secondary-light bug returned")
require("validateLoadedData(d)" in js, "loaded JSON must be validated")
for fragment in ("Array.isArray(d.rooms)", "Array.isArray(d.furniture)", "Array.isArray(d.walls)"):
    require(fragment in js, f"missing load validation: {fragment}")
require("setAttribute('aria-pressed'" in js, "pressed-state synchronization missing")
require("setAttribute('aria-expanded'" in js, "expanded-state synchronization missing")

print("MADORI interaction contract passed")
