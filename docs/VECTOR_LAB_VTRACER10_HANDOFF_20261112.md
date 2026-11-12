# ベクター変換室（Vector Lab） v1.0-alpha.4

2026-11-12 / independent browser/PWA product in `watarionn/portfolio-site`.

## Scope and ownership
- Public URL: `/vector-lab/`; canonical source `tools/vector-lab/`; indexed separately as portfolio work #035.
- This is **not** the Minimalizer converter, LocalWorker, ZeroBase2, or the Minimalizer Golden path.
- The 5-engine comparison UX provides **real browser-local execution** for VTracer 1.0.0-alpha.4 and ImageTracerJS v1.2.6. Primitive / Geometrize / Primeval are **external demos** whose SVG output the user explicitly imports for comparison. Do not suggest all five algorithms run inside this PWA.
- No server-side image upload, no own database, no auth/owner machine credentials, no storage of images. PWA service worker caches only same-origin app files; image inputs/outputs remain in browser memory. Public origin is independent from the owner's private Local PWA.

## VTracer 1.0.0-alpha.4
Pinned official release verified from upstream GitHub/npm, not the legacy VTracer 0.6.x demo. Features:
- color-cluster / watershed / B&W clustering with watershed-detail tuning;
- seam-free cutout mosaic or stacked, spline/polygon/pixel geometry;
- fixed OKLab-mapped palette or max-colors auto-palette;
- simplify tolerance, SVG coordinate precision and optimization 0..2;
- binary fixed threshold or Bradley–Roth adaptive threshold/window/sensitivity;
- speckle, RGB bit precision, gradient step and spline fine-tuning.

**Browser support approach:** official npm `@visioncortex/vtracer@1.0.0-alpha.4` was packed without installing packages globally. Exact npm archive SHA256:
`002c33241a0c7b5bee47fd2f29eb4f6b2978750e4b7e913c4820d7a74c481495`.
Official `pkg/vtracer_wasm_bg.wasm` unchanged, SHA256:
`63716b70497b7468ef97545b50f5f34b8bbb7acde2d7b00deb4eb40781446d45`,
size 668,378 bytes. The official Node wasm-bindgen JavaScript glue has only the
two CommonJS exports and synchronous `fs.readFileSync` bootstrap replaced with
an ESM export and async `WebAssembly.instantiate` function. Code is
`vendor/vtracer10-browser.mjs`, and input comes from HTML Canvas RGBA via a
same-origin module Worker. The original wasm bytecode and Rust functions are
unchanged; all import/boot options validated against the native Node build.
The official upstream is dual MIT OR Apache-2.0; original MIT license
`vendor/LICENSE-VTRACER` retained. Original ImageTracerJS Unlicense header retained.
See `licenses.html`.

## User experience
- Responsive Japanese interface; installable independent PWA with PNG and iPhone touch icons.
- Input PNG/JPEG/WebP max 20MB, 8192px source dimension guard, process max 1600px longest side;
- live option changes with debounced cancellation/restart, manual conversion, reset;
- shape count, RGBA error and alpha error, side-by-side/overlay comparison slider;
- exports SVG, PNG at selected working resolution and source-free settings + diagnostics JSON;
- explicit importing of external SVG, strict XML/SVG element guard and image-only preview. Imported SVG origin is marked as **unverified**, and its source identity is not assumed.

## Independent tests
- `node tests/js/test_vector_lab_options.mjs` → `VECTOR_LAB_OPTIONS_PASS`.
- `pytest tests/test_vector_lab_standalone.py -q` → 4 passed on owner Windows PC (original revision before the icon additions).
- `python tools/validate_public_repo.py` → **PASS**, 64,549 tracked files, public/private boundaries retained (the check is broad and slow).
- `python tools/build_deployment.py` → **PASS**, 45 mapped entries, 2,413 build files (before PWA icons).
- `python tests/smoke_vector_lab_chrome.py` → **VECTOR_LAB_CHROME_PASS**, real Chrome/CDP, synthetic 64px source, VTracer default/watershed/palette/adaptive/fixed 5 modes and ImageTracerJS, third-party SVG import, output controls; genuine output SVG files differ for color modes. Adaptive and fixed binary may legitimately match for a uniform-color fixture.
- Live public FTPS/HTTPS and physical iPhone Safari require separate post-merge readback.

## Deployment
- Current official production pipeline: `config/deployment-map.json` maps `tools/vector-lab/` → `vector-lab/`. Normal build emits `build/public_html/vector-lab/`.
- `scripts/release_vector_lab.py` is the scoped deployment procedure: certificate-verified FTPS from the owner's existing Windows Credential Manager target, unchanged verified host/root, app-assets-only uploads, optional root index/sitemap only when previous deployed baseline exactly matches a pinned main commit, and FTPS + HTTPS SHA-256 readback for every deployed artifact. No deletions or full-site upload.
- Root index and sitemap must not be overwritten if the remote source diverged. Such a case still permits the independent URL to function, but homepage listing is not confirmed as deployed.

## Future extension
A fully local Primitive / Geometrize / Primeval execution engine is a separate porting/licensing and performance project; this release preserves the existing external-demo + SVG-import integration. This tool does not perform semantic anatomy-aware style selection; that remains Minimalizer's separate work.
