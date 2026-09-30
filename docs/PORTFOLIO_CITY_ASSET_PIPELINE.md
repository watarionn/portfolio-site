# Portfolio City Asset Pipeline

Updated: 2026-09-30

Status: **Canonical production-asset runbook**

## Purpose

`tools/portfolio_asset_pipeline.py` is the shared, non-generative asset preparation layer for the Single-Image Portfolio City architecture.

It replaces repeated ad-hoc sequences for:

- checking image identity
- checking dimensions
- generating responsive runtime images
- estimating decoded bitmap memory
- flattening accepted District source layers
- deriving semantic hotspot geometry
- writing and re-validating manifests
- preparing explicit deployment packages

It does **not** deploy to production.

Browser QA and production publication remain separate gates.

## Source policy

The pipeline accepts two canonical source forms.

### Repository file

Use when the asset is already canonical in the current repository state.

```json
{
  "type": "file",
  "path": "portfolio-city/assets/...",
  "expectedSha256": "...",
  "expectedSize": [8192, 6144]
}
```

### Immutable Git source

Use when an accepted historical asset must be reproduced without restoring the old runtime.

```json
{
  "type": "git",
  "ref": "<immutable commit>",
  "path": "portfolio-city/assets/...",
  "expectedSha256": "...",
  "expectedSize": [1672, 941]
}
```

If the historical object is not present locally, fetch that exact ref first.

The pipeline does not silently substitute a local file for a missing canonical source.

## Commands

### Inspect one image

```bash
python tools/portfolio_asset_pipeline.py inspect \
  --input <image> \
  --expect-width <width> \
  --expect-height <height> \
  --expect-sha256 <sha256>
```

The report includes:

- format
- dimensions
- bytes
- SHA-256
- decoded RGBA byte estimate

### Build World runtime derivatives

```bash
python tools/portfolio_asset_pipeline.py run \
  --config tools/portfolio_asset_pipeline_configs/world-runtime-v1.json \
  --repo . \
  --output-dir <empty-or-new-working-dir>
```

The canonical config currently produces the S2-selected set:

- AVIF 4096 x 3072 q62
- AVIF 3072 x 2304 q62
- WebP 4096 x 3072 q84
- WebP 3072 x 2304 q84

The 8192 x 6144 authoring Master is source material, not an automatic browser download.

### Build a District Single-Scene

Example:

```bash
git fetch --depth=1 origin fa398ce5db39cdcce242b0fa7bb9881c99d5f02a

python tools/portfolio_asset_pipeline.py run \
  --config tools/portfolio_asset_pipeline_configs/waterside-s4.json \
  --repo . \
  --output-dir <working-dir>
```

The config defines:

- accepted background source
- accepted project-building source
- immutable hashes
- canvas
- placement anchor / coordinates
- hotspot padding
- runtime format

The pipeline alpha-composites the locked art and derives the semantic hotspot from the visible alpha bounds.

No image generation is performed.

### Re-validate a manifest

World:

```bash
python tools/portfolio_asset_pipeline.py validate \
  --manifest <world-output>/portfolio-city-world-runtime-v1.manifest.json \
  --root <world-output>
```

District:

```bash
python tools/portfolio_asset_pipeline.py validate \
  --manifest <district-output>/waterside-s4-pipeline.manifest.json \
  --root <district-output> \
  --metadata portfolio-city/data/projects.json
```

Validation reopens the actual images and checks:

- file existence
- SHA-256
- dimensions
- byte size
- hotspot polygon geometry
- hotspot coordinates inside the canvas
- optional canonical metadata ID binding

### Prepare a deployment package

```bash
python tools/portfolio_asset_pipeline.py package \
  --config tools/portfolio_asset_pipeline_configs/waterside-s4-proof-package.json \
  --repo . \
  --output-dir <new-empty-package-dir>
```

The package command:

- copies only explicitly declared files
- preserves repository-relative paths
- writes `deployment-package.json`
- records per-file SHA-256 and bytes

It refuses to clear a non-empty output directory.

It does not open FTP, FTPS, WinSCP or another remote deployment connection.

## Existing tool compatibility

The older focused tools remain available for their specific checkpoints:

- `tools/portfolio_city_world_derivatives.py`
- `tools/build_waterside_s4_single_scene.py`

They now reuse common primitives from `portfolio_asset_pipeline.py` instead of maintaining separate hash/source/save implementations.

This preserves the old commands while preventing the underlying mechanics from drifting apart.

## Tests

Run:

```bash
python tools/test_portfolio_asset_pipeline.py -v
python tools/check_portfolio_city_production_automation_s5.py
```

The unit suite covers:

- image metadata / hashing
- derivative generation
- derivative manifest validation
- deterministic composite
- alpha-derived hotspot
- metadata-bound hotspot validation
- deployment package creation
- refusal to overwrite a non-empty package output

The S5 contract checker additionally fixes:

- the S2 World format/size/quality decision
- canonical Master World SHA-256
- the S4 Waterside placement lock
- Aquarium hotspot derivation
- package scope
- the no-direct-deployment boundary

## What still belongs outside this pipeline

Do not put these responsibilities into the asset pipeline:

- artwork approval
- image generation
- browser interaction QA
- visual review
- production credentials
- FTP/FTPS publication
- production cutover decisions

The pipeline prepares and proves assets.

A human-reviewed publication step decides whether they go live.
