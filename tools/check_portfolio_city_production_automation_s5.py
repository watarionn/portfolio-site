#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
CONFIG = TOOLS / "portfolio_asset_pipeline_configs"


def fail(message: str) -> None:
    raise SystemExit(f"Portfolio City S5 automation contract failed: {message}")


pipeline_path = TOOLS / "portfolio_asset_pipeline.py"
world_path = TOOLS / "portfolio_city_world_derivatives.py"
waterside_path = TOOLS / "build_waterside_s4_single_scene.py"
tests_path = TOOLS / "test_portfolio_asset_pipeline.py"

for path in (pipeline_path, world_path, waterside_path, tests_path):
    if not path.is_file():
        fail(f"missing {path.relative_to(ROOT)}")

pipeline = pipeline_path.read_text(encoding="utf-8")
world = world_path.read_text(encoding="utf-8")
waterside = waterside_path.read_text(encoding="utf-8")
tests = tests_path.read_text(encoding="utf-8")

for token in (
    "def image_metadata",
    "def run_derivatives",
    "def run_composite",
    "def validate_manifest",
    "def build_package",
    "git_show_bytes",
    "decoded_rgba_bytes",
    "package output directory must be empty",
):
    if token not in pipeline:
        fail(f"pipeline missing shared capability: {token}")

for forbidden in ("WinSCP", "FTP_HOST", "ftps://", "delete remote", "sync remote"):
    if forbidden.lower() in pipeline.lower():
        fail(f"asset pipeline must prepare packages, not deploy them directly: {forbidden}")

if "from portfolio_asset_pipeline import save_derivative, sha256_file" not in world:
    fail("World derivative tool is not using shared pipeline primitives")

if "from portfolio_asset_pipeline import git_show_bytes, sha256_bytes, sha256_file" not in waterside:
    fail("Waterside S4 builder is not using shared pipeline primitives")

for token in (
    "test_derivatives_and_validation",
    "test_composite_hotspot_and_metadata_validation",
    "test_package",
    "assertRaises(pipeline.PipelineError)",
):
    if token not in tests:
        fail(f"pipeline tests missing coverage: {token}")

world_cfg = json.loads((CONFIG / "world-runtime-v1.json").read_text(encoding="utf-8"))
waterside_cfg = json.loads((CONFIG / "waterside-s4.json").read_text(encoding="utf-8"))
package_cfg = json.loads((CONFIG / "waterside-s4-proof-package.json").read_text(encoding="utf-8"))

if world_cfg.get("job") != "derivatives":
    fail("World config must be derivatives")
if world_cfg.get("source", {}).get("expectedSize") != [8192, 6144]:
    fail("World config source geometry changed")
expected_world = {
    ("avif", 62, 4096, 3072),
    ("avif", 62, 3072, 2304),
    ("webp", 84, 4096, 3072),
    ("webp", 84, 3072, 2304),
}
actual_world = set()
for group in world_cfg.get("derivatives", []):
    for width, height in group.get("sizes", []):
        actual_world.add((group.get("format"), group.get("quality"), width, height))
if actual_world != expected_world:
    fail("World runtime derivative set drifted from the S2 decision")

if waterside_cfg.get("job") != "composite":
    fail("Waterside config must be composite")
if waterside_cfg.get("canvas") != {"width": 1672, "height": 941}:
    fail("Waterside canvas changed")
layer = (waterside_cfg.get("layers") or [{}])[0]
if layer.get("id") != "aquarium":
    fail("Waterside proof layer must remain Aquarium")
placement = layer.get("placement", {})
if (
    placement.get("anchor") != "bottom-center"
    or placement.get("xFraction") != 0.199606
    or placement.get("yFraction") != 0.571039
    or placement.get("widthFraction") != 0.25
    or placement.get("rotationDegrees") != 0
):
    fail("Waterside locked placement changed")
if layer.get("hotspot") != {"id": "aquarium", "paddingPx": 12}:
    fail("Waterside hotspot derivation changed")
if waterside_cfg.get("output", {}).get("lossless") is not True:
    fail("Waterside pipeline proof must remain lossless")

if package_cfg.get("job") != "package":
    fail("S4 proof package config must be a package job")
files = package_cfg.get("files", [])
if len(files) != 5 or len(set(files)) != 5:
    fail("S4 proof package must contain exactly five unique runtime proof files")
if any(not path.startswith("prototype/phase3-9-district-single-scene-s4/") for path in files):
    fail("S4 proof package may only contain S4 prototype files")

print(
    "Portfolio City S5 automation contract passed: "
    "shared source/image/hash primitives / config-driven World + District jobs / "
    "manifest validation / safe package preparation / no direct deployment"
)
