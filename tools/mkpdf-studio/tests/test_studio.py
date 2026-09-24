from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

from mkpdf_safe.core import ArchiveError
from mkpdf_safe.studio import StudioSession


class StudioSessionTests(unittest.TestCase):
    def _archive(self, root: Path) -> Path:
        source = root / "studio.cbz"
        files = []
        for name, color, size in [
            ("01.png", "red", (300, 420)),
            ("02.png", "green", (420, 300)),
            ("03.png", "blue", (300, 420)),
        ]:
            p = root / name
            Image.new("RGB", size, color).save(p)
            files.append(p)
        with zipfile.ZipFile(source, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in files:
                zf.write(p, p.name)
        return source

    def test_reorder_rotate_exclude_build(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = self._archive(root)
            output = root / "edited.pdf"
            with StudioSession(archive) as session:
                session.move(2, 0)
                session.pages[0].rotate(90)
                session.pages[1].included = False
                result = session.build(output, quality=88, page_size="a4-portrait")
                self.assertEqual(result.pages, 2)
                self.assertEqual(result.image_paths, ("03.png", "02.png"))
                self.assertTrue(archive.exists())
                self.assertTrue(output.exists())
                self.assertGreater(result.output_bytes, 1024)

    def test_thumbnail_reflects_rotation(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = self._archive(root)
            with StudioSession(archive) as session:
                page = session.pages[1]
                before = session.thumbnail(page, (500, 500)).size
                page.rotate(90)
                after = session.thumbnail(page, (500, 500)).size
                self.assertEqual(before, (420, 300))
                self.assertEqual(after, (300, 420))

    def test_no_included_pages_is_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = self._archive(root)
            with StudioSession(archive) as session:
                for page in session.pages:
                    page.included = False
                with self.assertRaises(ArchiveError):
                    session.build(root / "empty.pdf")

    def test_quality_and_page_size_validation(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = self._archive(root)
            with StudioSession(archive) as session:
                with self.assertRaises(ArchiveError):
                    session.build(root / "q.pdf", quality=20)
                with self.assertRaises(ArchiveError):
                    session.build(root / "size.pdf", page_size="letter")

    def test_existing_output_is_protected(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            archive = self._archive(root)
            output = root / "keep.pdf"
            output.write_bytes(b"keep")
            with StudioSession(archive) as session:
                with self.assertRaises(ArchiveError):
                    session.build(output)
            self.assertEqual(output.read_bytes(), b"keep")


if __name__ == "__main__":
    unittest.main()
