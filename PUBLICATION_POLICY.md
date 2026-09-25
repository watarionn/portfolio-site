# Publication and production policy

This repository is the canonical source of truth for production website code and assets that are safe to publish.

The private repository is no longer the canonical source for ordinary public website code. It is reserved for material that should not be publicly visible, such as credentials, protected content, server-only configuration, mutable runtime state, private operational tooling, and other non-public source or data.

## Stage 8 production-authority model

Publishable source is maintained here in a clean developer-facing layout. `config/deployment-map.json` maps that layout to the existing production URL layout, and `tools/build_deployment.py` creates the generated `build/public_html` artifact used by the production workflow.

A merge to `main` affecting deployable paths is intended to run validation and then deploy the generated artifact over certificate-verified FTPS. Deployment is deliberately non-destructive for ordinary remote-only files. Known server-only configuration names are excluded defensively, and no general remote-delete mirror mode is enabled.

The sole current deletion exception is an explicitly reviewed retirement list in `config/deployment-map.json`. Paths listed in `retiredRemotePaths` are intentionally removed from production after the public artifact is uploaded. This mechanism exists for deliberate surface retirement, not general synchronization.

The deployment workflow requires repository Actions secrets for FTPS and the production site URL. Secret values must never be committed to this repository.

## Current reviewed public scope

The current public repository contains:

- the portfolio shell and profile
- the reviewed root 404 page assets: `404.html`, `404.css`, and `404.js`
- generated root `robots.txt` and `sitemap.xml` metadata sourced from `config/seo.json`
- the reviewed Google site-verification root file under `site/public/root-verification/**`
- non-secret root web-server configuration under `ops/webserver/**`
- reviewed static tools and static works
- the YOREI browser client under `apps/yorei/public/**`
- the AQUARIUM public source under `apps/aquarium/public/**`
- the HOLOCA public source under `services/holoca/public/**`
- the HoloScope public application shell under `services/holoscope/public/**`
- reviewed HoloScope immutable release data under `services/holoscope/release/**`
- the SHISHA public viewer under `services/shisha/public/**`
- the SECRET entrance source under `apps/secret-room/public/**`

Legacy root metadata ownership is recorded in `docs/stage8-root-metadata-audit.md`. Remote-only legacy or unrelated root files are not automatically adopted or deleted merely because reviewed SEO and verification assets move into this repository.

## Root metadata and SEO

`config/seo.json` is the reviewed source for the production origin and sitemap route list. `tools/build_deployment.py` generates `robots.txt` and `sitemap.xml` into the deployment artifact and rejects duplicate, unsafe, retired, or non-resolving sitemap routes.

The Google ownership-verification file is public by design and is preserved byte-for-byte as a root deployment asset. SEO migration must not silently widen the sitemap to unrelated or private surfaces. Changes to the route list are reviewed source changes.

## Root 404 boundary

The root portfolio 404 presentation is public source and is deployed from this repository as `404.html`, `404.css`, and `404.js`.

The root `.htaccess` is non-secret operational configuration and may be generated or deployed from public source. On the current hosting platform, however, deploying `ErrorDocument 404 /404.html` is not sufficient by itself for missing static URLs. The hosting provider's server-panel `Error Page Settings` for HTTP 404 must also be enabled and pointed at the installed custom error page.

The server-panel account state itself is host-resident operational state and is not represented by a committed credential or secret. Production deployment therefore verifies the effective behavior: an intentionally missing URL must return HTTP 404 and its response body must contain the reviewed portfolio 404 marker `頁不在`.

## CHARACTER retirement

The CHARACTER surface is intentionally excluded from the public repository and retired from the public website.

The portfolio shell must not link to `/CHARACTER/` or expose the former character index as a public work. The private repository remains the preservation and development location for the non-public character material.

`CHARACTER` is listed in `retiredRemotePaths`. On production deployment, the deployment workflow removes that remote directory explicitly and then verifies that `/CHARACTER/character-index.html` no longer returns a public success response. Future deployments continue to enforce the retirement while leaving unrelated remote-only files untouched.

## HoloScope reviewed public shell and release data

HoloScope retains an exact 86-file reviewed application shell under `services/holoscope/public/**`. Stage 9 re-reviewed the home presentation and route precedence while preserving that shell boundary; the approved public tree remains `91ad6e1661ecc4136dcc1a682c337b83e543b3f5`.

Reviewed immutable release data is versioned separately under `services/holoscope/release/**`. It may contain only the active pointer and an explicitly reviewed release package produced by the private Phase 7 publication pipeline. `config/holoscope-release.json` declares the active release, verified private-source commit, fallback allowlist, and public sidecars. `tools/validate_holoscope_release.py` verifies the pointer, release manifest, exact file inventory, byte sizes, and SHA-256 hashes before deployment.

