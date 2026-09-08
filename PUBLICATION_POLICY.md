# Publication policy

This repository is a clean public portfolio export from the private production source repository.

## Stage 6 scope

Stage 6 retains the reviewed Stage 1 portfolio shell, profile, static tools, and static works, the Stage 2 browser-only YOREI client under `apps/yorei/public/**`, the Stage 3 AQUARIUM source slice under `apps/aquarium/public/**`, the Stage 4 HOLOCA source slice under `services/holoca/public/**`, and the Stage 5 HoloScope public application shell under `services/holoscope/public/**`. Stage 6 adds only the separately hardened and re-audited SHISHA viewer source under `services/shisha/public/**`.

The HoloScope addition is locked as an exact 86-file Git tree with tree SHA `ba9a9051a28382917e87dda6c309c902bd11ea4d`, sourced from the private Stage 5 allowlist revision `e856e990ea31140cb46df225b7ac01e7a469a7c3` and source-lock merge `3cc31a7292456a953d94673fcb6d60d75d9f9e8e`. The public repository validator requires that exact subtree and rejects any additional file under `services/holoscope/` outside `services/holoscope/public/**`.

HoloScope is published here as shell/source display only. Its private release overlay, legacy material, tests, root-level runtime tree, production `public_html` tree, local admin configuration, mutable operations state, release activation state, credentials, and deployment material are intentionally excluded. In particular, `services/holoscope/release/**`, `services/holoscope/legacy/**`, `services/holoscope/tests/**`, root `holoscope/**`, `public_html/holoscope/**`, and `admin.local.php` must not be added to this repository. Publication of the shell does not activate or deploy a HoloScope release.

SHISHA is published here as viewer-source display only. The exact approved subtree is the nine-file Git tree `2b4f36d8c4aeee08c384517e05dda952e3b7724f`, locked from private allowlist merge revision `2640a7a292aaf0eb8396ae4b2312624ed9cb9d7e` and private source-lock merge `2ad649697dd44e8f46092df83e62c530671ca741`. The public validator requires this exact tree and exact Git blob identities.

The SHISHA public viewer intentionally omits private bootstrap shop data and mutable runtime state, so this repository is not expected to provide a populated or production-equivalent standalone SHISHA runtime. `services/shisha/operator/**`, `services/shisha/bootstrap-data/**`, `services/shisha/public/var/**`, real `services/shisha/public/config.php`, production `public_html/SHISHA/**`, operator credentials, and SHISHA deploy/install/update workflows must remain private. Publication of the viewer source does not deploy or cut over production SHISHA.

YOREI's public client uses browser-side Supabase configuration by design. Database schema and policies, service-role credentials, production deployment configuration, operator workflows, mutable runtime state, private notes, and private Git history remain outside this repository. The production authorization boundary remains the live Supabase Row Level Security configuration reviewed separately before the Stage 2 import.

AQUARIUM is published here as source display only. Its PHP source intentionally preserves a dependency on the private server-side `config.php`, but that configuration file, database credentials, database contents, server configuration, runtime state, and operational material are not included in this repository. This public repository is not expected to provide a working AQUARIUM runtime by itself.

HOLOCA is published as an exact five-file reviewed public source slice:

- `services/holoca/public/card_search_api.php`
- `services/holoca/public/holoca.css`
- `services/holoca/public/holoca.html`
- `services/holoca/public/holoca.js`
- `services/holoca/public/index.html`

The HOLOCA browser UI is public source, but the search API depends on protected private server configuration at `../config.php`. That configuration, database credentials, database contents, server/runtime state, and private deployment material are intentionally absent here. Without the protected configuration, the reviewed API fails closed with a generic service-unavailable JSON response rather than exposing runtime details.

The reviewed HOLOCA source also keeps runtime/database exception details in server-side logging and binds database-backed search-result actions through in-memory numeric indexes and DOM event listeners instead of embedding card JSON in executable inline event handlers. Maintenance/operator endpoints such as `ability_repair.php` and `scraper_runner.php` are not part of the public slice and must not be added to this repository.

Publication of HOLOCA source does not repair or deploy the currently separate production HOLOCA runtime. Production restoration remains a private deployment/server task and requires its own authorization.

Characters are intentionally excluded from this public portfolio export. SECRET remains deferred until it receives a separate public-export review.

The Stage 2 YOREI slice was imported from the reviewed private source revision `5b2ac7e4e5b9f60b6d8e91d3ec6e43552cad9342` without carrying private repository history.

The Stage 3 AQUARIUM slice was imported from the locked private source revision `04ffbde969f4586b537b0f40bb86f10c96d5db74` without carrying private repository history.

The Stage 4 HOLOCA slice was imported from the locked private source revision `fffe94e9604286fd317e75b6ae6f466bfd05fffa` without carrying private repository history.

The Stage 5 HoloScope shell is clean-imported from the locked private source tree described above without carrying private repository history or release/runtime material.

The Stage 6 SHISHA viewer is clean-imported from the exact locked nine-file private source tree described above without carrying private repository history, bootstrap data, operator source, runtime state, credentials, production files, or maintenance workflows.

## License

No open-source license is granted by this repository at this time. Unless a file explicitly states otherwise, copyright and other rights remain reserved by the repository owner. Publication on GitHub permits viewing and forking only to the extent provided by GitHub's Terms of Service; it does not grant a general license to copy, modify, redistribute, or reuse the contents.

## Production boundary

This public repository is not the production authority. Production deployment, server credentials, protected runtime configuration, mutable state, database schema/policy administration, release activation, and maintenance/operator workflows remain private and must not be added here.
