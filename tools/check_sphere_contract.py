from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "works/sphere/index.html").read_text(encoding="utf-8")
JS = (ROOT / "works/sphere/sphere.js").read_text(encoding="utf-8")
CSS = (ROOT / "works/sphere/sphere.css").read_text(encoding="utf-8")
HOME = (ROOT / "index.html").read_text(encoding="utf-8")

errors: list[str] = []


def require(text: str, source: str, label: str) -> None:
    if text not in source:
        errors.append(f"missing {label}: {text!r}")


def forbid(text: str, source: str, label: str) -> None:
    if text in source:
        errors.append(f"forbidden {label}: {text!r}")


require("PROJECT 03 / VOXEL + CANVAS", HTML, "case-study identity")
require('id="layer-range"', HTML, "direct layer navigation")
require('id="center-layer"', HTML, "center-layer control")
require('id="reset-view"', HTML, "3D reset control")
require('tabindex="0" aria-label="球体3Dプレビュー', HTML, "keyboard-operable canvas")
require('<script src="sphere.js" defer></script>', HTML, "deferred Sphere script")
require("case-study--dark", HTML, "build-flow case study")
for size in (9, 13, 21):
    require(f'data-size="{size}"', HTML, f"size preset {size}")
forbid("onclick=", HTML, "inline click handler")

require("surfaceVoxels = voxels.filter", JS, "surface-only voxel model")
require("FACE_DEFS", JS, "cube-face definitions")
require("transformedNormalDepth", JS, "3D back-face culling")
require("requestAnimationFrame(render3D)", JS, "3D render scheduling")
require("setAttribute('aria-selected'", JS, "tab ARIA synchronization")
require("setAttribute('aria-pressed'", JS, "toggle ARIA synchronization")
require("event.key === 'ArrowLeft'", JS, "keyboard rotation/navigation")
require("replaceChildren(fragment)", JS, "safe slice rendering")
forbid("innerHTML", JS, "HTML-string rendering")

require(".project-hero", CSS, "editorial hero styling")
require(".case-study--dark", CSS, "inverse case-study styling")
require("touch-action: none", CSS, "touch-safe 3D interaction")
require("button:focus-visible", CSS, "visible keyboard focus")

sphere_row = '<strong>天球儀</strong><em>Canvas / Voxel</em>'
require(sphere_row, HOME, "truthful Sphere technology label")


def reference_counts(size: int, hollow: bool) -> tuple[int, int, int]:
    center = (size - 1) / 2
    radius2 = center * center
    inner2 = max(0, center - 1) ** 2
    voxels: set[tuple[int, int, int]] = set()
    for y in range(size):
        for z in range(size):
            for x in range(size):
                d2 = (x - center) ** 2 + (y - center) ** 2 + (z - center) ** 2
                if d2 > radius2 + 0.5:
                    continue
                if hollow and d2 <= inner2:
                    continue
                voxels.add((x, y, z))

    neighbors = ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))
    surface = sum(
        1
        for x, y, z in voxels
        if any((x + dx, y + dy, z + dz) not in voxels for dx, dy, dz in neighbors)
    )
    mid = size // 2
    middle_slice = sum((x, mid, z) in voxels for x in range(size) for z in range(size))
    return len(voxels), surface, middle_slice


if reference_counts(13, False) != (925, 354, 113):
    errors.append(f"solid size-13 reference regression: {reference_counts(13, False)}")
if reference_counts(13, True) != (410, 410, 32):
    errors.append(f"hollow size-13 reference regression: {reference_counts(13, True)}")
if reference_counts(51, False) != (65267, 6366, 1961):
    errors.append(f"solid size-51 reference regression: {reference_counts(51, False)}")

if errors:
    raise SystemExit("Sphere contract failed:\n- " + "\n- ".join(errors))

print("Sphere interaction contract passed")
