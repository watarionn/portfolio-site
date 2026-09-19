# Phase 3.9 CP-D3 - Geography Translation Blueprint

Updated: 2026-09-19
Status: production-art specification candidate
Source: CP-D2 Published Cluster Composition Test
Scope: translate logical/composition decisions into art constraints; no final art generation or cutover

## 1. World-space contract

Canonical logical address plane:
- 16 columns (A-P)
- 12 rows (01-12)
- one cell = one district home address
- cells are never visitor-visible

W0 district homes:
- Observatory Hill: H05
- Archive Street: G06
- Workshop Alley: I06
- Waterside Play: H07

The artwork must be authored as one continuous world surface. District cells constrain semantic home positions, not visible tile boundaries.

## 2. W0 focal envelopes

District focal objects should not sit at exact cell centers. These offsets are composition guidance, not runtime hitbox coordinates.

### Observatory Hill / H05
- focal bias: north-east within H05
- elevation: highest of current four districts
- silhouette support: ridge / hill shoulder behind and west of focal area
- connective path descends south-west toward Commons seam
- must not look like a detached mountain island

### Archive Street / G06
- focal bias: west / south-west within G06
- terrain: older, denser, landlocked street fabric
- connective path bends eastward rather than following a horizontal cell line
- western terrain should continue into F-A frontier

### Workshop Alley / I06
- focal bias: east / slightly north within I06
- terrain: connected mainland, tighter alley/industrial-craft texture
- eastern edge should visually loosen toward channel/offshore frontier
- must remain connected to Archive through shared mainland, not via Commons as a compulsory hub

### Waterside Play / H07
- focal bias: south-east within H07
- terrain: inlet / quay / water-edge relationship
- shoreline should enter H07 diagonally from south-east
- path northward should curve around water/terrain rather than form a vertical axis

## 3. Land / water silhouette

### Mainland
Use one dominant irregular mainland covering the current cluster.

Required characteristics:
- west/northwest shoulder reaches toward F-A
- northern terrain rises behind Observatory
- east edge narrows or breaks into channels before F-C
- south edge is interrupted by a meaningful inlet near Waterside
- coastline crosses logical cell boundaries at oblique angles
- no rectangular peninsula aligned to the grid

### Southern inlet
The inlet is the primary water feature in W0.

It should:
- visibly explain Waterside's identity,
- cut into the mainland from south/south-east,
- create at least one curved shoreline route,
- leave a coastal continuation toward F-B,
- avoid splitting the current four districts into separate islands.

### Offshore geography
F-C should contain partial island/channel evidence.

At W0:
- show only nearby island silhouettes / coast fragments,
- do not reveal a complete offshore district,
- allow cloud/frontier to obscure the continuation,
- preserve room for a later bridge, ferry, causeway, or independent island connection depending on future district semantics.

## 4. Highland structure

Observatory highland is a terrain gradient, not a circular hill icon.

Art cues:
- overlapping ridge shoulders,
- slightly steeper/narrower roads,
- sparse vegetation or exposed terrain where appropriate,
- atmospheric separation from lower Archive/Workshop,
- descending terrain toward Commons and Waterside.

Avoid:
- isolated cone mountain,
- perfect circular plateau,
- cliff wall tracing H05 edges.

## 5. Route hierarchy

Routes are scenic connective infrastructure, not grid visualization.

Hierarchy:
1. Primary scenic route: Archive vicinity -> shared seam -> Workshop vicinity.
2. Highland route: lower mainland -> Observatory, curved/ascending.
3. Waterside route: lower mainland -> inlet edge -> Waterside.
4. Frontier hints: partial routes fading into F-A / F-B / F-C.

Rules:
- no road follows a full cell edge,
- no perfect north/south/east/west cross,
- no four spokes meeting at one exact Commons center,
- paths may split, merge, disappear behind terrain, and reappear,
- route width may vary by district character.

## 6. Central Commons

Central Commons is a seam-space motif, not a fifth district.

Visual role:
- small irregular plaza / green / junction fragments may exist,
- should be partially shaped by surrounding roads and terrain,
- must not dominate W0 silhouette,
- no large circle, star plaza, or symmetrical roundabout,
- no unique giant landmark that competes with district focal buildings.

