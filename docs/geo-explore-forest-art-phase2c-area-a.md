# EXPLORE Forest Art Phase 2-C — Area A production brief

Status: production brief / pre-illustration
Target: `/geo/explore/` Area A
Art direction: Professor Layton-series-like storybook mystery atmosphere, adapted to the GEO EXPLORE interface.

## 1. Goal

Area A is the visual master for all later forest areas.

It must communicate:

- a gentle entrance into an unusual forest
- quiet mystery rather than danger
- a refined, nostalgic storybook atmosphere
- enough visual restraint for quiz UI to remain readable
- a layout that feels intentionally designed around the existing seven interactive positions

Do not paint a beautiful forest first and then search for places to put the UI. The seven interaction pockets and three exits are part of the composition from the beginning.

## 2. Existing interaction coordinates

These coordinates are already live and should be treated as fixed during the first art trial.

| id | label | type | x | y |
| --- | --- | --- | ---: | ---: |
| oyumi | 生実町 | address | 38% | 17% |
| juso | 十三 | station | 17% | 28% |
| kisaichi | 私市 | station | 69% | 30% |
| oshor | 忍路 | address | 82% | 43% |
| zeze | 膳所 | station | 8% | 54% |
| gumyo | 求名 | station | 74% | 65% |
| yuriage | 閖上 | address | 43% | 68% |

Exit controls are fixed near:

- left: left edge, vertical center
- right: right edge, vertical center
- bottom: horizontal center, bottom edge

The discovery notebook occupies the top-right corner.

## 3. Interaction-safe composition map

Treat each live coordinate as a clear visual pocket, approximately 14–18% of canvas width and 12–16% of canvas height.

### Pocket A1 — 生実町, x38 y17
Open patch beneath a light canopy. Avoid branches crossing immediately behind the label. A small bend in the path can lead visually toward it.

### Pocket A2 — 十三, x17 y28
Left-side path verge. Use low grass and a tree trunk farther left, not directly behind the control.

### Pocket A3 — 私市, x69 y30
Right-upper meadow pocket between two tree groups. Keep this region lighter than the surrounding foliage.

### Pocket A4 — 忍路, x82 y43
Right-side forest verge. Preserve breathing room because it is close to the right exit corridor.

### Pocket A5 — 膳所, x8 y54
Extreme-left interaction pocket. No large trunk, rock, or high-contrast edge under the button. The left exit must still read as a continuation beyond it.

### Pocket A6 — 求名, x74 y65
Lower-right grassy clearing. Do not fill with foreground shrubs. Keep enough neutral ground for an expanded quiz panel.

### Pocket A7 — 閖上, x43 y68
Lower-central-left path edge. This is one of the most likely places for a quiz panel to overlap the central path, so keep the surrounding ground simple.

## 4. Main path

The path should:

1. enter from the lower middle,
2. broaden slightly around the lower interaction pockets,
3. curve gently through the center,
4. continue toward the upper middle,
5. hint at side branches toward the left and right exits.

It should not form a literal game-board network. The branching should feel like an ordinary woodland path whose geometry quietly supports navigation.

Color: warm beige / muted ochre.
Edge: soft irregular grass transitions.
Texture: understated, never photorealistic.

## 5. Trees and vegetation

### Tree masses

Use three primary masses:

- upper-left: medium density
- upper-right: medium density, slightly lighter than left
- far background center: sparse enough that the path visibly continues

Secondary shrubs may frame the bottom corners, but the lower-middle region must stay open.

### Tree character

- hand-drawn, slightly irregular silhouettes
- rounded but not bubble-like foliage
- visible trunks and selected branches
- simplified distant foliage
- no hyper-detailed leaves
- no symmetrical decorative tree rows

### Ground vegetation

Use small clusters of:

- muted grasses
- tiny wildflowers
- scattered leaves
- a few small stones
- at most one subtle stump

Do not introduce signs, ruins, lanterns, buildings, railways, or special symbolic props in Area A. Those should remain available for later areas.

## 6. Lighting and palette

Mood: late morning / soft afternoon woodland light.

Suggested palette families:

- muted yellow-green
- olive and deep moss green
- warm beige
- desaturated brown
- soft gray-green shadow
- very limited dusty red or muted flower accents

Lighting:

- gentle patches of filtered light
- no dramatic god rays
- no high-contrast black shadows
- center and interaction pockets slightly brighter
- edges may be darker to frame the scene

## 7. Style language

Aim for the visual qualities associated with the Professor Layton series:

- illustrated European-storybook sensibility
- warm, slightly nostalgic color treatment
- charming but restrained stylization
- environments that feel designed for mystery and discovery
- hand-drawn contour character
- simplified painterly surfaces
- subtle theatrical / stage-set composition

Do not copy a specific existing Layton forest, character, logo, UI, or identifiable composition.

