# Image Lab v0.9.0: Direct Library Capability Lab (2026-10-13)

## Request and truth boundaries
The user asked to continue from the accepted v0.8 per-layer FX stack and **actually test each library's capabilities**, whether or not they ultimately fit Image Lab. Prior assistant erroneously claimed that GitHub and desktop access was unavailable without searching. This turn explicitly discovered all installed GitHub, Remote Desktop Commander and Google Drive tool actions and successfully fetched actual current repo files and confirmed the desktop online.

This is a **working, incremental API research workbench**, not a claim of complete coverage of all exported methods in these libraries. Every registered runnable capability calls actual vendor code. Listed features are marked untested until a real execution returns successfully; exceptions get FAIL with error text and duration.

## Delivered runtime
- v0.9.0 collapsible Capability Lab under Image Lab tools, separate from main image effects, layer editor, and the existing Library Explorer.
- 15 library families; 64 registered explicit trial cases. 62 runnable. Two excluded: ONNX WebGPU on iPhone Safari (unsupported); Trianglify (GPL compatibility review; not bundled).
- Direct trial adapters: src/capabilities/geometry.js (d3-voronoi, Delaunator, Earcut, Pts.js, Rough.js, Paper.js); graphics.js (glfx.js and p5.js); pixi.js (PixiJS filters); vector.js (SVGPathCommander, SVGO); wasm-api.js (VTracer, Clipper2 native WASM operations and ONNX Runtime Web WASM inference).
- Library and feature selectors, run-one / run-all-current-library actions, previews (Canvas, SVG or structured JSON), per-capability PASS/FAIL/time and error messages, JSON export of actual trial records.
- Effects and WASM/ONNX engine load on demand; no auto-inference at startup. All original image pixels remain unchanged. No generative replacement, no external image upload, no modification to MinimalizerLocal.
- Changed existing VTracer and Clipper2 mode adapters to accept optional test variants while preserving current defaults. Existing p5 loader exported for reuse without extra copy.

## Verification before release
- npm ci/build/check: 42/42 Node tests PASS (original 39 plus three capability contracts).
- Actual Selenium + Microsoft Edge browser, with the full app and real bundled dependencies: 13 runnable graphics/geometry/vector/WASM libraries, **61/61 specific API trials PASS**.
- Independent ONNX Runtime Web WASM model inference on sample via the self-hosted 4.4MB model: **1/1 PASS**. The WebGPU selection is explicitly disabled.
- Total selected runnable API cases tested: **62/62 PASS** after resolving actual API interop bugs:
  - Earcut v3 exports flatten/deviation as named exports.
  - Paper.js expects actual Color objects in boolean path operations.
  - glfx.js dynamic ESM namespace exposes canvas via default.
  - p5.js expects a drawingContext-backed HTMLCanvas draw, not p.image(HTMLCanvas).
- Mobile browser emulation at 390, 375, 768 CSS pixels: no horizontal overflow, v0.8 preview dimensions preserved.
- Real physical iPhone acceptance of v0.9.0 remains OPEN; the user's prior acceptance covers v0.8.0 only.

## Coverage and remaining work
- Registered coverage is a focused first batch, not every public method across all 15 libraries. Unregistered APIs and additional parameter combinations need continued trials; extend catalog and implementation together.
- Do not call excluded, unregistered or merely listed capabilities PASS.
- Keep the release's source code and handoff in GitHub main. Save handoff to Google Drive only under 'chatGPT及びCodex用' if connected and authorized. Record final GitHub merge, upload readback, live HTTPS browser test below after completing them.
- Local test harnesses: tests/e2e_capabilities.py and tests/e2e_onnx_wasm.py (Python, Selenium + Edge); set IMAGE_LAB_QA_URL to target URL.

## Published production release (2026-10-13)
- PR #197 squash-merged into main, exact commit `7afd572993307338ae7563976411603291843d02`.
- Released to https://cf278796.cloudfree.jp/image-lab/ via certificate-verified FTPS, exactly 51 added/modified files from merged Git blobs; prior v0.8 files were retained, and new index.html and Service Worker uploaded last.
- All 51 files downloaded again over live HTTPS and checked by SHA-256 against the exact merged Git blob bytes: **51/51 PASS**.
- Re-ran the committed `tests/e2e_capabilities.py` against the live HTTPS URL: **61/61 direct API trials PASS** across 13 library categories; sample canvas remained unchanged. No horizontal overflow at 375/390/768 CSS pixels.
- Re-ran committed `tests/e2e_onnx_wasm.py` against live HTTPS: **ONNX Runtime Web WASM 1/1 PASS**; WebGPU explicitly disabled in browser UI.
- **Published candidate accepted by automation: 62/62 runnable trial cases PASS. User physical iPhone v0.9.0 acceptance: OPEN**. Earlier user confirmation is only for v0.8.0.
- Library vendor public API coverage remains incomplete. This record is about precisely the 64 registered cases (62 runnable, 2 excluded), not every library method.