It can be perceived after looking, but should not be the first thing the eye locks onto.

## 7. Frontier / cloud system

Cloud is an illustrated world veil, not a rectangular fog-of-war mask.

### W0 reveal
Clearly readable:
- four current district focal areas,
- connective mainland among them,
- southern inlet,
- nearby highland,
- hints of all three expansion fronts.

Partially visible:
- F-A continuation to west/northwest,
- F-B coastline continuing south/southeast,
- F-C island/channel silhouettes eastward.

Hidden:
- most of the 16x12 Master World,
- exact future district cells,
- complete future roads/coastlines.

Cloud shapes:
- overlap land and sea irregularly,
- use several depth bands rather than one hard edge,
- may expose small geography fragments beyond the main published boundary,
- must not form a rectangle around G-I / 05-07.

## 8. Camera composition

### Desktop W0
Goal: current cluster readable in one frame with enough frontier context to imply a larger world.

Working composition:
- all four current district focal areas visible,
- modest peripheral breathing room,
- at least one visible hint from F-A, F-B, F-C,
- eastern/offshore context may be more obscured than mainland context,
- cluster should sit slightly left/up of viewport center to create exploratory pull east/south.

Do not fit the full 16x12 world.

### Tablet W0
- preserve all four districts if labels/buildings remain legible,
- reduce peripheral frontier before reducing district focal scale,
- allow minor initial offset if needed.

### Mobile W0
- do not force all four focal areas into one view,
- show a readable 2-3 district neighborhood at entry,
- Observatory/Archive/Workshop/Waterside remain a short pan apart,
- preserve world coordinates and scale,
- initial crop should contain enough landmark context to orient the user.

## 9. Illustration direction

Target feeling:
- hand-illustrated storybook city/world map,
- gently exaggerated geography,
- readable silhouettes before fine texture,
- warm inhabited mainland contrasted with cooler water/frontier atmosphere,
- moderate detail near published districts,
- progressively softer/lower-detail geography toward frontier.

Production art should inherit the established Portfolio City illustrated-world direction rather than introduce a new visual language.

Priority order:
1. geography silhouette,
2. district readability,
3. connective paths,
4. depth/elevation,
5. vegetation/coast texture,
6. decorative micro-detail.

## 10. Explicit anti-patterns

Reject any candidate that:
- visibly reads as a 16x12 board,
- places four districts at equal compass points around a dominant center,
- makes all current districts separate islands,
- centers every district exactly in its logical cell,
- uses straight grid-aligned roads as the main structure,
- reveals the full Master World at W0,
- fills undeveloped cells merely to avoid empty space,
- makes frontier clouds a rectangular frame,
- turns Central Commons into the primary landmark,
- gives every coastline/island equal detail,
- shrinks mobile until buildings become unreadable,
- changes or regenerates accepted project-building artwork without a separate approval.

## 11. Art-layer contract

Recommended separable layers:
1. base water / atmosphere,
2. mainland silhouette,
3. secondary land/islands,
4. highland/elevation,
5. roads/paths,
6. vegetation/coast texture,
7. district environment dressing,
8. frontier/cloud veil,
9. accepted district/project building assets,
10. interactive overlays handled by runtime rather than baked labels.

Do not bake logical grid lines, cell ids, frontier ids, debug labels, or clickable hit areas into final art.

## 12. Acceptance gate for first art candidate

A first illustrated candidate can advance only if:
- W0 four-district semantic relationships are preserved,
- 16x12 addressing is invisible,
- mainland + inlet + highland + offshore hints are readable without labels,
- F-A/F-B/F-C can still expand without repainting current district homes,
- Central Commons is subordinate,
- desktop framing feels like a window into a larger world,
- mobile can crop/pan without requiring a separate geography,
- accepted building artwork can be composited without scale conflict.

## Result

CP-D3: READY FOR ART BLOCKOUT.

Next checkpoint: CP-D4 World Art Blockout.
Create the first large-world visual candidate from this specification. It remains a blockout/reference candidate until explicit visual approval. Do not flip the production hierarchy feature flag, merge, deploy, or delete the legacy runtime.
