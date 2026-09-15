# Phase 3.6-R5 — 13-Chunk Runtime Registration Staging

Status: **PARTIAL — fixture and browser QA complete; binary asset commit pending**

## Locked registration target

- world: `minX=-1024`, `minY=-768`, `width=5120`, `height=3840`
- logical chunk: `1024 x 768`
- terrain files: 13 WebP files, each `2048 x 1536`
- intended runtime asset root: `portfolio-city/assets/illustrated/terrain/`
- current 14 project authored coordinates remain unchanged
- current four district regions remain unchanged
- current camera start coordinates remain unchanged

The machine-readable registration fixture is `docs/phase3-6-r5-runtime-registration-fixture.json`.

## Asset identity

The exact Drive-fixed q90 WebP package was re-read for this stage. The 13 files total `2,682,986` bytes (`2.56 MiB`). Every file is represented in the fixture with exact byte size and SHA-256. The local asset checker passed against the extracted Drive package:

`R5 registration fixture passed: 13 chunks / negative origin / 13 unique WebPs`

## Staged browser QA

A candidate map layout using the locked R2 world bounds and the exact Pass 8 WebPs was exercised in Chromium 144 at:

- 390 x 844
- 820 x 1000
- 1440 x 1000

All three passed:

- 13 chunks registered
- 14 current project coordinates registered
- 13 WebPs loaded
- `column=-1` reaches exactly `left=0%`
- `row=-1` reaches exactly `top=0%`
- east outer chunk reaches exactly `100%`
- south outer chunk reaches exactly `100%`
- all chunks stay within world bounds
- all current project coordinates stay within world bounds
- real pointer drag changes pan
- pan remains clamped
- document-level horizontal overflow is zero before and after drag

The QA page initially exposed an overflow caused only by its unbroken debug JSON text. The QA fixture display was corrected with text wrapping and the full test was rerun. Terrain/world overflow remained zero in the passing run.

Detailed results are in `docs/phase3-6-r5-browser-qa.json`.

## Not changed yet

The production-shaped branch intentionally does **not** yet change:

- `portfolio-city/data/map-layout.json`
- production terrain asset files
- production deployment
- project authored coordinates
- district geometry

The 13 WebP binaries still need to be committed under the intended runtime asset root before `map-layout.json` can safely be switched from 9 chunks to the 13-chunk topology.

## Final R5 gate

Before this stage can become Ready for review:

1. commit the exact 13 WebPs with the fixture hashes,
2. update `map-layout.json` to the registered 13-chunk world,
3. update runtime/contract tests from the legacy 9-chunk expectation to 13 chunks,
4. run fresh-clone local validation,
5. run the 390 / 820 / 1440 browser QA again against the actual staged runtime tree.

No GitHub Actions are required for this gate.
