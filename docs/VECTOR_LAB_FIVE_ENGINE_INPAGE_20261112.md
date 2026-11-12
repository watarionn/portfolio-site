# Vector Lab in-page five-engine integration (2026-11-12)

Status: **CANDIDATE** until fully reviewed, built, deployed, read back from public HTTPS, and independently tested in live Chrome. Physical iPhone acceptance follows release; it is not inferred from earlier v1 tests.

## Goal / context
Owner accepted Vector Lab v1 on physical iPhone, then explicitly asked to operate the bottom three engines **inside the existing page**, with no navigation to external demos. Retain the existing independent `/vector-lab/` PWA, its VTracer 1.0, ImageTracerJS, SVG/PNG/JSON export, external SVG import, comparison and provenance boundaries. Do **not** change Minimalizer's production or LocalWorker semantics.

## Exactly what executes locally
All five render from the same user-selected, downscaled source inside **the browser**. No server upload or remote API:
- `VTracer`: pre-existing pinned 1.0.0-alpha.4 browser WASM.
- `ImageTracerJS`: pre-existing pinned 1.2.6 JavaScript.
- `Primitive`: **actual** Michael Fogleman Primitive Go library through Taisei Uemura's Primitive Playground Go WASM port, upstream commit `35357219c2455ecb6a868f56be89a9baae0ff2f6`. Source `packages/primitive-wasm` uses `github.com/fogleman/primitive@v0.0.0-20200504002142-0373c216458b`. Built with Go **1.26.4** using `GOOS=js GOARCH=wasm go build -trimpath`; `wasm_exec.js` from the same Go version. WASM SHA-256 `4aaf76dc80c052b900f32d4c8cb58b608ed9608e7bfa750d5289595287496ed0`. MIT source licenses + Go runtime license included.
- `Geometrize`: actual Geometrize Haxe compiled JavaScript from npm `geometrizejs@0.0.19` (not a substitute drawing algorithm), `geometrize-haxe.js` SHA-256 `5ade8209e26de7baecbff25c87fcd2c5493ed361a24b1f068b7e54506ee6be3f`. Its original compiled CommonJS global export is initialized in a dedicated module Worker without eval. MIT notice preserved.
- `Primeval`: official npm `@domoarigatomrburato/primeval@0.2.2` browser JS / Rust WASM. Original single and threaded WASM variants and their JS dependencies are vendored; single-threaded is chosen by the package unless cross-origin isolated. No CDN or external script. MIT notice included. This is an independent algorithm, **not** identical to the Go Primitive implementation.

## Execution isolation
- Selecting a geometric engine presents bounded **shape count and shape type** controls. All 3 render their own SVG; the existing source image, Blob-SVG preview, RGBA-difference metrics, candidate bank and exports work identically.
- Every conversion runs in a newly created Web Worker and can be canceled with `変換を停止`. Original input/output remain client-side and old results are preserved until a new candidate succeeds.
- Primitive & Primeval receive an in-memory PNG encoding from the existing downsized canvas. Geometrize operates on a copy of the RGBA buffer. Primitive and Geometrize emit shape-progress events. Image is not sent to external demo sites.
- Limits in browser adapters: Primitive 1..100, Geometrize 1..500, Primeval 1..600 shapes; source max length 1600 px per existing UI and 20MB original upload limit. Start with Primitive around 20 shapes on iPhone; performance is device dependent.
- The service-worker cache version is bumped and includes the vendored engine assets, allowing offline use *after the new service worker has installed and cached all assets*. Do not claim offline readiness before installation and browser test.
- Existing explicit `SVGを読み込む` inputs remain as an optional convenience, not a prerequisite; external demo links are now references only.

## Licensing and origin
All third-party engine versions and license links are documented in `licenses.html`. Compiled binaries come from pinned upstream versions, not an anonymous CDN. The desktop Go build exists solely as the build environment, not as a production dependency. No changes to the user's existing Minimalizer source, Golden or owner masks.

## Release sequence
1. Verify SHA provenance and all service worker precache paths.
2. Source checks, targeted pytest, actual Chrome SVG generation for **all five** plus existing VTracer modes and source import; optionally test output PNG/export, cancel and navigation.
3. Run the existing full public repository validation and production build **once** on the confirmed branch, and review the changed file list.
4. PR and main integration, then deploy **only** `/vector-lab/` through existing approved certificate-validated WinCred FTPS method. Upload new engine assets **before** app/worker/UI; upload `sw.js` last after all its dependencies exist. Avoid upload of any unrelated site routes, deletions or whole-site mirrors.
5. Read back exact raw HTTPS hashes and run actual public HTTPS Chrome in a clean profile. Keep evidence & rollback in repo, verify receipt readback. Only then invite physical iPhone Safari and PWA acceptance.
