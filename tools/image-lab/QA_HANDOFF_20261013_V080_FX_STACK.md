# Image Lab v0.8.0 FX Stack / Library Explorer handoff (2026-10-13)

## Requested goals and delivery boundary
- User requested per-layer effects stacks and eventually trying every feasible capability of all libraries, including libraries not especially suited to Image Lab.
- DELIVERED: 8 deterministic, pixel-owner-bounded CPU reference effects: invert, grayscale, posterize, threshold, mosaic, blur, halftone, and edge emphasis.
- Each selected layer stores fx[] (max 8). Supported actions: add, toggle enable, move up/down, remove, preview amount changes, apply amount on change, and undo each committed action. Existing tone remains available and is applied before FX.
- DELIVERED: Library Explorer enumerates 15 known/current libraries and research topics. For 13 existing application modes, a button launches a real existing representative experiment. This is **not** a claim of testing the entire vendor API.
- NOT DELIVERED: exhaustive API execution across all 15 libraries, WebGPU-only iPhone modes, overlapping compositor, persistent project file format, vendor-backed FX for every stack entry.

## Non-destructive and compatibility invariants
- No generative fill. Uploaded source canvas and source buffer remain unchanged by FX. Pixel owner map stays disjoint and unchanged.
- Spatial effects (blur, mosaic, edges) sample only pixels of the same owner and original alpha > 0. All FX preserve original alpha.
- FX sequence is ordered. Preview changes from the intensity slider are not committed until change; each commit enters existing max-five Undo history.
- Exported composite PNG and selected-layer PNG use the stack processing. Merge bakes visible transformed RGBA and clears FX on the merged layer without changing its pixels.
- Existing iPhone preview-first compact layout and semantic/color decomposition remain in place.

## Verified locally (before release)
- Built with npm ci and npm run build; npm run check: **39/39 PASS**.
- Headless Edge with CDP mobile metrics and Selenium end-to-end scenarios at 390x844, 375x667, 768x1024 and 1440x900: **4/4 PASS**.
- Browser checks: no horizontal overflow; full-width result remains; color decomposition; add two effects; live output changes; toggle and Undo restores; strength slider preview/commit and Undo; merge exactly preserves displayed composite; original canvas unchanged.
- Automatic tests cover every effect, alpha invariance, source/owner immutability, neutral/disabled effects, order and move/delete/toggle APIs, merge parity, reorder, invalid input and max-eight cap.
- Browser tests are **not** physical iPhone Safari acceptance.

## Release/next steps
- GitHub PR/merge, FTPS deployment, HTTP byte-for-byte readback and remote QA handoff update should be recorded below after verification.
- Physical iPhone confirmation is **OPEN** until user says they confirmed v0.8.0.
- Library API campaign follow-ups: enumerate per-library public methods; implement direct trial adapters; classify supported/unavailable and record results. ONNX Runtime Web WebGPU on iPhone Safari is skipped due to known support limitations; WASM is viable.