## 8. Hard exclusions

The Area A image must contain NO:

- baked-in text
- station names
- address names
- arrows
- quiz boxes
- UI buttons
- icons
- people or characters
- houses or large architecture
- railway tracks
- highly detailed photoreal foliage
- horror lighting
- fantasy magic effects
- excessive fog
- strong depth-of-field blur
- decorative frames

All text and interaction remain HTML/CSS layers.

## 9. Desktop production asset

Recommended master:

- 1600 × 1000 px
- landscape
- central content-safe composition
- important visual forms remain inside approximately x 4–96%, y 5–90%
- keep the top-right notebook region visually quiet

Implementation intent:

- dedicated Area A background asset
- displayed behind the existing forest interaction layer
- no positional information baked into the bitmap beyond compositional clearings

## 10. Mobile production asset

Do not rely on a simple center-crop of the desktop art.

Recommended companion master:

- 900 × 1600 px
- portrait
- same world, palette, path language and tree motifs
- interaction pockets vertically re-composed around the existing mobile coordinate system
- lower region kept especially calm because the forest area is currently taller on mobile

Desktop and mobile should feel like two camera framings of the same location, not unrelated paintings.

## 11. Trial-generation prompt

Create an illustrated woodland entrance background for an interactive mystery exploration page. The scene has a warm, refined storybook atmosphere associated with the Professor Layton series: hand-drawn contours, gently simplified painterly surfaces, muted nostalgic greens and warm beige earth, quiet intellectual mystery, charming but not childish. Use a slightly elevated three-quarter viewpoint, like a carefully designed adventure-game background.

A warm dirt path enters from the lower center, curves softly through the middle, and disappears toward the upper center. Hint at subtle side-path continuations toward both the left and right edges. Frame the scene with irregular woodland tree groups, medium density at upper left and upper right, with lighter openings around the path. Use soft filtered woodland light, restrained shadows, low grasses, a few tiny wildflowers and stones.

The composition must deliberately preserve seven uncluttered interaction pockets around these approximate normalized positions: (38%,17%), (17%,28%), (69%,30%), (82%,43%), (8%,54%), (74%,65%), and (43%,68%). These areas should look natural, like small path verges or clear ground beneath the canopy, not empty rectangles. Keep the top-right corner visually quiet for an interface notebook. Keep left-center, right-center and bottom-center edge corridors readable as possible path exits.

No text, signs, labels, arrows, characters, buildings, railway tracks, interface elements or baked-in game objects. Do not make the image photorealistic, dark fantasy, horror, highly saturated, excessively detailed, or strongly blurred. The background should support overlaid interactive controls without competing with them.

## 12. Trial rejection criteria

Reject the trial if any of the following occurs:

1. Any of the seven interaction pockets is covered by a major trunk, dense shrub, bright highlight or strong texture.
2. The path cannot be visually understood within two seconds.
3. The left/right/bottom exit corridors visually dead-end.
4. The image reads as generic fantasy concept art rather than a storybook mystery-game background.
5. The forest is too realistic or too childlike.
6. The center is too busy for quiz overlays.
7. The top-right notebook zone is visually noisy.
8. Text or UI-like shapes appear in the artwork.
9. Mobile would require an obviously destructive crop.
10. Area A feels like a climax instead of an inviting entrance.

## 13. Acceptance gate

Area A becomes the forest art master only after a trial passes:

- art-direction fit
- all seven interaction pockets
- three navigation corridors
- desktop readability
- mobile re-composition feasibility
- UI overlay readability
- visual restraint sufficient for later areas to become progressively more distinctive

After acceptance, Areas B–G inherit the same line, palette, texture and perspective language while varying path topology, density and special-experience motifs.


## Phase 2-D desktop layout lock — 2026-09-23

Status: **DESKTOP LAYOUT LOCKED**

The adopted Trial 03 master was composited at its native 1536 × 1024 size with the seven canonical interaction coordinates, three exits, and top-right discovery notebook.

Desktop checks passed:

- all seven trigger positions remain readable with HTML/CSS-style light controls
- left / right / bottom navigation corridors remain usable
- discovery notebook fits the intended quiet top-right region
- expanded-panel QA passed at the four high-risk positions: 膳所, 忍路, 求名, 閖上
- all four expanded panels remain inside the illustration bounds
- none of the four expanded panels collide with the three exits or discovery notebook
- no canonical interaction coordinate was moved
- Trial 01 and Trial 02 remain rejected and are not implementation references

QA-only composites were generated locally and intentionally remain outside the production asset tree.

This lock is **desktop-only**. Full Area A Layout Lock is not yet declared because the mobile composition must be produced and reviewed separately. The desktop master must not be destructively center-cropped for mobile.

Next gate: **Phase 2-D Mobile Composition** using a portrait companion master that preserves the same location, palette, path language, and seven interaction pockets.
