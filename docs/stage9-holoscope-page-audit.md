# Stage 9 — HoloScope page audit

## Baseline

- Public source: `services/holoscope/public/`.
- Production route: `/holoscope/`.
- Baseline main: `86cd4a78477fea2b5eab7a763c2b2ea89dac9659`.
- `config/deployment-map.json` maps `services/holoscope/public` to production `holoscope`.
- The reviewed public shell remains exactly 86 Git-tracked files.
- Current reviewed tree SHA: `ba9a9051a28382917e87dda6c309c902bd11ea4d`.
- Production `release-status.php` returned HTTP 200 with release ID `20260828-initial-14` during the audit.

## Existing product behavior

The current HoloScope application already provides a substantial editorial/discovery surface:

- latest stream articles and compact public-data counts on the home page
- member, generation, game, event, and series discovery
- stream search and per-member stream views
- English-learning hub, stream search, guides, phrase dictionary, and slang dictionary
- feature articles and article detail routes
- aggregate statistics for members, games, learning, and published data
- canonical URLs, structured data, RSS links, security headers, and error handling

The public application shell reads mutable release data through `ReleaseLocator`; server-resident `data/` and `releases/` remain outside the reviewed Git shell.
## Production issue found

Production still contains legacy HoloScope directories and files because ordinary deployment is intentionally non-destructive. In particular, an old remote `articles/` directory is still present.

The current `.htaccess` stops rewriting when the requested path already exists as a file or directory. As a result:

- `/holoscope/` → HTTP 200
- `/holoscope/streams/` → HTTP 200
- `/holoscope/members/` → HTTP 200
- `/holoscope/learning/` → HTTP 200
- `/holoscope/articles/` → HTTP 403

The 403 is not the current PHP router rejecting the route. The legacy physical `articles/` directory wins before the front controller can handle `/articles/`.

Stage 9 should fix route precedence for current application route roots before the generic existing-file/directory bypass, while continuing to leave unrelated remote-only legacy material untouched.

## Presentation problems found

- The home page already looks like a content site, but a portfolio visitor still has to infer what was engineered behind it.
- The relationship between stream observation, entity discovery, English learning, feature writing, and statistics is spread across navigation and lower-page sections rather than summarized as one system.
- The hero explains the subject but not the product model: observe a stream, structure its context, connect related entities, then reuse that structured record for discovery and learning.
- Dynamic sections disappear when a release has no eligible content, which makes the page hierarchy less self-explanatory for a first-time visitor.
## Stage 9 direction

1. Preserve the 86-file HoloScope public boundary and server-resident release/data model.
2. Add compact portfolio framing to the home page without turning it into a separate marketing page.
3. Summarize four system axes near the top: stream records, relationship discovery, English learning, and editorial/statistical views.
4. Add a short observation workflow so the information architecture is understandable before visitors browse every section.
5. Fix `.htaccess` precedence so current application route roots reach `index.php` even when stale production directories with the same names still exist.
6. Keep protected application internals (`app`, `data`, `templates`, `tests`, `releases`) denied from direct requests.
7. Re-review the modified 86-file tree and update the exact tree identity in `tools/validate_public_repo.py` and `PUBLICATION_POLICY.md`; do not bypass the lock.

## Stage 9 implementation checkpoint

The Stage 9 implementation changes only three files inside the existing 86-file public shell:

- `.htaccess`: current application route roots now reach `index.php` before stale same-name production directories can win.
- `templates/pages/home.php`: adds a compact explanation of the four HoloScope system axes and the observe → structure → discover workflow.
- `assets/css/editorial.css`: styles the new portfolio framing and its responsive 4 → 2 → 1 column behavior.

The re-reviewed HoloScope public tree is `91ad6e1661ecc4136dcc1a682c337b83e543b3f5`. Changed blob identities are:

- `.htaccess`: `22fce57838f705b9db1a01218ea13e838043c544`
- `assets/css/editorial.css`: `055803476f282f69c170a2b55cec06555f10fcd5`
- `templates/pages/home.php`: `f4076efa12f222d20d79643352a7f0b47b408ace`

PHP 8.4.25 syntax checking passed for all PHP files in the public HoloScope shell. Route-pattern checks confirm that current application paths such as `articles/`, `members/...`, and `learning/...` are routed to the front controller, while `assets/...`, internal `app/...`, and `release-status.php` are not captured by that precedence rule. The internal-resource deny remains before the application-route rule.

## Public/private boundary to preserve

- server-resident `data/**` and `releases/**`
- `admin.local.php` and equivalent local configuration
- credentials and mutable operations state
- private release overlays and deployment tooling
- legacy/private material outside the reviewed 86-file public shell

## Validation completed

The Stage 9 implementation was validated locally without invoking metered GitHub Actions:

- `python tools/validate_public_repo.py`: passed.
- `python tools/build_deployment.py`: passed.
- PHP 8.4.25 syntax checking: all HoloScope PHP files passed.
- Public HoloScope source remains exactly 86 files with reviewed tree `91ad6e1661ecc4136dcc1a682c337b83e543b3f5`.
- Route precedence checks confirm current application roots are handled before stale same-name directories, while internal-resource deny rules remain earlier.
- Local application QA used the current production release data only in a temporary non-Git directory: `/holoscope/` returned HTTP 200 with the Stage 9 observatory framing, `/holoscope/articles/` returned HTTP 200 through the current application route, and `/holoscope/app/Application.php` remained HTTP 403.
- Browser QA at 390 px: no horizontal overflow; four observatory axes collapse to one column and the three-step workflow collapses to one column.
- Browser QA at 1440 px: no horizontal overflow; four observatory axes render in four columns and the workflow in three columns.
- Production has not been changed by this PR; server-resident release/data and legacy files remain untouched until explicit deployment approval.

No production deployment is part of this implementation phase.
