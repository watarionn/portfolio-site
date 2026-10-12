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

## Semantic Layers v0.4 (in-browser AI)

- Model: Xenova/segformer_b0_clothes, quantized ONNX. Derived from mattmdjaga/segformer_b0_clothes (MIT). Base: https://huggingface.co/mattmdjaga/segformer_b0_clothes . ONNX export: https://huggingface.co/Xenova/segformer_b0_clothes .
- Pinned model revision: a2489ea8e7ec1ee912190546bad31a4906ccca76.
- Runtime: onnxruntime-web 1.30.0, MIT license. JavaScript bundled with esbuild. Self-hosted WASM binaries in assets/ort/.
- Inference runs only in the browser, no image upload. Accuracy can be lower on illustrations than photos.
- assets/models/segformer-b0-clothes-int8.onnx SHA256 4f9d3e4fcf3e0b677ee0cf9810ebccdc7f478f9c69a60d38267bad598799ef73
- assets/ort/ort-wasm-simd-threaded.wasm SHA256 3398c10d07d229bd91b364548e130e0e51a8e5704b88c7c083ebbeb78842dee2
- assets/ort/ort-wasm-simd-threaded.mjs SHA256 e13f7f94fc51b4ca72b12faeb1ee95f4ace6dfbc8939bc718aabdc0a27c4299b
