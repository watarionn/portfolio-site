# Third-party licenses and source availability

All source images stay on this device. No CDN or image processing uploads.
JavaScript dependencies are pinned in package-lock.json, compiled to assets/main.js plus lazy-loaded chunks. Corresponding license notices are under licenses/.

| Bundled package | Version | Declared license |
|---|---|---|
| @pixi/colord | 2.9.6 | MIT |
| @thednp/dommatrix | 3.1.2 | MIT |
| @xmldom/xmldom | 0.8.15 | MIT |
| clipper2-wasm | 0.4.0 | BSL-1.0 |
| d3-voronoi | 1.1.4 | BSD-3-Clause |
| delaunator | 5.0.1 | ISC |
| earcut | 3.0.2 | ISC |
| eventemitter3 | 5.0.4 | MIT |
| glfx | 0.0.4 | MIT |
| ismobilejs | 1.1.1 | MIT |
| p5 | 1.11.11 | LGPL-2.1 |
| paper | 0.12.18 | MIT |
| parse-svg-path | 0.2.0 | MIT |
| pixi.js | 8.22.0 | MIT |
| pts | 1.0.1 | Apache-2.0 |
| robust-predicates | 3.0.3 | Unlicense |
| roughjs | 4.6.6 | MIT |
| svg-path-commander | 2.3.3 | MIT |
| svgo | 4.1.0 | MIT |
| tiny-lru | 11.4.7 | BSD-3-Clause |
| vtracer-wasm | 0.1.0 | See upstream LICENSE |

## Separately hosted, unmodified vendor files

- p5.js (LGPL-2.1) is loaded only when selected. Both the unmodified p5.min.js and its corresponding readable p5.js are distributed in assets/vendor/ and are independently replaceable. Original license in licenses/p5-license.txt.
- Clipper2-WASM 0.4.0 (BSL-1.0): assets/vendor/clipper2z.js and clipper2z.wasm. Origin https://github.com/ErikSom/Clipper2-WASM . BSL license text https://www.boost.org/LICENSE_1_0.txt .
- VTracer WASM 0.1.0: assets/vendor/vtracer.js and vtracer.wasm. Package https://github.com/jsscheller/vtracer-wasm ; upstream https://github.com/visioncortex/vtracer .
- Trianglify is NOT bundled (GPL-3.0 compatibility pending).

## Integrity of standalone WASM
- clipper2z.wasm: SHA-256 429e866b4d7813cabfa7d31e6650825343109fb7d7a1702c533e8597573449ec
- vtracer.wasm: SHA-256 b93108af0f23e13a64f4b23f2582312a325be9d7ff833e49d04554cd99606f0b
