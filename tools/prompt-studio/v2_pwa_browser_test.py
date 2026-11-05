"""Prompt Studio 2.0 canonical PWA integration E2E.
Run: python -m pytest -q tools/prompt-studio/v2_pwa_browser_test.py
Uses a local HTTP server and a real browser Service Worker; never touches production.
"""
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import unquote, urlsplit
import os
import json
from playwright.sync_api import sync_playwright

SOURCE = Path(__file__).resolve().parent
PREFIX = "/prompt-studio/"

class ScopedHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".webmanifest": "application/manifest+json"}

    def translate_path(self, path):
        full = unquote(urlsplit(path).path)
        if not full.startswith(PREFIX):
            return str(SOURCE / "__not_found__")
        parts = Path(full[len(PREFIX):]).parts
        if ".." in parts or any("\\" in part for part in parts):
            return str(SOURCE / "__not_found__")
        return str(SOURCE.joinpath(*parts)) if parts else str(SOURCE / "index.html")

    def log_message(self, format, *args):
        return

@contextmanager
def serve():
    server = ThreadingHTTPServer(("127.0.0.1", 0), ScopedHandler)
    server.daemon_threads = True
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)

def browser_for(p):
    channel = os.environ.get("PROMPT_STUDIO_BROWSER_CHANNEL")
    return p.chromium.launch(headless=True, channel=channel) if channel else p.chromium.launch(headless=True)

def test_canonical_pwa_upgrade_preserves_data_and_works_offline():
    with serve() as origin, sync_playwright() as p:
        browser = browser_for(p)
        try:
            context = browser.new_context(viewport={"width": 390, "height": 844}, service_workers="allow")
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            preview = page.goto(origin + PREFIX + "v2-next.html", wait_until="domcontentloaded")
            assert preview.status == 200
            page.evaluate("""async () => {
                const state = window.PromptStudioNext.starterState();
                state.outputFormat = 'tags';
                state.draft = {text: '1girl, long hair', marks: []};
                localStorage.setItem('prompt-studio-2.0-dictionary-v1', JSON.stringify(state));
                localStorage.setItem('prompt-studio-pwa-draft-v1', 'legacy-1.2-sentinel');
                const cache = await caches.open('prompt-studio-v1.2.0');
                await cache.put('/prompt-studio/', new Response('OLD 1.2 OFFLINE HTML'));
            }""")
            response = page.goto(origin + PREFIX, wait_until="networkidle")
            assert response.status == 200
            assert "2.0" in page.locator("h1").inner_text()
            assert page.locator("#partCategory").locator("option").count() > 1
            assert page.locator("#profileSelect").count() == 0
            assert page.locator("#outputFormat").input_value() == "tags"
            assert page.locator("#promptText").input_value() == "1girl, long hair"
            manifest = page.evaluate("""async () =>
                await (await fetch('/prompt-studio/manifest.webmanifest')).json()
            """)
            assert manifest["id"] == "/prompt-studio/"
            assert manifest["start_url"] == "/prompt-studio/"
            assert manifest["scope"] == "/prompt-studio/"
            assert manifest["display"] == "standalone"
            assert "2.0" in manifest["name"]
            page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=20000)
            active = page.evaluate("""async () => {
                const reg = await navigator.serviceWorker.ready;
                return {scope: reg.scope, url: reg.active?.scriptURL || '', keys: await caches.keys(),
                    legacy: localStorage.getItem('prompt-studio-pwa-draft-v1')};
            }""")
            assert active["scope"] == origin + PREFIX
            assert active["url"].endswith("/prompt-studio/service-worker.js")
            assert "prompt-studio-v2.0.0" in active["keys"]
            assert "prompt-studio-v1.2.0" not in active["keys"]
            assert active["legacy"] == "legacy-1.2-sentinel"
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            context.set_offline(True)
            page.reload(wait_until="domcontentloaded")
            assert "2.0" in page.locator("h1").inner_text()
            assert page.locator("#outputFormat").input_value() == "tags"
            assert page.locator("#promptText").input_value() == "1girl, long hair"
            page.locator("#partValue").select_option("dog")
            page.locator("#reflect").click()
            assert page.locator("#promptText").input_value() == "1girl, long hair, dog"
            assert page.evaluate("localStorage.getItem('prompt-studio-pwa-draft-v1')") == "legacy-1.2-sentinel"
            assert not errors, errors
            context.close()
        finally:
            browser.close()

def test_pwa_assets_and_manifest_match_canonical_entry():
    html=(SOURCE/"index.html").read_text(encoding="utf-8")
    assert 'rel="manifest" href="manifest.webmanifest"' in html
    assert "serviceWorker.register('./service-worker.js'" in html
    assert 'v2-next-core.js?v=2.0.2' in html
    assert 'v2-next.js?v=2.0.2' in html
    assert 'v2-next.css?v=2.0.2' in html
    assert "app.js?v=1.2.0" not in html
    sw=(SOURCE/"service-worker.js").read_text(encoding="utf-8")
    assert "prompt-studio-" in sw and "v2.0.0" in sw
    assert "skipWaiting" in sw and "clients.claim" in sw
    assert "v1.2.0" not in sw
    manifest=json.loads((SOURCE/"manifest.webmanifest").read_text(encoding="utf-8"))
    assert manifest["id"] == "/prompt-studio/"
    assert all((SOURCE/p).is_file() for p in [
        "v2-next-core.js","v2-next.js","v2-next.css","icon-192.png","icon-512.png",
        "apple-touch-icon.png","favicon.svg"])
