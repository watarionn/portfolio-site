from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "tools" / "vector-lab"
EXPECTED_WASM = "63716b70497b7468ef97545b50f5f34b8bbb7acde2d7b00deb4eb40781446d45"

def test_vector_lab_is_independent_public_tool():
    mapping = json.loads((ROOT / "config/deployment-map.json").read_text(encoding="utf-8"))
    entries = [item for item in mapping["entries"] if item["id"] == "vector-lab"]
    assert entries == [{"id":"vector-lab","sourceRoot":"tools/vector-lab","productionRoot":"vector-lab"}]
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'href="/vector-lab/"' in index
    assert "<strong>ベクター変換室</strong>" in index
    assert "/vector-lab/" in json.loads((ROOT / "config/seo.json").read_text(encoding="utf-8"))["sitemapRoutes"]
    src = (APP / "index.html").read_text(encoding="utf-8")
    assert 'href="./manifest.webmanifest"' in src
    assert 'src="./app.mjs"' in src
    assert 'id="watershedDetail"' in src
    assert 'id="palette"' in src
    assert 'id="adaptive"' in src
    assert 'id="simplify"' in src
    assert "Minimalizer" in src  # only to explain independent semantic boundaries
    assert "local-static/" not in src
    assert "localhost" not in src.lower()
    assert 'href="./licenses.html"' in src

def test_pwa_shell_is_scoped_and_images_never_cached():
    manifest = json.loads((APP / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert manifest["start_url"] == "./"
    assert manifest["scope"] == "./"
    assert manifest["display"] == "standalone"
    script = (APP / "sw.js").read_text(encoding="utf-8")
    assert "vector-lab-shell" in script
    for path in ("vendor/vtracer_wasm_bg.wasm","vendor/vtracer10-browser.mjs","worker.mjs"):
        assert path in script
    assert "cache.addAll(ASSETS)" in script
    assert 'req.method!=="GET"' in script
    assert "user images" in script

def test_pinned_browser_wasm_provenance():
    wasm = (APP / "vendor/vtracer_wasm_bg.wasm").read_bytes()
    assert hashlib.sha256(wasm).hexdigest() == EXPECTED_WASM
    js = (APP / "vendor/vtracer10-browser.mjs").read_text(encoding="utf-8")
    assert "export async function initVTracer10" in js
    assert "export { vectorize_rgba }" in js
    assert "readFileSync" not in js
    assert "__dirname" not in js
    assert len(wasm) == 668378
    other = (APP / "vendor/imagetracer_v1.2.6.js").read_text(encoding="utf-8")
    assert "imagetracer.js version 1.2.6" in other
    assert "The Unlicense / PUBLIC DOMAIN" in other
    assert (APP / "vendor/LICENSE-VTRACER").is_file()

def test_config_and_realtime_worker_boundaries():
    ui = (APP / "app.mjs").read_text(encoding="utf-8")
    worker = (APP / "worker.mjs").read_text(encoding="utf-8")
    opts = (APP / "options.mjs").read_text(encoding="utf-8")
    assert "crypto.subtle.digest" in ui
    assert 'new Worker("./worker.mjs",{type:"module"})' in ui
    assert '"external-import-unverified-source"' in ui
    assert "document.createElement" in ui
    assert 'innerHTML' not in ui
    assert "MinimalizerComputeRoute" not in ui+worker
    assert "fetch(" not in ui
    assert "vectorize_rgba" in worker
    assert "WebAssembly" not in ui
    for key in ("watershedDetail", "palette", "maxColors", "simplify",
                "adaptiveWindow", "binaryThreshold", "optimize"):
        assert key in opts
    assert "normalize(input)" in opts


def test_apache_host_sends_executable_modules():
    rules = (APP / ".htaccess").read_text(encoding="utf-8")
    assert "AddType application/javascript .mjs" in rules
    assert "AddType application/wasm .wasm" in rules
    assert "AddType application/manifest+json .webmanifest" in rules
    assert "RewriteRule" not in rules
