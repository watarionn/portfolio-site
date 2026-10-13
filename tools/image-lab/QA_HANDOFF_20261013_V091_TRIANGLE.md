# Image Lab v0.9.1 Trianglify-compatible experiment
Base: main b6c7061, independent worktree.
Official qrohlf/trianglify is GPL-3.0; do not bundle. Instead use a distinct MIT alternative @gkucmierz/trianglify@1.0.0 with clear labeling and attribution.
Four vendor API trials: pattern, palette, seed, gradient; generate SVG in browser, do not edit source image.
ONNX WebGPU remains unsupported for iPhone Safari.
User additionally wants combinations of Voronoi/Delaunay/Earcut/Rough/Paper/glfx/VTracer/ONNX as layer effects. Not implemented in v0.9.1: plan next an undoable per-layer effect pipeline with source-boundary masks and ordered FX.
Anime semantic improvement research: existing ATR-18 photoreal model on 256px input; SkyTNT segmentation foreground-only, AnimeSeg Mask2Former 12-class including hair, face, clothes but no upper vs lower. Benchmark anime set and browser model compatibility before any replacement.
Record concrete tests, Git state, deploy result after verification.

Local verification (isolated Windows worktree): npm ci/build/check 43/43 PASS; Selenium Edge direct API 65/65 PASS across 14 executable groups; original source canvas unchanged; mobile widths 375/390/768 no overflow; ONNX WASM 1/1 PASS and WebGPU excluded. Build version 0.9.1. User physical iPhone 0.9.1 is not verified.

## Published production closure (2026-10-13)
- PR #198 squash-merged to main: 77ee54c5ad52226b2758d267eeda6508adc608c2.
- Published six exact files from the merged Git blobs to https://cf278796.cloudfree.jp/image-lab/ through certificate-verified FTPS using the established Windows Credential Manager deployment path; no deletion and no site-wide upload.
- HTTPS raw SHA-256 readback: 6/6 exact matches for new chunk, main-v0.9.1.js, main.js, style-v0.9.1.css, index.html and service-worker.js.
- Actual Edge on the PUBLIC HTTPS URL: 65/65 direct graphic/vector/WASM/Trianglify trials PASS, original source pixels unchanged; 375/390/768 viewport checks PASS.
- Real PUBLIC HTTPS ONNX Runtime Web WASM inference: 1/1 PASS; ONNX WebGPU iPhone Safari excluded.
- Total available trials: 66/66 verified; physical iPhone acceptance still OPEN.
- No upstream qrohlf GPLv3 dependency bundled. MIT-compatible replacement is labeled separately. Old versioned hashed chunks retained in Git and on host.
- Future separate work: reversible per-layer ordered effect pipelines and empirical anime-specific parser evaluation, without silently replacing the ATR-18 model.
