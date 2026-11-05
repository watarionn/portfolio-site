# Prompt Studio 2.0 official PWA QA (2026-11-05)

## Goal
After the user's iPhone Safari acceptance of independent 2.0 preview, promote 2.0 to canonical `/prompt-studio/` while keeping the existing installed-app identity, local user data, and rollback options.

## Source
- Canonical `tools/prompt-studio/index.html` now uses the 2.0 main/dictionary UI, English output, prose/tags selector, Japanese labels, JSON backup and stable localStorage key.
- HTML registers `service-worker.js` only in secure or localhost contexts.
- Manifest retains `id = start_url = scope = /prompt-studio/`.
- New service worker cache `prompt-studio-v2.0.0`: complete-shell install, activation cleanup for old 1.2 caches and offline navigation fallback to new index.
- No deletion of old 1.2 browser keys or old production scripts. Existing 2.0 preview remains available.

## Windows native QA
- Windows owner PC YWSHTMR; Node v26.3.0; local isolated sparse checkout `%TEMP%\prompt-studio-v2-official-20261105`.
- Tested branch commit: `c42ef20d17e0f863e1eb781a47e6db321b628db4`. Changes following this test are documentation only.
- JavaScript syntax checks: core + frontend + service worker **PASS**.
- Node `v2-next-core.test.cjs`: PASS for model, backwards-compatible 2.0 state, English selection/prose/tags/template tracking.
- Microsoft Edge Playwright/Python pytest: `v2_next_browser_test.py` + `v2_pwa_browser_test.py`: **11 passed in 27.38s**, process exit code 0.
- Real local HTTP localhost Service Worker E2E: same PWA scope/manifest identity, old `prompt-studio-v1.2.0` cache retired, `prompt-studio-v2.0.0` installed and controlling page, online canonical root uses 2.0, offline reload works, 2.0 data/draft preserved, legacy storage sentinel untouched, 390px mobile width, no uncaught page errors.

## Production boundary
- Deploy **only** `index.html`, `manifest.webmanifest`, `service-worker.js` to the verified CloudFree scope. Core JS/CSS/icons already published and hashed. Upload order: new manifest, new canonical index, new Service Worker **last**, so its precache cannot capture the 1.2 index.
- Before writing, require hash CAS against the previous verified release and back up all originals. Fail closed on unexpected remote modification; restore changed assets on partial failures.
- Confirm new manifest / index / SW over HTTPS by SHA-256. Run a public online browser/E2E smoke including Service Worker control, offline restart, existing data, and old asset preservation.
- Preserve production receipt on GitHub main with read-after-write.
- Physical iPhone installation of the updated canonical PWA is **post-deployment acceptance**. The user's completed iPhone test of 2.0 preview suffices as pre-cutover UI acceptance.

## Actual production cutover and independent live checks (2026-11-05 UTC 03:19–03:20)
- PR #232 merged and GitHub main readback verified: \`d5e7133bf71313f417341d1b0325910c80b2f9d7\`.
- First read-only FTPS CAS check returned **HOLD** because the three existing production files' SHA-256 did not match the Git historical old source SHA. No write was made at that point.
- A separate read-only FTPS/public HTTPS inspection confirmed the actual remote three-file hashes, 200 responses and matching HTTPS bytes. The deployed manifest still had the original \`/prompt-studio/\` id/start/scope; index was the old app with \`#profileSelect\`; SW cached old 1.2 assets. The production difference from historical Git was verified, never assumed.
- The cutover script was corrected to pin **the verified deployed old SHAs**, not historical Git SHAs, as the compare-and-swap precondition, with the remote originals kept for rollback. A new read-only preflight passed (3/3).
- Scoped FTPS updated exactly 3 files in safe order: **manifest → canonical index → Service Worker last**. FTPS readbacks **3/3 PASS**, public HTTPS SHA-256 **3/3 PASS**, \`OFFICIAL_PWA_SCOPED_DEPLOY_PASS files=3 readback=True\`, exit 0.
- Public Microsoft Edge Playwright (fresh, isolated profile) confirmed \`https://cf278796.cloudfree.jp/prompt-studio/\` HTTP 200 shows v2, old entrypoint controls are absent, manifest id/start_url/scope preserved, new SW controls page, old v1.2 cache removed, new v2.0.0 shell installed, offline reload works, English tags work offline, 2.0 state and legacy localStorage sentinel survive, 390px layout fits, **0 JavaScript errors**. \`PUBLIC_2PWA_EDGE_PASS\`, exit 0.
- Per-file actual old-production, historical Git, and new production SHA-256 fingerprints, plus UTC timestamps, are preserved in [V2_OFFICIAL_PWA_RELEASE_RECEIPT_20261105.json](V2_OFFICIAL_PWA_RELEASE_RECEIPT_20261105.json).
- iPhone physical hardware confirmation before cutover was for the 2.0 preview. Opening/relaunching the newly upgraded installed canonical PWA is a **post-deployment acceptance**, not a pre-deploy blocker. Old 1.2 JS/source assets remain intact for rollback and must not be reported as deleted.

## Post-deployment iPhone acceptance (2026-11-05 JST)

- After the canonical 2.0 PWA was published to https://cf278796.cloudfree.jp/prompt-studio/ and its Service Worker / offline behavior was checked on Windows Edge, **the user confirmed that 2.0 was displayed on their iPhone**.
- This is direct user-reported **physical iPhone display acceptance after production cutover**. It closes the outstanding canonical-PWA display acceptance condition. The report does not independently prove every interaction, network/offline scenario, or cache migration detail on iPhone; those have not been separately asserted.
- Earlier the user had also confirmed the independent 2.0 preview on iPhone prior to the canonical release.
- Result: **Official Prompt Studio 2.0 PWA migration and post-deployment iPhone display acceptance completed**. Do not delete historical 1.2 source, browser storage, or rollback artifacts merely because display acceptance passed; cleanup requires a separate scoped decision.
