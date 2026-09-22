# EXPLORE Forest Illustration Handoff — 2026-09-22

## Current phase

EXPLORE 森イラスト制作は **Phase 2-D 手前** まで進行。

- DATA LAB production API migration: complete
- EXPLORE production data binding: complete
- Forest art direction: adopted
- Area A production brief: complete
- Area A Trial 01: archived
- Area A Trial 02: archived
- Area A Trial 03: **ADOPTED as the Area A background master candidate**
- Production merge/deploy of the art brief: **not done**
- PR #117 remains the active art-phase PR

## Adopted art direction

Target atmosphere:

- Professor Layton-series-like storybook mystery atmosphere
- warm, nostalgic, refined
- gentle mystery, not horror
- hand-drawn contour character
- simplified painterly surfaces
- muted yellow-green / olive / beige / brown palette
- background must support HTML/CSS interaction rather than compete with it

Important rule:

> Design the forest around interaction pockets first. Do not paint a finished forest and then force the UI into it.

Do not copy a specific Layton scene, logo, character, UI, or identifiable composition.

## Area A live interaction positions

These positions are already live and were used to judge Trial 03:

| id | label | x | y |
| --- | --- | ---: | ---: |
| oyumi | 生実町 | 38% | 17% |
| juso | 十三 | 17% | 28% |
| kisaichi | 私市 | 69% | 30% |
| oshor | 忍路 | 82% | 43% |
| zeze | 膳所 | 8% | 54% |
| gumyo | 求名 | 74% | 65% |
| yuriage | 閖上 | 43% | 68% |

Exits:

- left: left-center
- right: right-center
- bottom: bottom-center

Notebook:

- top-right

## Trial history

### Trial 01

Drive file:
- name: `area-a-trial-01.png`
- id: `1crwI4lTLDQAOSimTWlcbAFepFjd5MSX1`

Assessment:
- art direction good
- path readable
- too much decoration around UI pockets
- too many rocks / stump / fence / foliage accents
- A area felt slightly too rich for the entrance area

### Trial 02

Drive file:
- name: `area-a-trial-02.png`
- id: `1ZOgUWrKVtZGnFKVihaqFeGnqvl39q1FX`

Assessment:
- much better UI breathing room
- central and lower layout improved
- remaining issues were left-side trunk pressure, top-right noise, and lower wooden posts
- became a near-master candidate

### Trial 03 — ADOPTED

Drive file:
- name: `area-a-trial-03-adopted.png`
- id: `1-QO5eG7dp4SxJRWuDoMBPwSgImSaVMLp`

Decision:
- **adopted**
- use as Area A master candidate
- use as the visual baseline for Areas B–G

Why adopted:

- natural lower-center entrance path
- wooden posts removed
- decoration reduced
- seven interaction pockets are substantially clearer
- top-right is calmer and usable for the discovery notebook
- Area A stays intentionally ordinary enough for E/F/G to become more distinctive
- style reads as an illustrated mystery-game forest rather than generic fantasy concept art

Minor caveats accepted:

- left-edge trunk remains visually strong but no longer blocks the x=8% interaction pocket
- upper-right tree remains prominent but works as framing rather than clutter

## Google Drive storage

Parent project folder:
- `沿線・駅・住所_データ`
- id: `1zebMNmaORwl5oG8G80gWdw2RvIdQveYh`

Created art folder:
- `EXPLORE_森イラスト`
- id: `1WWKZWUm-DOPREV_hnmu-h11GUsQrtftd`

Area A folder:
- `EXPLORE_森イラスト/Area_A`
- id: `18Rcd4Jqq1EYpOTGhDEIKORodiD5ki1Q6`

Saved assets:

1. `area-a-trial-01.png`
2. `area-a-trial-02.png`
3. `area-a-trial-03-adopted.png`

Do not use Trial 01 or Trial 02 as the implementation reference unless explicitly comparing iteration history.

## GitHub state

Repository:
- `watarionn/portfolio-site`

Active branch:
- `feature/geo-explore-forest-art-phase2c`

Active PR:
- **#117 — [Geo] EXPLORE Area A forest art brief**

Current production brief:
- `docs/geo-explore-forest-art-phase2c-area-a.md`

Important:
- PR #117 has **not** been merged at this handoff point.
- Do not merge/deploy it without explicit user authorization.

## Next phase

Resume at:

**EXPLORE 森イラスト Phase 2-D — Area A UI Composite & Layout Lock**

Tasks:

1. Use only `area-a-trial-03-adopted.png`.
2. Create a UI composite preview using the real Area A coordinates.
3. Overlay:
   - 7 station/address interaction buttons
   - left/right/bottom exits
   - top-right discovery notebook
4. Test open quiz panels at high-risk positions:
   - 膳所 x8 y54
   - 忍路 x82 y43
   - 求名 x74 y65
   - 閖上 x43 y68
5. Verify desktop visual collision and readability.
6. Produce/review mobile composition separately. Do not rely on a destructive center crop.
7. If the composite passes, declare **Area A Layout Lock**.
8. Only after Layout Lock, prepare the implementation asset and move to Area B.

## Do-not-regress rules

- Do not reintroduce baked-in text or UI into the illustration.
- Do not use rejected Trial 01/02 as the active master.
- Do not increase Area A decoration density.
- Do not make Area A visually more special than E/F/G.
- Keep the seven live interaction positions unless a later explicit layout decision changes them.
- Keep data truth in MariaDB/API; forest art remains presentation only.


## Phase 2-D progress — 2026-09-23

Area A desktop UI composite QA is complete.

- Trial 03 only: confirmed
- seven canonical interaction controls: PASS
- left/right/bottom exits: PASS
- top-right discovery notebook: PASS
- expanded quiz checks at 膳所 / 忍路 / 求名 / 閖上: PASS
- expanded panels contained within the desktop illustration: PASS
- expanded panels vs exits/notebook: no collision
- canonical coordinates changed: no

Decision: **Area A Desktop Layout Lock**.

This is intentionally not the full Area A Layout Lock. Mobile remains a separate composition gate and must not use a destructive center crop of the desktop master.

Next phase: **Phase 2-D Mobile Composition**.
