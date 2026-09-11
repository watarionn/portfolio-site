# Stage 9 — SHISHA 店舗検索 audit

## Baseline

- Public source: `services/shisha/public/`.
- Production route: `/SHISHA/`.
- Baseline main: `aed2ed462c0b36dbf8d57470bcc010ea979302ed`.
- `config/deployment-map.json` maps `services/shisha/public` to production `SHISHA`.
- Production `/SHISHA/` was fetched before editing and matches the reviewed public `index.php` presentation.
- Production `api/facets.php` and `api/shops.php` both returned HTTP 200 during the audit.
- The current production dataset reported 1,635 shops through `api/shops.php?limit=1&offset=0` at audit time.

## Existing product behavior

The current viewer already provides a substantial search surface:

- prefecture and municipality filtering
- railway line and station filtering
- free-text shop/address search
- current-location radius search
- date/time or current-open filtering
- name, distance, opening-hours, and update-date sorting
- card/list view switching
- official, hours-source, and map links
- pagination through incremental loading

The browser client uses the existing public SHISHA API and preserves server-side configuration and mutable shop/runtime data outside public Git source.

## Problems found

- The page opens directly on a dense search form, so a portfolio visitor has little context for what was designed or why the project is interesting.
- The distinction between search functionality, data maintenance, and hours verification is only implicit in the controls.
- The important reliability rule that unknown opening hours are excluded from date/time-open filtering is present only as small helper text.
- The public-viewer / private-runtime boundary is architecturally important but invisible to a portfolio reader.
- Visual hierarchy is functional but utilitarian; there is no project-level introduction, capability summary, or workflow framing before the live interface.

## Stage 9 direction

Reframe the public page as **SHISHA STORE FINDER / Search & Data Maintenance** while keeping the real search interface intact.

1. Add a compact project introduction before the search controls explaining the search problem and the data-maintenance angle.
2. Summarize the four main capabilities: area/station search, location search, opening-hours filtering, and verified-source maintenance.
3. Explain the search flow before the live interface so a portfolio visitor can understand the work without operating every control.
4. Make the hours-verification rule more visible without claiming unverified stores are closed.
5. Keep all existing JS-facing IDs, API routes, query semantics, and result rendering behavior unchanged unless a separate interaction defect is demonstrated.
6. Preserve the server-only configuration, bootstrap data, runtime state, and operator tooling boundaries.

## Locked-source boundary

SHISHA is currently protected by the Stage 6 exact-source lock in `tools/validate_public_repo.py`:

- exact file count: 9
- exact tree SHA: `2b4f36d8c4aeee08c384517e05dda952e3b7724f`
- exact blob SHA checks for all nine public files

The Stage 9 presentation revision has now been re-reviewed rather than bypassing validation. The approved public slice remains nine files, with tree SHA `62add059e6cb627259760668c9cf18831afc9543`. Only `index.php` and `assets/app.css` changed; their approved blob SHAs are `a2a59dabde4ca9ae39d0e14a421b3b955f57f303` and `6b10095a157c302059c22244a1c22f2ab87091b2`. The validator and publication policy are updated to those identities.

The nine-file allowlist itself should remain closed. No new private/runtime files should be added to the public slice.

## Public/private boundary to preserve

The following remain outside public Git source:

- `services/shisha/operator/**`
- `services/shisha/bootstrap-data/**`
- `services/shisha/public/var/**`
- real `services/shisha/public/config.php`
- credentials
- mutable runtime state
- operator-only install/update material

Production deployment remains non-destructive so server-resident SHISHA configuration and runtime data can survive public-viewer updates.

## Validation completed

The Stage 9 branch was validated locally on the authorized device without invoking metered GitHub Actions.

- `python tools/validate_public_repo.py`: passed with 219 tracked files.
- `python tools/build_deployment.py`: passed with 19 mapped entries, 200 files, and 2 retired remote paths.
- PHP syntax: all six PHP files in `services/shisha/public` passed `php -l` using PHP 8.4.25.
- JavaScript syntax: `node --check services/shisha/public/assets/app.js` passed.
- Required SHISHA DOM IDs: 20 checked, with no duplicates and no missing IDs.
- Public SHISHA source remains exactly nine reviewed files.
- `config.php`, runtime, bootstrap-data, operator, and credential material remain outside the public repository.
- `assets/app.js` remains byte-identical to the Stage 6 reviewed client, so the existing API/query semantics are unchanged.
- Browser QA used the exact Stage 9 page locally with API requests proxied to the live production SHISHA endpoints:
  - 390 px viewport: `innerWidth=390`, `scrollWidth=390`, no horizontal overflow, capability cards collapse to one column, 1,635 results reported, 60 initial cards rendered, and list/card view switching worked.
  - 1440 px viewport: `innerWidth=1440`, `scrollWidth=1440`, no horizontal overflow, capability cards render in four columns, 1,635 results reported, 60 initial cards rendered, and list/card view switching worked.
- Production `/SHISHA/`, `api/facets.php`, and `api/shops.php` were checked before editing; no production deployment has been performed by this PR.

No production deployment is part of this audit/implementation phase.