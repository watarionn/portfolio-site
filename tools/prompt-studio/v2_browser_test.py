"""Browser E2E: run from an existing checkout with:
python -m pytest tools/prompt-studio/v2_browser_test.py
Requires pytest and playwright (Python) plus a Chromium browser.
No external network or production writes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = (Path(__file__).resolve().parent / "v2-phase3.html").as_uri()

def test_editor_roundtrip_and_pending_edit_guard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page(accept_downloads=True)
            page.on("dialog", lambda dialog: dialog.accept(
                "white dress\nblack coat" if "候補" in dialog.message else "outfit"))
            page.goto(URL)
            page.locator("#source").fill("A white dress in a forest.")
            page.locator("#source").evaluate(
                "(el) => { el.focus(); el.setSelectionRange(2,13); el.dispatchEvent(new Event('select')); }")
            page.locator("#mark").click()
            assert page.locator("#parts select").count() == 1
            page.locator("#parts select").select_option("1")
            assert page.locator("#preview").inner_text() == "A black coat in a forest."
            page.locator("#profile").select_option("sdxl-tags")
            page.locator("#negative").fill("blurry")
            page.reload()
            assert page.locator("#profile").input_value() == "sdxl-tags"
            assert page.locator("#negative").input_value() == "blurry"
            assert page.locator("#preview").inner_text() == "A black coat in a forest."
            page.locator("#source").fill("pending change")
            page.locator("#save").click()
            assert "未確定" in page.locator("#status").inner_text()
            page.reload()
            assert page.locator("#preview").inner_text() == "A black coat in a forest."
        finally:
            browser.close()
