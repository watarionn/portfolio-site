# Prompt Studio 2.0 Japanese UI / English output QA (2026-11-05)

## Implementation and compatibility
- Japanese dictionary labels and Japanese template names/previews remain visible.
- Selection inserts explicit English into the prompt entry field for both prose and SD1.5-style tag modes.
- Default English dictionary includes individual value/option translations and tag aliases. User-defined entries require manually supplied English text, never generated from untrusted guesses.
- Templates selected by a Japanese title insert English prose with English variables such as \`{character}\`.
- Separate English record content and Japanese preview fields in the template dictionary.
- Older independent 2.0 localStorage and backup JSON remain readable and are normalized only for unchanged built-in terms/templates. User-created Japanese content is preserved unmodified and flagged for explicit edit on load/reflection/copy.
- Existing official \`/prompt-studio/\`, v1.2 localStorage, PromptDB and service worker untouched.

## Owner Windows PC QA
- Machine YWSHTMR, native Node v26.3.0.
- Tested application source SHA \`d2640a13e867a0566b45cb151df1c99b9bc5d405\`; subsequent change: documentation only.
- \`node --check\` on core and frontend: PASS.
- \`node tools/prompt-studio/v2-next-core.test.cjs\`: PASS. Covers Japanese dictionary/English values, repeated English variables, tracked templates, tags/prose, existing v2 JSON backup roundtrip, exact built-in migration, custom translation absence fail-closed, malformed data.
- \`python -m pytest -q tools/prompt-studio/v2_next_browser_test.py\` in Microsoft Edge/Playwright: **9 passed in 23.15s**, exit 0. Covers existing screen A/B CRUD, distinct format output, English reflection, copying, saved templates and prompts, Japanese picker preview, custom bilingual dictionary input validation, 390px viewport, corrupt state and import.
- First run identified a duplicate Japanese template preview/title in picker. Fixed by omitting a preview if it equals the title, then reran all 9 E2E successfully.

## Publication boundary
- \`v2-next\` only: HTML, core JS, frontend JS, CSS; HTML now refers to versioned \`?v=2.0.2\` static assets for cache freshness.
- Commit to GitHub main and separately scoped production FTPS/HTTPS SHA readback are required before claiming public update.
- iPhone Safari acceptance remains post-deployment; official PWA switchover and old v1.2 retirement remain pending.
