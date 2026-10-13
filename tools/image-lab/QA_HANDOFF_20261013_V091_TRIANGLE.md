# Image Lab v0.9.1 Trianglify-compatible experiment
Base: main b6c7061, independent worktree.
Official qrohlf/trianglify is GPL-3.0; do not bundle. Instead use a distinct MIT alternative @gkucmierz/trianglify@1.0.0 with clear labeling and attribution.
Four vendor API trials: pattern, palette, seed, gradient; generate SVG in browser, do not edit source image.
ONNX WebGPU remains unsupported for iPhone Safari.
User additionally wants combinations of Voronoi/Delaunay/Earcut/Rough/Paper/glfx/VTracer/ONNX as layer effects. Not implemented in v0.9.1: plan next an undoable per-layer effect pipeline with source-boundary masks and ordered FX.
Anime semantic improvement research: existing ATR-18 photoreal model on 256px input; SkyTNT segmentation foreground-only, AnimeSeg Mask2Former 12-class including hair, face, clothes but no upper vs lower. Benchmark anime set and browser model compatibility before any replacement.
Record concrete tests, Git state, deploy result after verification.

Local verification (isolated Windows worktree): npm ci/build/check 43/43 PASS; Selenium Edge direct API 65/65 PASS across 14 executable groups; original source canvas unchanged; mobile widths 375/390/768 no overflow; ONNX WASM 1/1 PASS and WebGPU excluded. Build version 0.9.1. User physical iPhone 0.9.1 is not verified.
