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
    assert "Minimalizer" not in src  # standalone UI has no Minimalizer-specific directions
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


def test_all_five_engines_are_real_in_page_and_bundled():
    import re
    ui=(APP/"index.html").read_text(encoding="utf-8")
    js=(APP/"app.mjs").read_text(encoding="utf-8")
    worker=(APP/"worker.mjs").read_text(encoding="utf-8")
    for engine in ("primitive","geometrize","primeval"):
        assert f'<option value="{engine}">' in ui
        assert f'data-engine="{engine}"' in ui
        assert f'"{engine}"' in worker
        assert (APP/"adapters"/f"{engine}.mjs").is_file()
    assert 'id="approx-count"' in ui
    assert 'id="approx-shape"' in ui
    assert 'id="cancel"' in ui
    assert 'new Worker("./worker.mjs",{type:"module"})' in js
    assert "canvas.toBlob" in js
    assert 'w.postMessage(payload,transfers)' in js
    assert "https://primitive-playground.taiseiue.jp/" not in ui
    assert "このページで変換" not in ui
    assert "SVGに変換" in ui
    assert "Primitive、Geometrize、Primevalはこのツール内では実行せず" not in (APP/"licenses.html").read_text(encoding="utf-8")


def test_all_three_engines_pinned_with_original_licenses():
    import hashlib
    from pathlib import Path
    vendors=APP/"vendor"
    for filename in (
        "primitive/primitive.wasm",
        "primeval/wasm/single/primeval_bg.wasm",
        "primeval/wasm/threaded/primeval_bg.wasm"
    ):
        blob=(vendors/filename).read_bytes()
        assert blob[:4]==b"\x00asm" and len(blob)>10000
    assert hashlib.sha256((vendors/"primitive/primitive.wasm").read_bytes()).hexdigest() == (
        "4aaf76dc80c052b900f32d4c8cb58b608ed9608e7bfa750d5289595287496ed0"
    )
    # Some older Windows checkouts retain CRLF from before the pinning attribute.
    # Canonical upstream JS must still match after line-ending normalization.
    geometrize_js=(vendors/"geometrize-haxe.js").read_bytes().replace(b"\r\n",b"\n")
    assert hashlib.sha256(geometrize_js).hexdigest() == (
        "5ade8209e26de7baecbff25c87fcd2c5493ed361a24b1f068b7e54506ee6be3f"
    )
    assert "Copyright" in (vendors/"primitive/LICENSE-PLAYGROUND").read_text(encoding="utf-8")
    assert "Copyright" in (vendors/"primitive/LICENSE-FOGLEMAN").read_text(encoding="utf-8")
    assert "Copyright" in (vendors/"primitive/LICENSE-GO").read_text(encoding="utf-8")
    assert "MIT" in (vendors/"LICENSE-GEOMETRIZE").read_text(encoding="utf-8")
    assert "MIT" in (vendors/"primeval/LICENSE").read_text(encoding="utf-8")
    geom=(APP/"adapters/geometrize.mjs").read_text(encoding="utf-8")
    prime=(APP/"adapters/primeval.mjs").read_text(encoding="utf-8")
    primitive=(APP/"adapters/primitive.mjs").read_text(encoding="utf-8")
    assert "runner.step(opts)" in geom
    assert "api.approximate" in prime
    assert "self.primitiveRun" in primitive


def test_all_five_engines_available_offline_without_cdn():
    import re
    sw=(APP/"sw.js").read_text(encoding="utf-8")
    assert "vector-lab-shell-v3-20261112-ui" in sw
    resources=re.findall(r'"(\./[^"\n]+)"',sw.split("const ASSETS=",1)[1].split("];",1)[0])
    assert len(resources)>25
    for resource in resources:
        path=(APP/resource).resolve()
        assert path.is_relative_to(APP.resolve())
        assert path.is_file(), f"missing PWA precache asset: {resource}"
    for engine in ("primitive","geometrize","primeval"):
        assert f"./adapters/{engine}.mjs" in resources
    assert "./vendor/primitive/primitive.wasm" in resources
    assert "./vendor/primeval/wasm/single/primeval_bg.wasm" in resources
    assert "./vendor/geometrize-haxe.js" in resources
    assert "https://cdn" not in sw


def test_mobile_ui_removes_redundant_blocks_and_keeps_engine_imports():
    src=(APP/"index.html").read_text(encoding="utf-8")
    script=(APP/"app.mjs").read_text(encoding="utf-8")
    css=(APP/"style.css").read_text(encoding="utf-8")
    assert "ほかの図形化エンジンと比較" not in src
    assert "使い方と注意点" not in src
    assert 'href="#help"' not in src
    assert 'aria-labelledby="others-title"' not in src
    assert len(re.findall(r'data-engine="(vtracer|imagetracer|primitive|geometrize|primeval)"',src)) == 5
    assert 'id="engine"' in src
    assert 'id="jump-result"' in src and 'id="compare-tools"' in src
    assert all(f'data-view="{mode}"' in src for mode in ("source","compare","result"))
    assert len(re.findall(r'data-import="(primitive|geometrize|primeval)"',src)) == 3
    assert 'class="import-details"' in src
    assert "setPreviewMode" in script and "aria-pressed" in script
    assert ".engine-picker" in css and ".view-picker" in css
    assert "prefers-reduced-motion" in css and ".sr-only" in css
