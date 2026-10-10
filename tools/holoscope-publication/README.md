# HoloScope closed-article production automation

Source snapshots of the Windows-side HoloScope article publication controller.
Active runtime: `C:\Work\Projects\OllamaPersonaRuntime\holoscope_collab`.
Task Scheduler: `HoloScopeArticleAutoPublish` (hourly).

## Gates
- Require CLOSED editorial marker, closure runner rc=0, approval SHA matches and zero fatal/manual-review findings.
- Source attribution, evidence, member identity and public checks must pass.
- Unknown member identities remain HOLD, never guessed.
- Release manifests are checksummed; site build and HTTP article checks must pass.
- Retries on subsequent task runs and exclusive lock avoid duplicate concurrent runs.

## 2026-10-10 initial production proof
- Previous stream count: 334.
- New verified articles: `2MCHelDzquQ`, `2NYJ1BMYD3Q`, `2QPj2hPm8vM`.
- New release: `20261010-closed-337`; 337 streams.
- Public build: PASS, fatal=0, error=0.
- FTP deployment: 898 files, successful.
- Live HTTP article checks: all three PASS.
- Portfolio GitHub main: `1732103`.
- Deferred: `2Qoc1B-Sqog` because member identity is unresolved.
- Hourly scheduled task manually exercised twice; exit code 0.

## Deployment boundaries
The code in this folder is a source snapshot. Execute from the active collab runtime,
not from this folder without adjusting paths. Credentials are read from Windows
Credential Manager and are not committed. Google Drive preservation is under
`chatGPT及びCodex用/HoloScope/ProductionAutoPublish_20261010`.
