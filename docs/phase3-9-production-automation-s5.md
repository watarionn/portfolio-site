# Phase 3.9 - Production Automation S5

Updated: 2026-09-30

Status: **PASS / shared asset pipeline established / no production cutover**

## Goal

Replace repeated World and District asset-handling sequences with reusable GitHub-hosted tooling.

The Phase 5 target is not full autonomous deployment.

The target is:

```text
canonical source
-> identity validation
-> deterministic asset processing
-> manifest
-> validation
-> explicit deployment package
```

Browser QA and production publication remain separate.

## Shared Production Asset

Added:

`tools/portfolio_asset_pipeline.py`

Supported operations:

- inspect an image and assert identity / dimensions
- load canonical source from the current repository
- load accepted source from an immutable Git ref
- generate WebP / AVIF responsive derivatives
- estimate decoded RGBA memory
- deterministically flatten a District scene
- derive semantic hotspot geometry from alpha
- generate machine-readable manifests
- re-open and validate manifest outputs
- validate hotspot geometry against the canvas
- optionally bind hotspot IDs to canonical metadata
- prepare an explicit deployment package with per-file hashes

The pipeline contains no direct production-deployment path.

## Safety model

### Source identity

World source is now locked to:

```text
portfolio-city/assets/world/v1/master/portfolio-city-master-world-v1.jpg
8192 x 6144
14,278,125 bytes
SHA-256
1b63fd1b7439e7498a827cfb368d4eb2ee0b4bd06948eac82f5803f2e61a1c25
```

Waterside S4 continues to use its immutable accepted-source commit and source hashes.

### Package safety

Deployment package preparation only copies explicitly listed files.

If its output directory already contains files, the pipeline stops.

It never recursively clears an existing package directory.

### Deployment boundary

The pipeline does not contain:

- production credentials
- WinSCP calls
- FTP / FTPS calls
- remote synchronization
- remote deletion

Publication remains a later explicit gate.

## Config-driven jobs

Canonical Phase 5 configs:

- `tools/portfolio_asset_pipeline_configs/world-runtime-v1.json`
- `tools/portfolio_asset_pipeline_configs/waterside-s4.json`
- `tools/portfolio_asset_pipeline_configs/waterside-s4-proof-package.json`

This moves sizes, quality, source identity and placement facts out of repeated shell commands.

## World proof

The common pipeline regenerated the complete S2-selected runtime set.

| Output | Bytes | Decoded RGBA |
| --- | ---: | ---: |
| AVIF 4096 x 3072 q62 | 822,682 | 48 MiB |
| AVIF 3072 x 2304 q62 | 610,913 | 27 MiB |
| WebP 4096 x 3072 q84 | 1,273,750 | 48 MiB |
| WebP 3072 x 2304 q84 | 914,144 | 27 MiB |

All four files pass manifest re-validation.

Their byte counts exactly match the corresponding S2 benchmark candidates.

The new manifests additionally record SHA-256:

```text
AVIF 4096
3bed5257661943e9ff2a6ca7833bab93e43a82a7409095a64410303aa3396196

AVIF 3072
6a85bc8328a194e663ff36d4cdf4e780c1771a3ade28faed779cb7f706a91a90

WebP 4096
272b4d8042dc9ff0dc4ddd2e31807c01ec1e927045b07e76eaba528782952dd0

WebP 3072
6f3a9415df465769da88a65b65e539513521f10d7da157cbbc8ac59e27512604
```

## District proof

The common pipeline regenerated Waterside S4 from the immutable accepted source lock.

Result:

```text
common-pipeline S4 SHA
79c1593cfa31decf5074a830829a7e8b5ddea5853a03327ed5db9fea3920053c

committed S4 SHA
79c1593cfa31decf5074a830829a7e8b5ddea5853a03327ed5db9fea3920053c
```

**Exact match: PASS.**

The existing focused S4 builder also produces the same SHA after being refactored to shared source/hash primitives.

The common manifest reproduces the Aquarium hotspot:

```text
bbox = [168, 247, 513, 549]
padding = 12 px
```

and validates the ID against canonical `projects.json`.

## Deployment-package proof

The S4 proof package contains exactly five declared files:

1. index.html
2. prototype.css
3. prototype.js
4. Waterside scene JSON
5. Waterside scene WebP

Total:

```text
5 files
1,940,759 bytes
```

The package manifest records each repository-relative path, byte size and SHA-256.

No unrelated repository files are copied.

## Regression tests

Executed from the final S5 branch:

```text
python -m py_compile   tools/portfolio_asset_pipeline.py   tools/portfolio_city_world_derivatives.py   tools/build_waterside_s4_single_scene.py   tools/test_portfolio_asset_pipeline.py   tools/check_portfolio_city_production_automation_s5.py

python tools/test_portfolio_asset_pipeline.py -v
python tools/check_portfolio_city_production_automation_s5.py
node tools/check_portfolio_city_district_single_scene_s4.mjs
```

Result:

```text
4 unit tests: PASS

Portfolio City S5 automation contract: PASS

Portfolio City Waterside S4 contract: PASS
```

World pipeline validation: PASS.

Waterside pipeline validation: PASS.

`git diff --check`: PASS.

## Existing specialized tools

The focused checkpoint tools remain available:

- `tools/portfolio_city_world_derivatives.py`
- `tools/build_waterside_s4_single_scene.py`

They now import common asset primitives from the shared pipeline.

This retains reproducibility of earlier checkpoint commands without keeping separate low-level implementations.

## S5 decision

**Production Automation Phase 5: PASS.**

Repeated asset preparation no longer requires hand-written RDC sequences.

For future World or District assets, prefer:

1. canonical source
2. pipeline config
3. pipeline run
4. manifest validation
5. browser / visual QA where applicable
6. explicit deployment package
7. separate publication approval

RDC remains appropriate for local browser QA and for executing the local pipeline when necessary, not for encoding the workflow itself.

## Production boundary

S5 does not:

- publish new World derivatives
- replace the production runtime
- deploy the S4 District scene
- make artwork approval automatic
- make browser QA automatic
- store deployment credentials
- delete rollback assets

## Next checkpoint

**Phase 6 - Production art**

Use the now-stable asset/runtime contracts to produce accepted final District scenes in the planned order:

1. Waterside Play
2. Archive Street
3. Workshop Alley
4. Observatory Hill
5. Master World refinement

Canonical runbook:

`docs/PORTFOLIO_CITY_ASSET_PIPELINE.md`

Machine-readable evidence:

`docs/phase3-9-production-automation-s5-results.json`
