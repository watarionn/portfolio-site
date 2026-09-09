# Stage 8 root metadata audit

This audit follows the public-repository production cutover and the root 404 migration.

## Reviewed root assets

| Legacy production asset | Decision | Public source / behavior |
| --- | --- | --- |
| `googlea778a59c57bff7a2.html` | MOVE | `site/public/root-verification/googlea778a59c57bff7a2.html`, emitted at the production root |
| `robots.txt` | GENERATE | generated from `config/seo.json` |
| `sitemap.xml` | GENERATE | generated from the explicit reviewed route list in `config/seo.json` |
| `404.html`, `404.css`, `404.js` | MOVED | already owned by this repository |
| `htaccess` (legacy no-dot file) | REVIEW / legacy | not adopted as public source; the generated artifact uses `.htaccess` instead |
| `default_page.png` | REVIEW / legacy | not adopted into the public source tree |
| `yodogawa_employment_support_reference_sites.html` | REVIEW | unrelated reference material; not adopted into the portfolio source tree |

No REVIEW item is deleted from production by this audit. Remote-only deletion remains opt-in through an explicitly reviewed `retiredRemotePaths` change.

## Sitemap migration

The legacy sitemap still listed the retired `/CHARACTER/character-index.html` route. The generated sitemap deliberately removes that retired route and preserves the previously indexed portfolio routes without expanding SEO scope in this migration step.

`tools/build_deployment.py` rejects:

- duplicate sitemap routes
- unsafe or non-site routes
- routes beneath an explicitly retired production path
- sitemap routes that do not resolve to a file in the generated deployment artifact

This makes retirement and sitemap state fail together during CI instead of drifting independently.

## Root 404 hosting requirement

The root 404 assets are deployed correctly, but the hosting platform requires its server-panel `Error Page Settings` feature to be enabled for HTTP 404 before the custom body is used for missing static URLs. The production smoke test intentionally remains strict and requires both HTTP 404 and the `頁不在` marker.

The root `.htaccess` remains non-secret operational configuration, but it is not treated as a substitute for the hosting-provider error-page switch.