`tools/build_deployment.py` keeps source ownership separate: the 86-file shell is copied normally, then the reviewed release is overlaid into `/holoscope/data`, `/holoscope/releases`, feeds, and sitemap paths. The deployment artifact must not contain `/holoscope/data/operations/**`. Formal source, transcripts, evidence ledgers, review metadata, operator tooling, mutable runtime state, local admin configuration, credentials, and private deployment material remain outside the public repository.

## SHISHA reviewed public viewer

The SHISHA public surface is an exact fourteen-file reviewed slice. The original nine-file Stage 9 store-finder boundary remains intact, with the reviewed postal-location map plus four static Shisha Advisor public-auth/verification files intentionally included under `services/shisha/public/**`. The approved public tree is `82818315f5ab62572cf88c5cbad4b762ebdbcdee`. The September 25, 2026 review adds canonical chain/branch display names and deduplicates municipality-facing transit selectors without adding private bootstrap data or mutable runtime state.

The store finder keeps its existing API routes, server-only configuration dependency, and runtime/data separation. Its `index.php` adds only a navigation link to `/SHISHA/advisor/`. The Advisor addition consists of `advisor/index.html`, `advisor/advisor.css`, `advisor/privacy.html`, and `advisor/terms.html`; these pages contain no credentials or mutable runtime data and are intended to provide a public Shisha Advisor homepage and policy pages on the existing site. `tools/validate_public_repo.py` locks the reviewed fourteen-file tree and every approved SHISHA blob identity.

The viewer source intentionally omits private bootstrap shop data and mutable runtime state. The following material must not be committed here:

- `services/shisha/operator/**`
- `services/shisha/bootstrap-data/**`
- `services/shisha/public/var/**`
- real `services/shisha/public/config.php`
- credentials
- runtime state
- operator-only install/update material

The server-resident SHISHA configuration and runtime data may remain in production while the public viewer source is deployed non-destructively.

## SECRET locked entrance

The SECRET entrance remains the exact seven-file Git tree `c778ee30cac4737b1a4dcf0aec65241ece41ea20`, sourced from private allowlist merge revision `70e82cdb34b8435c3841fc233c676aca61c70bb7` and private source-lock merge `709fa957261cfdeba0f1e3b860549dd537011d32`.

The protected room, private gate implementation, real answer configuration, credentials, runtime/server state, and other non-public material remain outside this repository. The public `check.php` is intentionally a thin front controller and fails closed when the private gate is absent.

## HOLOCA reviewed public slice

HOLOCA remains a reviewed five-file public slice:

- `services/holoca/public/card_search_api.php`
- `services/holoca/public/holoca.css`
- `services/holoca/public/holoca.html`
- `services/holoca/public/holoca.js`
- `services/holoca/public/index.html`

The browser UI is public source, while the search API depends on protected server configuration at `../../config.php` outside the deployed HOLOCA directory. Database credentials, database contents, runtime state, operator endpoints, and maintenance tooling remain private/server-only.

The reviewed API must fail closed with a generic service-unavailable response when protected configuration is absent. Runtime/database exception details remain server-side, and search-result actions are bound without embedding serialized card JSON in executable inline handlers.

## AQUARIUM boundary

AQUARIUM public source intentionally preserves its dependency on private server-side `config.php`. That configuration, database credentials, database contents, server configuration, and mutable runtime state must not be committed here.

The generated production artifact may update the reviewed public AQUARIUM files while the server-only configuration remains remote-only.

## YOREI boundary

YOREI's public client uses browser-side Supabase configuration by design. Database schema and policies, service-role credentials, operator workflows, private notes, and mutable runtime state remain outside this repository.

The production authorization boundary remains the live Supabase Row Level Security and function policy configuration rather than secrecy of the browser anon configuration.

## Public repository validation

`tools/validate_public_repo.py` is the public/private boundary gate. It rejects known private filenames and path classes, high-confidence secret-like content, symlinks, unreviewed files inside locked application slices, and tree/blob drift where exact source identity is required.

`tools/write_public_inventory.py` generates a deterministic tracked-file SHA-256 inventory for review. `tools/build_deployment.py` separately generates the production artifact and deployment manifest, including reviewed generated root metadata.

Generated build artifacts are not tracked in Git.

## Private and server-only material

The following categories never become public merely because this repository is the production authority for public code:

- passwords, tokens, private keys, FTPS credentials, and other secrets
- `config.php`, `user.ini`, `admin.local.php`, and equivalent local configuration
- hosting control-panel account state and secret or host-specific configuration
- protected/private content
- private database data or privileged database administration material
- mutable runtime state
- operator-only workflows and tools
- private Git history or notes that are not intended for publication

These belong in GitHub Actions Secrets, the production server, the hosting control panel, or a private repository/storage location according to their role.

## License

No open-source license is granted by this repository at this time. Unless a file explicitly states otherwise, copyright and other rights remain reserved by the repository owner. Publication on GitHub permits viewing and forking only to the extent provided by GitHub's Terms of Service; it does not grant a general license to copy, modify, redistribute, or reuse the contents.
