"""Prompt Studio 2.0 next UI browser E2E (Microsoft Edge or Chromium).
Run: python -m pytest -q tools/prompt-studio/v2-next-browser.test.py
This test is local-only; no production writes.
"""
from pathlib import Path
import json
import os

from playwright.sync_api import sync_playwright

URL = (Path(__file__).resolve().parent / "v2-next.html").as_uri()


def open_page(browser, mobile=False):
    page = browser.new_page(viewport={"width": 390 if mobile else 1280, "height": 844})
    page.add_init_script("""Object.defineProperty(navigator,'clipboard',{
        configurable:true,value:{writeText:async text=>{window.__lastCopy=text;}}
    });""")
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(URL)
    return page


def launch(p):
    channel = os.environ.get("PROMPT_STUDIO_BROWSER_CHANNEL")
    return p.chromium.launch(headless=True, channel=channel) if channel else p.chromium.launch(headless=True)


def record_save(page, name):
    page.locator("#recordName").fill(name)
    page.locator('#recordForm button[value="submit"]').click()
    assert page.locator("#recordDialog").evaluate("(e)=>e.open") is False


def dictionary_named_action(page, entity, op, name):
    page.locator(f'[data-entity="{entity}"][data-op="{op}"]').click()
    page.locator("#nameInput").fill(name)
    page.locator('#nameForm button[value="submit"]').click()


def test_template_multiple_characters_history_and_copy():
    with sync_playwright() as p:
        browser = launch(p)
        try:
            page = open_page(browser)
            page.locator("#pickTemplate").click()
            page.locator("#pickerList button").nth(1).click()
            assert page.locator("#promptText").input_value().count("{登場人物}") == 2
            page.locator("#partCategory").select_option("character")
            page.locator("#partValue").select_option("woman")
            page.locator("#partOptions select").first.select_option("hair2")
            page.locator("#reflect").click()
            assert "ロング" in page.locator("#promptText").input_value()
            assert page.locator("#promptText").input_value().count("{登場人物}") == 1
            page.locator("#partValue").select_option("dog")
            page.locator("#partOptions select").first.select_option("breed0")
            page.locator("#reflect").click()
            assert "{登場人物}" not in page.locator("#promptText").input_value()
            page.locator("#savePrompt").click()
            page.locator("#saveAsTemplate").click()
            assert page.locator("#recordContent").input_value().count("{登場人物}") == 2
            record_save(page, "二人のテンプレート")
            page.locator("#savePrompt").click()
            page.locator("#saveAsPrompt").click()
            record_save(page, "保存例")
            page.locator("#copyPrompt").click()
            assert page.evaluate("window.__lastCopy") == page.locator("#promptText").input_value()
            page.locator("#pickHistory").click()
            assert page.locator("#pickerList button").count() == 2
            page.locator("#pickerList button").first.click()
            page.reload()
            page.locator("#pickTemplate").click()
            assert page.locator("#pickerList").get_by_text("二人のテンプレート").count() == 1
            page.close()
        finally:
            browser.close()


def test_dictionary_value_specific_options_and_crud():
    with sync_playwright() as p:
        browser = launch(p)
        try:
            page = open_page(browser)
            page.locator("#showDictionary").click()
            dictionary_named_action(page, "category", "add", "小道具")
            dictionary_named_action(page, "value", "add", "傘")
            dictionary_named_action(page, "option", "add", "色")
            dictionary_named_action(page, "choice", "add", "赤")
            page.locator("#showMain").click()
            cat = page.locator("#partCategory")
            cat.select_option(label="小道具")
            assert page.locator("#partValue").locator("option:checked").inner_text() == "傘"
            assert page.locator("#partOptions label").first.inner_text().startswith("色")
            page.locator("#partOptions select").first.select_option(label="赤")
            page.locator("#reflect").click()
            assert "傘（色：赤）" in page.locator("#promptText").input_value()
            page.locator("#showDictionary").click()
            page.locator("#editCategory").select_option(label="小道具")
            page.locator('[data-entity="category"][data-op="edit"]').click()
            page.locator("#nameInput").fill("道具")
            page.locator('#nameForm button[value="submit"]').click()
            assert page.locator("#editCategory").locator("option:checked").inner_text() == "道具"
            page.locator('[data-dict="templates"]').click()
            page.locator('[data-record="template"][data-op="add"]').click()
            page.locator("#recordContent").fill("{道具}の画像")
            record_save(page, "道具用")
            assert page.locator("#templateList").get_by_text("道具用").count() == 1
            page.locator('[data-record="template"][data-op="edit"]').click()
            page.locator("#recordContent").fill("{道具}の写真")
            record_save(page, "道具用改訂")
            assert page.locator("#templateList").get_by_text("道具用改訂").count() == 1
            page.locator('[data-record="template"][data-op="delete"]').click()
            assert page.locator("#templateList").get_by_text("道具用改訂").count() == 0
            page.close()
        finally:
            browser.close()


def test_edit_preserves_unaffected_part_and_import_rejects_legacy():
    with sync_playwright() as p:
        browser = launch(p)
        try:
            page = open_page(browser, mobile=True)
            page.locator("#promptText").fill("前半 ")
            page.locator("#reflect").click()
            text = page.locator("#promptText").input_value()
            assert "女性" in text
            page.locator("#promptText").fill("新しい前置き " + text)
            page.locator("#savePrompt").click()
            page.locator("#saveAsTemplate").click()
            assert "{登場人物}" in page.locator("#recordContent").input_value()
            record_save(page, "編集後のテンプレート")
            page.locator("#backupExport").click()
            with page.expect_download() as d:
                page.locator("#backupExport").click()
            raw = d.value.path().read_bytes()
            backup = json.loads(raw)
            assert backup["format"] == "prompt-studio-2.0-backup"
            assert len(backup["data"]["templates"]) >= 3
            page.locator("#backupImport").set_input_files({
                "name": "legacy.json", "mimeType": "application/json",
                "buffer": b'{"format":"prompt-db","library":[]}'
            })
            assert "2.0" in page.locator("#status").inner_text()
            page.locator("#backupImport").set_input_files({
                "name": "good.json", "mimeType": "application/json", "buffer": raw
            })
            assert "読み込んだ" in page.locator("#status").inner_text()
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            page.close()
        finally:
            browser.close()


def test_corrupted_state_is_not_overwritten():
    with sync_playwright() as p:
        browser = launch(p)
        try:
            page = open_page(browser)
            page.evaluate("""localStorage.setItem('prompt-studio-2.0-dictionary-v1','invalid')""")
            page.reload()
            page.locator("#promptText").fill("should not replace raw")
            assert page.evaluate("localStorage.getItem('prompt-studio-2.0-dictionary-v1')") == "invalid"
            page.locator("#backupExport").click()
            assert "書き出さない" in page.locator("#status").inner_text()
            page.close()
        finally:
            browser.close()
