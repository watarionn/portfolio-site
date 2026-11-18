# HoloScope full-snapshot semantic duplicate audit | 2026-11-19

## Purpose

The CloudFree server previously reached **9.999 GB / 10 GB** and approximately **419,787 files** according to the owner. Real server panel usage and live FTP content have NOT been measured in this session. The owner approved a one-release bounded FTPS deletion, but the owner-local signed delete action has NOT been enrolled; live deletion remains HOLD, and creating a source-only audit is not permission to delete, skip publications, prune Git history, change release schedules, or modify publisher tasks.

The private GitHub canonical evidence for the historical source has **474 release folders, 464 auto-release folders** at immutable `watarionn/portfolio-site` commit `0ab8055ad0ac2fbcf728b47ef023360dc4154d83`. Previous [CloudFree historical inventory](https://github.com/watarionn/cf278796-cloudfree-site/pull/367#issuecomment-6982703038) reports 77 source releases Nov 4-9 = 1,172,048,805 bytes and 54,853 files, but explicitly **not actual FTP occupied bytes**. More recently [382 full snapshot source releases Nov 14-18](https://github.com/watarionn/cf278796-cloudfree-site/pull/367#issuecomment-6983117044) were identified. This audit addresses the next preventable cause: regenerating substantially identical full snapshots without valuable content changes.

## Directly checked source duplicates

GitHub's immutable November 14 directory listing contained 111 auto-release names but only **32 distinct stream counts**, with 79 additional repeat-count releases. There were 116 auto releases with only 40 distinct stream counts on November 15, and 59 with 50 on November 16; November 17 and 18 had no repeated per-day count. A repeated count is a **candidate**, not proof of no content changes, so it MUST NEVER be used alone to skip a publication.

In the Nov 14 `auto-766` family, 12 separate source release manifests retained a common `verifiedCommitSha=2f34c884ca64641947fa81be170e58a3617a4fd1`, each had **839 payload entries plus release-manifest**, and each measured **21,403,618 bytes including release-manifest**. Comparing immutable `20261114-025813-auto-766` with `20261114-030138-auto-766` and `20261114-051726-auto-766`: **830/839 payload file paths had identical sizes and SHA-256**, and the nine differing paths were:

- `feeds/all.xml`, `feeds/articles.xml`, `feeds/streams.xml`: only RSS `lastBuildDate` changed
- `stats/index.json`, `stats/games.json`, `stats/learning.json`, `stats/members.json`, `operations/status.json`: only `generatedAt` changed
- `manifest.json`: `generatedAt` changed and the internal file SHA-256 entries for the above eight volatile files changed accordingly; all counts and stable file records are otherwise consistent

Exact real bytes of both representative releases' nine volatile files were fetched from the immutable Git revision, parsed/compared and matched this specific timestamp-only explanation. This verifies a *source-level semantic duplicate for the sampled pair*, not the other 10 auto-766 snapshots, not the full 79 repeat-count releases, and certainly **not FTP production existence, PUBLISHED eligibility or safe deletion**.

## Source-only implementation

`release_semantic_audit.py` contains `compare_release_semantics(release_manifest_a,release_manifest_b,changing_bytes_a,changing_bytes_b)`. It has no CLI, network, file access or mutation. The two `release-manifest.json` raw buffers are strictly parsed with duplicate-key rejection, safe unique relative paths, explicit 40-digit source SHA, 64-digit checks SHA, identical stable entry path/size/SHA, distinct auto-release IDs, and 10–3000 rows. Every one of the **nine** volatile file raw buffers per version must match its parent release-manifest's exact file length and SHA-256. The eight volatile content files must be byte-identical after removing **only** one verified `lastBuildDate` from each RSS, or one strict `generatedAt` top-level JSON member. The ninth `manifest.json` must bind its complete child inventory to its respective release manifest, then compare all ordinary metadata and all stable child hashes after substituting only the eight verified time-dependent child SHA digests. Any other modification returns HOLD.

Even exact source-only semantic equivalence returns `SEMANTICALLY_EQUIVALENT_NO_DELETE_AUTHORITY` with `source_authenticated=false`, `owner_authenticated=false`, `ftps_connected=false`, `live_release_verified=false`, `deletion_authorized=false`, `files_deleted=0`, `mutations=0`. Since input provenance is not authenticated, no consumer can treat this as authority to skip new publication or issue FTP DELE. A genuine future owner-approved content-equivalence gate needs independent *actual* source byte pins, external publisher/source commit checks, preserved rollback and PUBLISHED guarantees, idempotent receipt and correct current/live pointer.

No merge of this helper may change `publication_production_auto.py`, `publish_closed_batches.py`, publisher schedule, Rinka Commander owner policy, release manifests, current pointer, FTPS files, or history. This project is GitHub-first and the user forbids Github Actions, Work, old RDC and GUI approval for owner operation.

## Regression and verification

The source-only Python stdlib tests are in `test_release_semantic_audit.py`. Run `python -B -m unittest discover -s tools/holoscope-publication -p test_release_semantic_audit.py -v`, then `python -m py_compile tools/holoscope-publication/release_semantic_audit.py tools/holoscope-publication/test_release_semantic_audit.py`. Negative tests cover same-count meaningful stream changes, RSS item change, statistics change, changed source/checks SHA, missing/extra raw buffers and child file rows, stale nested manifest, invalid path/time, duplicate JSON, unsigned/Boolean malformed rows and no side effects. Source-only fixture test success must NOT be called owner production acceptance.

Before approval/Ready/merge, independently run those **19 original checked-in test methods on the exact GitHub HEAD/blob bytes** and record output. This Draft is source-only; owner FTPS signed admission remains HOLD.

## The real server cleanup dependency

RLO purpose-only signed claim #3956, one-use nonce #4041, full SHA evidence #4135 and owner read-only discovery #4166 were source merged, but owner Windows [profile #4154](https://github.com/watarionn/rinka-local-operator/issues/4154#issuecomment-6982588243) `holoscope-ftps-retention-batch` is NOT ENROLLED; [maintenance preflight #4152](https://github.com/watarionn/rinka-local-operator/issues/4152#issuecomment-6982577652) is `NOT_ATTESTED, NO_LOCK, maintenance_authorized=false`. [Nao's actual readback #19708550](https://github.com/watarionn/ai-memory-vault/discussions/177#discussioncomment-19708550) found neither the old private FTPS batch driver nor cleanup script in owner C:\Work and performed zero actual FTP reads/deletes. P0H/CMP24 noncooperative writer exclusion, owner purpose-specific Ed25519 signing, immutable fixed action, nonce spend, publisher mutex, live SHA/PUBLISHED/current + latest 4 rollback, per-file absence, public HTTPS and hosting panel measurements remain separate prerequisites.

**Outcome:** this PR diagnoses and safely detects a publication amplification pattern, without claiming immediate disk-space recovery or permission to remove any old server generation.
