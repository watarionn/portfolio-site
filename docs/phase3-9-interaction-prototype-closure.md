# Phase 3.9 CP5 Interaction Prototype Closure

Status: READY FOR MIGRATION PLANNING
Production runtime: UNCHANGED

## Closed interaction contract

The isolated prototype now covers the intended hierarchy:

World Map -> District View -> Building Preview -> eventual canonical Work route.

CP5 found one accessibility gap in the CP4 modal: keyboard Tab could leave the Building Preview despite aria-modal. CP5 adds focus containment between the preview action controls while preserving Escape and explicit Back to District behavior.

## Audit matrix

- World camera: constrained pointer/touch pan and keyboard arrow pan
- World return: saved camera restored
- Districts: 4/4 represented
- Projects: 14/14 canonical id/title/route contracts represented
- District sequence: Archive -> Observatory -> Workshop -> Waterside -> Archive
- Preview entry: project building control
- Preview exit: Back to District / backdrop / Escape
- Preview keyboard: Tab focus contained
- Focus restoration: preview -> originating building; district -> originating world target
- Reduced motion: media-query contract present
- Open Work: inert in prototype, canonical route preserved
- Production runtime: untouched

## Gate result

No prototype blocker remains for the next design step. The next step is a Production Migration Plan, not production implementation. Runtime migration, merge, and deployment remain separately gated.
