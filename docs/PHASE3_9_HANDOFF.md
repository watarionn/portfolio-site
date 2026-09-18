# Portfolio City Phase 3.9 Handoff

Updated: 2026-09-18
Canonical repository: `watarionn/portfolio-site`
Canonical branch: `main`
Production URL: `https://cf278796.cloudfree.jp/portfolio-city/`
Current production main: `35444da469696981090e415702c64e1225546ab9`

## Current state

Portfolio City has completed the latest Phase 3.9 illustrated-building work through Cheatsheet / 技術資料センター.

Illustrated buildings currently in runtime: 6 total.

North Crown / Observatory Hill:
- HoloScope: `portfolio-city/assets/illustrated/observatory/holoscope.webp`
- Sphere: `portfolio-city/assets/illustrated/observatory/sphere.webp`
- Prime Dot Art: `portfolio-city/assets/illustrated/observatory/prime-dot-art.webp`

Archive Street:
- YOREI: `portfolio-city/assets/illustrated/archive/yorei.webp`
- Actress Finder: `portfolio-city/assets/illustrated/archive/actress-finder.webp`
- Cheatsheet: `portfolio-city/assets/illustrated/archive/cheatsheet.webp`

Cheatsheet was merged in PR #97 and deployed to production.
Its locked placement remains:
- x: 430
- y: 1480
- width: 250
- anchor: bottom-center
- asset: `assets/illustrated/archive/cheatsheet.webp`

Cheatsheet runtime WebP:
- 341 x 341
- 53,446 bytes
- SHA-256: `ef95fb9498a32fb84d5b7b2601b1b9a413e7ea2dfdcaed1a9a49d57fc6529de9`

Production validation after deploy:
- page: HTTP 200
- Cheatsheet asset: HTTP 200 / image/webp
- terrain chunks: 13
- projects: 14
- illustrated projects: 6
- horizontal overflow: 0
- browser QA: PASS at 390 / 820 / 1440
- desktop drag: PASS
- Portfolio City app bad responses: 0
- an unrelated root `/favicon.ico` 404 may still appear and is not a Portfolio City runtime failure

## Hard locks carried forward

Unless a later phase explicitly approves a structural change, preserve:
- 14 project identities and production routes
- project x / y / width / anchor values
- authored roads and connector intent
- existing clearings
- HoloCa geometry
- the current 13-chunk active terrain topology
- accepted illustrated building source art once the user has approved it

Do not replace an accepted illustration with a newly generated substitute.
After acceptance, only technical conversion, resizing, cropping, compression, or placement work is allowed unless the user explicitly asks for a redesign.

## Important context from Phase 3.8

Phase 3.8 P4 / P4.1 already introduced a restrained `world-edge-frame`:
- four low-opacity paper-mist corner fields
- 12 narrow feather bands around exposed edges of the cross-shaped 13-chunk topology

That treatment intentionally softened blank ivory margins without creating new terrain.

The newly adopted direction below is a stronger and different step. Do not treat the existing P4/P4.1 edge mist as the final solution.

# Adopted next direction: World Veil Pass

The user explicitly approved a new world-completion direction for the currently visible but undrawn map areas.

## Core concept

Keep the existing cross-shaped city as the authored core, but make the overall map read visually as a complete rectangular world.

The target result is:

**cross-shaped active city + low-detail outer-world backfill + semi-transparent cloud / fog veil**

The purpose is to prevent currently undrawn areas from reading as unfinished background while preserving the feeling that the world continues beyond the four active districts.

This should evoke the map language of exploration RPGs: visible settled areas in the center, quieter peripheral geography, and unexplored or unrevealed regions softened by cloud and mist.

## Critical design decision

Do **not** use semi-transparent fog directly over truly blank map voids as the only treatment.

Because the veil is translucent, the user wants a simple world background underneath it first.

Therefore:
1. fill currently undrawn visible areas with intentionally low-detail scenery,
2. then place semi-transparent cloud / fog over those areas,
3. keep the four active districts and project buildings more legible than the peripheral world.

## Rectangular-map strategy

The map should become rectangular **visually first**, not through an immediate world-geometry rewrite.

Preserve the current city geometry while extending the illustration into the unused portions of the existing world canvas.

Do not move the current districts, projects, roads, clearings, or HoloCa route merely to achieve a square/rectangular silhouette.

Any future change to world bounds or chunk topology must be a separate explicit approval.

## Outer-world backfill art direction

Peripheral areas should be clearly simpler than the authored districts.

Good candidates:
- soft grassland
- rolling hills
- sparse woods and tree clusters
- continuation of streams / shoreline / water
- faint minor paths
- small cliffs or stone edges
- quiet negative space
- roads or terrain features that disappear into mist

Avoid:
- new project buildings
- detailed new districts that look active or explorable
- dense landmarks competing with the current four districts
- arbitrary geometry that blocks the Growth Frontiers / Expansion Corridors documented in Phase 3.6

The outer world should communicate: “the world continues here, but it is not the current authored destination.”

## Veil art direction

Use an illustrated storybook veil rather than a flat white UI overlay.

Preferred visual language:
- watercolor / paper-like softness
- warm ivory and off-white
- restrained blue-gray shadow
- subtle olive / warm neutral contamination where it touches terrain
- almost no hard outline
- soft irregular edges
- corners and far outer regions may be denser
- veil becomes lighter toward active districts
- roads, streams, woods, and terrain should appear to fade naturally into it

The veil should feel like part of the painted world.

## Layer / interaction behavior

The fog / cloud veil should be decorative and non-interactive.

Preferred behavior:
- world-fixed, not viewport-fixed
- moves naturally with map dragging
- `pointer-events: none`
- does not intercept building clicks
- does not hide current illustrated buildings
- does not wash out the active four districts
- may overlap low-detail peripheral scenery
- may be split into more than one depth layer if that improves the transition

Do not attach fog to the screen as a static HUD effect.

## Recommended next-chat sequence

Start from the latest public `main` and production state, then proceed in this order:

1. **Visible-void audit**
   - inspect the complete map at 390 / 820 / 1440
   - identify every currently visible blank or obviously unfinished-looking region
   - map those regions against the current world bounds and 13-chunk cross topology

2. **Rectangular backfill coverage plan**
   - decide which unused world areas receive low-detail scenery
   - preserve existing Growth Frontiers / Expansion Corridors
   - do not move active content

3. **Backfill visual prototype**
   - establish the minimum visual vocabulary needed beneath translucent fog
   - keep detail lower than current terrain

4. **World Veil design**
   - define cloud / mist shapes, density, feathering, and layer order
   - ensure the result reads as intentional unexplored world rather than censorship of unfinished art

5. **Implementation**
   - add world-fixed decorative layers/assets
   - preserve interaction and project geometry

6. **QA**
   - 390 / 820 / 1440
   - no horizontal overflow
   - 14 projects remain interactive
   - 13 active terrain chunks remain intact unless a separately approved phase changes topology
   - desktop drag remains functional
   - active building readability remains strong
   - blank-map “unfinished” impression is removed

## Visual quality principle

The goal is not to hide unfinished work with a patch.

The goal is to turn the currently exposed margins into a deliberate piece of worldbuilding:
a complete rectangular illustrated world whose active city forms a cross-shaped core, with quieter peripheral land receding into cloud and mist.
