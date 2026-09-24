# S3 Upload Audit v1.0.0

Release date: 2026-09-24

## Highlights

- read-only AWS CLI / S3 Browser CLI provider adapters
- credential-bearing config rejection
- target-list deduplication
- YYYYMMDD parsing and latest-file ranking
- Healthy / Stale / Undated / Missing / Empty / Provider error states
- configurable stale threshold and AgeDays
- Dashboard with search and status filters
- Offline Demo
- TSV / JSON export
- local audit history
- previous-run comparison for the same audit source
- New problem / Recovered / Changed / Unchanged classifications
- built-in and custom presets
- config editor that intentionally excludes credential fields
- onboarding, Help, and shortcuts
- local app icon and OGP assets

## Live-S3 limitation

The release was developed and tested on a PC without AWS CLI or S3 Browser CLI installed.

No claim of live S3 integration testing is made. Provider command construction and audit behavior are covered by fixture tests.
