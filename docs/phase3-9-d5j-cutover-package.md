# Phase 3.9 CP-D5J - Cutover Package / Pre-Activation QA

Updated: 2026-09-20
Status: PASS / activation remains OFF by default

## Reversible activation
- Production default remains OFF via `DEFAULT_FEATURE_FLAG = false`.
- Local/pre-activation override: append `?world39=1` to `portfolio-city/city.html`.
- The override exercises the real production hierarchy shell and canonical Master World assets without changing the default visitor path.
- Rollback is immediate: remove the query override locally; production remains unaffected until an explicit default-flag cutover.

## Pre-activation checks
- `node --check portfolio-city/world-hierarchy-shell.js`: PASS
- `python tools/check_portfolio_city_contract.py`: PASS
- `node tools/check_portfolio_city_runtime.mjs` from repo root: PASS
- `python tools/world-tiles/qa-master-world.py ...`: PASS
- Master World: 16 x 12 / 192 tiles / 512 x 512 / SHA-256 / 8192 x 6144
- Reconstruction PSNR: 43.39 dB
- Tile bytes: 3,833,926
- `git diff --check`: PASS

## Production-shell browser exercise
The real `portfolio-city/city.html?world39=1` path was served locally and captured in headless Chrome.
- Desktop: 1440 x 1200, real production shell + Master World visible.
- Mobile: 390 x 844, real production shell + Master World visible.
- Captures: `docs/phase3-9-d5j-1440.png`, `docs/phase3-9-d5j-390.png`.

## Safety / release boundary
- No main merge.
- No production deployment.
- No default feature activation.
- Existing Portfolio City remains the rollback baseline.
- The query override is a QA mechanism, not the final public feature-switch design.

## Decision
CP-D5J: PASS.
The cutover package is reversible and the actual production shell can mount the canonical 192-tile Master World at desktop and mobile widths.

Exact next checkpoint: **CP-D5K Activation Gate / Final Cutover Review**.
At D5K, review the enabled production-shell presentation and activation mechanism, then decide whether to flip the default flag for the Phase 3.9 branch. Main merge/deployment remains a separate explicit release action.
