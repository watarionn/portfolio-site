#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "docs/phase3-6-r2-negative-origin-runtime-design.json"
LAYOUT = ROOT / "portfolio-city/data/map-layout.json"


def load(path):
    return json.loads(path.read_text(encoding="utf-8"))


def rect_percent(x, y, width, height, world):
    min_x = world.get("minX", 0)
    min_y = world.get("minY", 0)
    return {
        "left": (x - min_x) / world["width"] * 100,
        "top": (y - min_y) / world["height"] * 100,
        "width": width / world["width"] * 100,
        "height": height / world["height"] * 100,
    }


def close(a, b, eps=1e-5):
    return abs(a - b) <= eps


def main():
    design = load(DESIGN)
    layout = load(LAYOUT)
    world = design["futureWorld"]

    assert design["status"] == "DESIGN_ONLY_NOT_RUNTIME"
    assert world == {
        "chunkWidth": 1024,
        "chunkHeight": 768,
        "minX": -1024,
        "minY": -768,
        "maxX": 4096,
        "maxY": 3072,
        "width": 5120,
        "height": 3840,
    }
    assert world["maxX"] == world["minX"] + world["width"]
    assert world["maxY"] == world["minY"] + world["height"]

    chunks = design["futureChunks"]
    assert len(chunks) == 13
    assert len({item["id"] for item in chunks}) == 13
    for item in chunks:
        column = item["column"]
        row = item["row"]
        rect = item["worldRect"]
        assert rect["x"] == column * world["chunkWidth"]
        assert rect["y"] == row * world["chunkHeight"]
        actual = rect_percent(rect["x"], rect["y"], rect["width"], rect["height"], world)
        expected = item["percentRect"]
        for key in ("left", "top", "width", "height"):
            assert close(actual[key], expected[key]), (item["id"], key, actual[key], expected[key])
        assert 0 <= actual["left"] <= 100
        assert 0 <= actual["top"] <= 100
        assert close(actual["width"], 20)
        assert close(actual["height"], 20)

    placements = {item["projectId"]: item for item in layout["projectPlacements"]}
    samples = {item["projectId"]: item for item in design["projectNormalizationSamples"]}
    assert len(placements) == 18
    assert samples.keys() <= placements.keys()
    for project_id, sample in samples.items():
        placement = placements[project_id]
        assert placement["x"] == sample["x"]
        assert placement["y"] == sample["y"]
        x_pct = (sample["x"] - world["minX"]) / world["width"] * 100
        y_pct = (sample["y"] - world["minY"]) / world["height"] * 100
        assert close(x_pct, sample["xPercent"])
        assert close(y_pct, sample["yPercent"])

    current_world = layout["world"]
    assert {key: current_world[key] for key in ("chunkWidth", "chunkHeight", "minX", "minY", "width", "height")} == {key: world[key] for key in ("chunkWidth", "chunkHeight", "minX", "minY", "width", "height")}

    legacy_world = {"chunkWidth": 1024, "chunkHeight": 768, "width": 3200, "height": 2304}
    region = {"x": 768, "y": 80, "width": 1664, "height": 650}
    old_left = region["x"] / legacy_world["width"] * 100
    old_top = region["y"] / legacy_world["height"] * 100
    normalized = rect_percent(region["x"], region["y"], region["width"], region["height"], legacy_world)
    assert close(old_left, normalized["left"])
    assert close(old_top, normalized["top"])

    print("Negative-origin runtime design contract passed: current 13-chunk world / 18 projects / legacy zero-origin compatibility")


if __name__ == "__main__":
    main()
