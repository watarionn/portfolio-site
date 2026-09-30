#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw, features

import portfolio_asset_pipeline as pipeline


class PortfolioAssetPipelineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        (self.repo / "assets").mkdir()

        background = Image.new("RGB", (400, 300), (220, 210, 190))
        background.save(self.repo / "assets" / "background.png")

        overlay = Image.new("RGBA", (100, 80), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        draw.rectangle((10, 8, 89, 79), fill=(30, 90, 120, 255))
        overlay.save(self.repo / "assets" / "overlay.png")

        source = Image.new("RGB", (400, 300), (90, 130, 160))
        source.save(self.repo / "assets" / "source.png")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_metadata_and_hash(self) -> None:
        path = self.repo / "assets" / "source.png"
        data = pipeline.image_metadata(path)
        self.assertEqual((data["width"], data["height"]), (400, 300))
        self.assertEqual(data["decodedRgbaBytes"], 400 * 300 * 4)
        self.assertEqual(data["sha256"], pipeline.sha256_file(path))

    @unittest.skipUnless(features.check("webp"), "Pillow WebP support is required")
    def test_derivatives_and_validation(self) -> None:
        config = {
            "schemaVersion": 1,
            "job": "derivatives",
            "id": "test-derivatives",
            "source": {
                "type": "file",
                "path": "assets/source.png",
                "expectedSize": [400, 300],
            },
            "filenamePrefix": "sample",
            "derivatives": [
                {"format": "webp", "quality": 80, "lossless": False, "sizes": [[200, 150], [100, 75]]}
            ],
        }
        output = self.root / "derivatives"
        manifest = pipeline.run_derivatives(config, self.repo, output)
        manifest_path = pipeline.write_json(output / "manifest.json", manifest)

        self.assertEqual(len(manifest["outputs"]), 2)
        self.assertEqual(manifest["outputs"][0]["decodedRgbaBytes"], 200 * 150 * 4)
        result = pipeline.validate_manifest(manifest_path, output)
        self.assertTrue(result["pass"], result["errors"])

    @unittest.skipUnless(features.check("webp"), "Pillow WebP support is required")
    def test_composite_hotspot_and_metadata_validation(self) -> None:
        config = {
            "schemaVersion": 1,
            "job": "composite",
            "id": "test-scene",
            "canvas": {"width": 400, "height": 300},
            "background": {
                "type": "file",
                "path": "assets/background.png",
                "expectedSize": [400, 300],
            },
            "layers": [
                {
                    "id": "demo",
                    "source": {
                        "type": "file",
                        "path": "assets/overlay.png",
                        "expectedSize": [100, 80],
                    },
                    "placement": {
                        "anchor": "bottom-center",
                        "xFraction": 0.5,
                        "yFraction": 0.8,
                        "widthFraction": 0.25,
                        "rotationDegrees": 0,
                    },
                    "hotspot": {"id": "demo-project", "paddingPx": 5},
                }
            ],
            "output": {
                "file": "scene.webp",
                "format": "webp",
                "quality": 80,
                "lossless": True,
            },
        }
        output = self.root / "composite"
        output.mkdir()
        manifest = pipeline.run_composite(config, self.repo, output)
        manifest_path = pipeline.write_json(output / "manifest.json", manifest)

        self.assertEqual(len(manifest["hotspots"]), 1)
        hotspot = manifest["hotspots"][0]
        self.assertEqual(hotspot["id"], "demo-project")
        self.assertGreater(pipeline.polygon_area(hotspot["polygon"]), 1)

        metadata = {"projects": [{"id": "demo-project"}]}
        metadata_path = self.root / "projects.json"
        pipeline.write_json(metadata_path, metadata)
        result = pipeline.validate_manifest(manifest_path, output, metadata_path)
        self.assertTrue(result["pass"], result["errors"])

        bad_metadata_path = self.root / "bad-projects.json"
        pipeline.write_json(bad_metadata_path, {"projects": [{"id": "other"}]})
        bad_result = pipeline.validate_manifest(manifest_path, output, bad_metadata_path)
        self.assertFalse(bad_result["pass"])
        self.assertTrue(any("missing from metadata" in item for item in bad_result["errors"]))

    def test_package(self) -> None:
        (self.repo / "a.txt").write_text("A\n", encoding="utf-8")
        (self.repo / "nested").mkdir()
        (self.repo / "nested" / "b.txt").write_text("B\n", encoding="utf-8")
        config = {
            "schemaVersion": 1,
            "job": "package",
            "id": "test-package",
            "files": ["a.txt", "nested/b.txt"],
        }
        config_path = self.root / "package.json"
        pipeline.write_json(config_path, config)
        output = self.root / "package-out"
        manifest_path = pipeline.build_package(config_path, self.repo, output)
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        self.assertEqual(manifest["totalFiles"], 2)
        self.assertTrue((output / "a.txt").is_file())
        self.assertTrue((output / "nested" / "b.txt").is_file())
        self.assertEqual(
            manifest["files"][0]["sha256"],
            pipeline.sha256_file(output / manifest["files"][0]["path"]),
        )


if __name__ == "__main__":
    unittest.main()
