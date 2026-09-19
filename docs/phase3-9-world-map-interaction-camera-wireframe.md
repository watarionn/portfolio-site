# Phase 3.9 - World Map Interaction & Camera Wireframe

Updated: 2026-09-19
Status: interaction contract study; no production runtime replacement

## Goal

Define how a visitor moves through the new hierarchy before final World Map art or runtime migration:

World Map -> District View -> Building Preview -> Work

The contract must work on desktop and mobile while preserving the H2 world coordinates and cloud-frontier model.

## Navigation state machine

### S0 World Map Entry

The visitor arrives at the Initial Camera Bound, not the entire Master World.

Desktop:
- all four current districts are readable,
- limited pan is available inside the Published World plus frontier envelope,
- at least two future-frontier cues are visible.

Mobile:
- begin near the published cluster center,
- keep useful district scale rather than fitting the whole world,
- 2-3 district homes may be visible at once,
- remaining current districts are reachable with a short pan.

### S1 District Focus

Desktop pointer hover or keyboard focus gives a restrained district response without opening it.

Allowed response:
- district landmark / footprint emphasis,
- subtle local label reveal,
- cursor / focus affordance,
- optional nearby terrain de-emphasis.

Do not use a large permanent title over the map.

Mobile has no hover dependency. Tap proceeds directly to district selection / transition.

### S2 District Enter

Selecting a district transitions from World Map to District View.

Contract:
- remember current World Map camera center and zoom,
- remember selected district id,
- transition should spatially imply entering that region,
- do not require the final animation implementation yet,
- URL / navigation semantics must remain compatible with direct work routes.

### S3 District View

District View is a closer illustrated neighborhood scene containing roughly 3-6 project buildings as the district grows.

Initial current counts remain compatible with the existing portfolio:
- Observatory: 3,
- Archive: 4,
- Workshop: 4,
- Waterside: 3.

District View requirements:
- buildings are the primary interactive objects,
- district title may appear as local scene UI rather than permanent World Map text,
- left/right adjacent-district navigation is available,
- explicit return-to-world control is available,
- scene can contain non-project decorative structures without making them interactive.

### S4 Building Focus

Desktop hover / focus may emphasize a project building.

Mobile tap must not rely on hover.

First activation opens Building Preview rather than immediately navigating away.

### S5 Building Preview

A small project-introduction panel appears over or adjacent to the District View.

Minimum content contract:
- project name,
- concise one-line identity / purpose,
- optional category / technology cue if useful,
- primary action to open the full work,
- close / back action.

The preview must not cover so much of the scene that the selected building loses spatial context.

### S6 Full Work Route

Primary preview action opens the existing full project route / article experience.

Existing 14 work routes remain canonical. The World Map redesign must not break deep links.

### S7 Return

Returning from a work route should restore the relevant District View when navigation history permits.

Returning from District View to World Map restores the saved World Map camera center and zoom rather than resetting to the initial camera every time.

A fresh World Map entry still uses the Initial Camera calculation.

## Adjacent-district navigation

District View includes previous / next navigation, but adjacency is not a hard-coded compass direction.

Use a stable authored district sequence for UI arrows while World Map geography remains spatial.

Working W0 sequence:
Archive -> Observatory -> Workshop -> Waterside -> Archive

This sequence is a wireframe default, not a final narrative order. It can be revised after District View composition testing.

When a new district is published, update the authored sequence without moving existing district home anchors.

## Desktop camera contract

World Map camera has three constraints:

1. minimum zoom keeps current district targets legible,
2. maximum zoom avoids turning World Map into District View,
3. pan bounds include Published World plus a controlled R2 frontier margin but exclude deep unfinished R3 reserve.

Initial framing derives from published-content bounds plus frontier margin. It must not derive from full Master World dimensions.

Input support target:
- pointer drag,
- wheel / trackpad zoom if retained after prototype testing,
- keyboard-accessible district focus and activation,
- visible focus state.

Zoom is optional for the first prototype. Pan and district selection are the essential behaviors.

## Mobile camera contract

Do not fit the entire desktop map into the phone viewport.

Use:
- readable fixed/limited zoom band,
- touch pan,
- short travel distance among current districts,
- explicit orientation aid,
- edge/frontier cloud cues.

Potential orientation aids to test later:
- compact district compass,
- miniature published-area indicator,
- four-district quick-jump control.

No orientation aid is selected yet.

## Cloud / frontier interaction

R2 and R3 are scenery, not disabled district buttons.

Rules:
- no fake clickable unpublished district markers,
- frontier glimpses may suggest roads, coast, islands, or highland continuation,
- panning stops before deep R3 becomes an explorable blank area,
- cloud does not block current district hit targets,
- when a future district publishes, its local cloud/frontier state changes without requiring unrelated edges to reveal.

## District hit targets

World Map district selection should use authored hit regions associated with district home geography, not a visible grid cell.

Requirements:
- hit region may be larger than the visible landmark,
- regions must not overlap ambiguously at normal entry zoom,
- keyboard order must be deterministic,
- mobile targets must remain comfortably tappable,
- final polygon geometry waits for final World Map art.

## Building hit targets

District View project buildings use semantic interactive targets independent of decorative scene details.

Requirements:
- one building maps to one canonical work id,
- decorative structures are not focusable unless they have an explicit function,
- selected/focused state is visible without relying on color alone,
- touch target may extend beyond the painted silhouette.

## History and URL behavior

Target behavior:

- direct work URL -> work remains valid,
- World Map -> District -> Preview -> Work preserves browser history,
- browser Back from Work returns to Preview/District when entered through the city flow,
- direct Work entry does not fabricate a fake prior District history entry,
- World Map camera restoration may use session/history state rather than URL coordinates.

Exact URL shape for District View remains unlocked until implementation planning.

## Reduced motion

Transitions must support reduced-motion preference.

With reduced motion:
- replace geographic zoom-flight with short fade / state swap,
- preserve focus destination,
- do not make navigation dependent on animation completion.

## Wireframe flow

Desktop:

World Map
  -> hover/focus district
  -> activate district
  -> District View
  -> hover/focus building
  -> activate building
  -> Building Preview
  -> Open Work
  -> Work Route

District View also supports Previous District / Next District / Return to World.

Mobile:

World Map
  -> pan if needed
  -> tap district
  -> District View
  -> tap building
  -> Building Preview
  -> Open Work
  -> Work Route

No mobile step depends on hover.

## Acceptance contract

The future prototype passes this wireframe when:

1. all 4 districts are reachable from World Map on desktop and mobile,
2. all 14 current works remain reachable through District View,
3. all canonical work URLs remain valid,
4. returning to World Map restores prior camera state,
5. desktop can navigate districts without pointer-only dependency,
6. mobile can reach every district without fitting the whole Master World onscreen,
7. frontier scenery never masquerades as unpublished clickable content,
8. reduced-motion navigation remains complete,
9. new districts can be inserted without relocating existing district anchors.

## Gate

World Map Interaction & Camera Wireframe: **PASS FOR PROTOTYPE PLANNING**

No production runtime code is changed by this document.

## Next step

**Phase 3.9 Interaction Prototype Plan**

Define the smallest isolated prototype that can validate:
- normalized H2 camera framing,
- desktop pan,
- mobile short-pan behavior,
- four district hit regions,
- District View state transition,
- Building Preview state,
- camera restoration,
- keyboard and reduced-motion paths.

Use placeholders / existing accepted assets only. Do not replace the production World Map or generate final geography art during the prototype.
