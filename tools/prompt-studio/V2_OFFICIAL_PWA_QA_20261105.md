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
