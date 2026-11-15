"""Browser regression for the standalone Komorebi 2D preview.

Run: python works/komorebi-town-2d/tests/browser_smoke.py
Requires Playwright + Chromium. Uses set_content so a policy blocking file: URLs
cannot turn local browser QA into a false failure.
"""
from __future__ import annotations

from pathlib import Path
from playwright.sync_api import sync_playwright

HTML = Path(__file__).resolve().parents[1] / "public" / "index.html"
SCREENS = [
    ("iphone", {"viewport": {"width": 393, "height": 852}, "is_mobile": True,
                "has_touch": True, "device_scale_factor": 3}),
    ("desktop", {"viewport": {"width": 1280, "height": 800}}),
    ("iphone_landscape", {"viewport": {"width": 852, "height": 393},
                          "is_mobile": True, "has_touch": True, "device_scale_factor": 3}),
    ("small", {"viewport": {"width": 320, "height": 568},
               "is_mobile": True, "has_touch": True, "device_scale_factor": 3}),
]


def run() -> None:
    with sync_playwright() as pw:
        import os
        executable = os.getenv("CHROMIUM_EXECUTABLE")
        browser = pw.chromium.launch(headless=True, executable_path=executable)
        for name, config in SCREENS:
            context = browser.new_context(**config)
            page = context.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            page.goto("about:blank")
            page.set_content(HTML.read_text(encoding="utf-8"), wait_until="load")
            page.wait_for_timeout(450)
            initial = page.evaluate("window.__komorebi2dDiagnostics()")
            widths = page.evaluate("""({
                scrollWidth: document.documentElement.scrollWidth,
                scrollHeight: document.documentElement.scrollHeight,
                width: innerWidth, height: innerHeight
            })""")
            assert not errors, (name, errors)
            assert widths["scrollWidth"] <= widths["width"]
            assert widths["scrollHeight"] <= widths["height"]
            assert initial["mapSize"] == {"width": 480, "height": 384}
            if name in ("iphone", "small"):
                assert initial["canvas"]["width"] < config["viewport"]["width"]
            assert page.locator("nav a").count() == 2
            assert page.locator(".touch .pad button").count() == 4
            old_x = initial["player"]["x"]
            button = page.locator('[data-dir="right"]')
            rect = button.bounding_box()
            if rect:
                page.mouse.move(rect["x"] + rect["width"] / 2,
                                rect["y"] + rect["height"] / 2)
                page.mouse.down()
                page.wait_for_timeout(350)
                page.mouse.up()
            else:
                page.keyboard.down("ArrowRight")
                page.wait_for_timeout(350)
                page.keyboard.up("ArrowRight")
            moved = page.evaluate("window.__komorebi2dDiagnostics()")
            assert moved["player"]["x"] > old_x + .25, (name, old_x, moved)
            page.locator("#screen").click(position={
                "x": config["viewport"]["width"] * .5,
                "y": config["viewport"]["height"] * .5,
            }, force=True)
            page.wait_for_timeout(390)
            tapped = page.evaluate("window.__komorebi2dDiagnostics()")
            assert tapped["drawCount"] >= moved["drawCount"] + 2, name
            page.locator("#help").click()
            assert "タップ" in page.locator("#toast").inner_text()
            assert not errors, (name, errors)
            print("PASS", name, {"draws": tapped["drawCount"],
                  "drawMsTotal": round(tapped["drawTime"], 2),
                  "canvas": initial["canvas"]})
            context.close()
        browser.close()
    print("KOMOREBI_2D_BROWSER_SMOKE_PASS")


if __name__ == "__main__":
    run()