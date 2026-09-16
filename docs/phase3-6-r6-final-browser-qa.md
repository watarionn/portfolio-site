# Phase 3.6-R6 Final Browser QA

Updated: 2026-09-16

## Result

**PASS**. The final R6 13-chunk WebP q90 package was staged against the actual R6 branch and validated in Google Chrome through Puppeteer.

The runtime topology stayed locked at 13 terrain chunks, 14 project placements and 4 districts. No production deployment was performed.

| Viewport | Max anchor error | Max width error | Horizontal overflow | Terrain assets |
| --- | ---: | ---: | ---: | ---: |
| 390 x 844 | 0.024084 px | 0.011744 px | 0 px | 13/13 |
| 820 x 1000 | 0.020731 px | 0.011744 px | 0 px | 13/13 |
| 1440 x 900 | 0.001900 px | 0.000050 px | 0 px | 13/13 |

All 13 terrain assets returned successfully and decoded at 2048 x 1536. Application console/page errors were zero.

## Measurement note

Project anchor and width checks use the authored layout boxes in `.world-projects` and compare them with `map-layout.json` world coordinates. Hover/selected CSS transforms are intentionally excluded because they are interaction-state decoration, not authored placement geometry.

The local test server requested `/favicon.ico` once and returned 404. This is not a Portfolio City application asset and is excluded from application-error judgment.

## Final asset authority

Repository runtime assets are recorded in `docs/phase3-6-r6-final-runtime-manifest.json` with byte sizes and SHA-256 hashes.

The exact final package is also preserved in Google Drive as `PortfolioCity_R6_FINAL_RuntimePackage_v1.zip` (Drive ID `1Wa9CgDVzsAz9MoGpvvmpBM82cAjlZZd1`).

The three harmonized working masters preserved in the same R6 Drive folder are:

- North: `north_r6_HARMONIZED_WORKING_MASTER.png` (`15jZe4j45vxJNj6UxS_XL4jl7aLioWu2Y`)
- Middle: `middle_r6_HARMONIZED_WORKING_MASTER.png` (`1Eta1rbIsUacIxgr5GOuV9ZsLrTNla7hH`)
- South: `south_r6_HARMONIZED_WORKING_MASTER.png` (`1eQ0TunZN1d7VphHwZ4DWhf_OgA0ATjuR`)

The WebP q90 seam gate remains **14/14 PASS** and the runtime package totals **2,247,098 bytes**.

## Review gate

R6 is ready for PR review after these assets and QA records are committed to PR #90. Merge and production deployment remain separate explicit-approval steps.
