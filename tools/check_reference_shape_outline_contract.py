#!/usr/bin/env python3
"""Source-only guard for the Web and iPhone PWA reference shape editors.

Run with: python tools/check_reference_shape_outline_contract.py
No browser, FTP, image upload or network request is performed.
"""
from __future__ import annotations

from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EDITORS = (
    ROOT / "tools/reference-shape-editor",
    ROOT / "tools/reference-shape-editor-pwa",
)


def check() -> None:
    for editor in EDITORS:
        page = (editor / "index.html").read_text(encoding="utf-8")
        js = (editor / "app.js").read_text(encoding="utf-8")
        css = (editor / "styles.css").read_text(encoding="utf-8")
        assert page.count('id="unifiedColors"') == 1, editor
        assert '<details class="palette-accordion">' in page, editor
        assert "編集可能な統合パレット" in page, editor
        assert all(f'id="{old}"' not in page for old in (
            "characteristicColors", "featuredColors", "representativeColors",
            "charLabel",
        )), editor
        assert "編集可能な統合パレット" in js or "paletteUnified()" in js
        assert "function outlineAttrs(shape)" in js, editor
        assert "strokeColor:'#000000',strokeWidth:0" in js, editor
        assert "strokeWidth:s.strokeWidth===undefined?0:" in js, editor
        assert 'stroke-width="${outlineWidth(s)}"' in js, editor
        assert "const outline=document.createElement('fieldset')" in js, editor
        assert "Number.isFinite(width)&&width>=.25&&width<=40" in js, editor
        assert ".palette-accordion>summary" in css, editor
        assert ".outline-settings" in css, editor
        dom_ids = set(re.findall(r"""\$\(['"]([A-Za-z][\w-]*)['"]\)""", js))
        missing = [identifier for identifier in dom_ids
                   if f'id="{identifier}"' not in page]
        assert not missing, (editor, missing)
        if shutil.which("node"):
            subprocess.run(["node", "--check", str(editor / "app.js")],
                           check=True, capture_output=True, text=True)
        print(f"{editor.name}: 1 palette, editable outline, legacy JSON: PASS")
    sw = (EDITORS[1] / "service-worker.js").read_text(encoding="utf-8")
    assert "shape-studio-pwa-" in sw and "v1.4.0" in sw
    print("PWA cache generation v1.4.0: PASS")


if __name__ == "__main__":
    check()
