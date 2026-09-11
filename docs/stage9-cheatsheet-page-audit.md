# Stage 9 — 技術早見表 page audit

## Baseline

- Public source: `tools/cheatsheet/`.
- Production route: `/CHEATSHEET/`.
- Baseline main: `b1bcd4c695df10dbebdf290217270257a8aff8bb`.
- `config/deployment-map.json` maps `tools/cheatsheet` to production `CHEATSHEET`.
- The canonical slice contains exactly 9 Git-tracked files: index, CSS, JS, and six section fragments.
- Current tree SHA: `02bf0631a790212739e7eb2a9b9c591bd2b6b186`.
- The six fragments contain 28 `.sheet` sections and 326 `tbody` rows.
- The index contains 28 matching section links.

## Production parity

All 9 files were downloaded from production over the existing TLS/FTPS session during the audit and compared byte-for-byte with the canonical Git source.

- `/CHEATSHEET/` and all six section fragments return HTTP 200.
- All 9 production files match the current Git files exactly by SHA-256.
- Browser QA loads all 28 sections and 326 rows at both 390 px and 1440 px.
- No horizontal page overflow was observed at either viewport.
- The search field becomes enabled after all six fragments load.

## Existing behavior

The current tool already has a strong reference-book identity and a useful client-side architecture:

- dictionary-style editorial presentation with sticky utility/search bar
- desktop sticky index and mobile horizontal index
- six HTML fragments loaded in parallel by `fetch()`
- client-side full-text filtering over section titles and table rows
- live result count and empty state
- `IntersectionObserver` synchronization between visible sections and index links
- responsive tables and print-specific presentation

The core corpus is already useful; Stage 9 should improve orientation and retrieval rather than replace the visual language or restructure all 326 entries.

## Presentation and interaction gaps

- A portfolio visitor can see that it is a reference book, but the page does not explain how the 28-section corpus and six-fragment client-side search were engineered.
- Search state is ephemeral: it is not reflected in the URL, so a filtered view cannot be bookmarked or shared.
- There is no keyboard shortcut for focusing search and no one-action clear control.
- The index is section-by-section only; there is no compact scope layer for broad groups such as Python core, automation/browser, image/vision, and regex/tooling.
- The result count reports matching rows, but the page does not summarize how many sections remain visible.
- The fixed headline statistics are correct today, but the runtime already computes the actual row count; presentation should avoid unnecessary duplicated truth where practical.

## Verified freshness issues

The audit found a small number of concrete content issues that can be corrected from authoritative sources without turning Stage 9 into a wholesale technical rewrite.

1. Python dictionary `popitem()` is described as removing a random item. Current Python documentation specifies LIFO order, guaranteed since Python 3.7.
2. The PyScript section still shows the historical `/alpha/pyscript.css` and `/alpha/pyscript.js` URLs. Both URLs returned HTTP 404 during this audit. Current PyScript documentation uses versioned `core.css` and module `core.js`, with Python started via `script type="py"`.
3. The index label for the PyScript section contains the typo `ブラウゞ上`; the loaded section itself correctly says `ブラウザ上`.

Stage 9 should correct only clearly verified stale/error cases discovered during the pass. Other source-derived technical statements should remain unchanged unless independently verified.

## Stage 9 direction

1. Preserve the existing 9-file static slice, 28 sections, and 326-entry corpus unless a verified correction changes wording only.
2. Keep the reference-book visual identity; add compact portfolio framing rather than replacing the design.
3. Explain the architecture near the top: six fragments → 28 sections → 326 searchable rows → client-side filtering.
4. Add broad scope controls so users can narrow the corpus before or alongside text search.
5. Improve search ergonomics with `/` focus, Escape/clear behavior, section-aware result feedback, and URL query-state restoration where practical.
6. Correct the verified Python `popitem()`, PyScript, and index typo issues.
7. Add Stage 9 validation markers so future edits cannot silently remove the new search/framing contract.

## Planned validation

Before Ready for review, validate the exact latest branch head locally without metered GitHub Actions:

- `python tools/validate_public_repo.py`
- `python tools/build_deployment.py`
- `node --check tools/cheatsheet/cheatsheet.js`
- exact 9-file slice and expected section/row counts
- six fragment requests succeed and search initializes
- broad scopes combine correctly with text search
- URL search state restores without breaking fragment anchors
- keyboard focus/clear behavior works without stealing normal typing
- verified technical corrections match current official documentation
- browser QA at 390 px and 1440 px with no horizontal page overflow
- production remains untouched until explicit deployment approval

## Cost safety

All Stage 9 commits should use `[skip ci]`. Hosted GitHub Actions must not be invoked; local validation on the authorized workstation is the validation authority for this pass.

## Stage 9 implementation checkpoint

Implementation commit: `f330e786dde9cca21793d8a571b8c360cd9d30ff`.

The CHEATSHEET public slice remains exactly 9 files. Its re-reviewed tree is `9af9ecef421fcbf7329a9a9c1e23d8a1bae30d9a`.

Changed public files:

- `index.html`: adds the six-fragment reference model, five broad scope controls, search shortcut hint, and clear control.
- `cheatsheet.css`: integrates the Stage 9 framing, scope controls, search status, responsive scope scrolling, and filtered-index state into the existing reference-book design.
- `cheatsheet.js`: combines scope + text filtering, keeps index links synchronized, restores `q` / `scope` URL state, and adds `/` focus plus Escape reset.
- `sections/01.html`: corrects `dict.popitem()` to the documented Python 3.7+ LIFO behavior.
- `sections/03.html`: replaces obsolete PyScript alpha URLs and `<py-script>` syntax with the current versioned `core.css` / `core.js` and `type="py"` form.

The corpus remains exactly 28 sections and 326 table entries. The index typo `ブラウゞ上` is corrected to `ブラウザ上`.

Local browser QA passed at 390 px and 1440 px with no page-level horizontal overflow. The Python scope shows 12 sections / 127 entries; searching `append` narrows it to one entry, writes `?scope=python&q=append`, survives reload, resets with Escape, and `/` focuses the search field.

The current PyScript `core.js` and `core.css` URLs returned HTTP 200 during validation. Hosted GitHub Actions were not used.
