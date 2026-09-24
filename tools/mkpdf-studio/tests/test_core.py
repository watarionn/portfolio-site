from __future__ import annotations

import stat
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

from mkpdf_safe.core import ArchiveError, Limits, convert_archive, inspect_archive, natural_path_key


class MkPdfSafeTests(unittest.TestCase):
    def test_natural_path_sort_keeps_folder_order(self):
        items = [Path("ch1/10.jpg"), Path("ch2/1.jpg"), Path("ch1/2.jpg")]
        ordered = sorted(items, key=natural_path_key)
        self.assertEqual(ordered, [Path("ch1/2.jpg"), Path("ch1/10.jpg"), Path("ch2/1.jpg")])

    def test_traversal_is_rejected_before_extraction(self):
        with tempfile.TemporaryDirectory() as td:
            archive = Path(td) / "bad.zip"
            with zipfile.ZipFile(archive, "w") as zf:
                zf.writestr("../escape.jpg", b"x" * 20)
            with self.assertRaises(ArchiveError):
                inspect_archive(archive)

    def test_zip_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            archive = Path(td) / "link.zip"
            info = zipfile.ZipInfo("page.jpg")
            info.create_system = 3
            info.external_attr = (stat.S_IFLNK | 0o777) << 16
            with zipfile.ZipFile(archive, "w") as zf:
                zf.writestr(info, "target.jpg")
            with self.assertRaises(ArchiveError):
                inspect_archive(archive)

    def test_unpacked_limit_is_enforced(self):
        with tempfile.TemporaryDirectory() as td:
            archive = Path(td) / "large.zip"
            with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_STORED) as zf:
                zf.writestr("page.jpg", b"x" * 2048)
            limits = Limits(max_unpacked_bytes=1024)
            with self.assertRaises(ArchiveError):
                inspect_archive(archive, limits)

    def test_conversion_preserves_original_and_verifies_pages(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source = root / "book.cbz"
            output = root / "book.pdf"
            images = []
            for rel, color in [("ch1/10.png", "red"), ("ch1/2.png", "blue")]:
                path = root / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.new("RGB", (320, 240), color).save(path)
                images.append(path)
            with zipfile.ZipFile(source, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                for path in images:
                    zf.write(path, path.relative_to(root).as_posix())
            result = convert_archive(source, output)
            self.assertTrue(source.exists())
            self.assertTrue(output.exists())
            self.assertEqual(result.pages, 2)
            self.assertEqual(result.image_paths, ("ch1/2.png", "ch1/10.png"))
            self.assertGreater(result.output_bytes, 1024)

    def test_existing_output_requires_overwrite_flag(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = root / "one.zip"
            output = root / "one.pdf"
            img = root / "1.png"
            Image.new("RGB", (100, 100), "white").save(img)
            with zipfile.ZipFile(archive, "w") as zf:
                zf.write(img, "1.png")
            output.write_bytes(b"keep")
            with self.assertRaises(ArchiveError):
                convert_archive(archive, output)
            self.assertEqual(output.read_bytes(), b"keep")


if __name__ == "__main__":
    unittest.main()
