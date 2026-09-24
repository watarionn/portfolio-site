from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

from mkpdf_safe.studio import StudioSession


class StudioHistoryTests(unittest.TestCase):
    def _archive(self, root: Path) -> Path:
        archive = root / "history.cbz"
        paths = []
        for i, color in enumerate(("red", "green", "blue", "white"), start=1):
            p = root / f"{i:02d}.png"
            Image.new("RGB", (120, 180), color).save(p)
            paths.append(p)
        with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in paths:
                zf.write(p, p.name)
        return archive

    def test_snapshot_restore_round_trip(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            with StudioSession(self._archive(root)) as session:
                original = session.snapshot()
                session.move(3, 0)
                session.pages[0].rotate(90)
                session.pages[1].included = False
                self.assertNotEqual(session.snapshot(), original)
                session.restore(original)
                self.assertEqual(session.snapshot(), original)

    def test_move_adjacent_group_down_preserves_order(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            with StudioSession(self._archive(root)) as session:
                moved = session.move_indices([0, 1], 1)
                self.assertEqual(moved, [1, 2])
                self.assertEqual(
                    [p.relative_path for p in session.pages],
                    ["03.png", "01.png", "02.png", "04.png"],
                )

    def test_move_noncontiguous_group_up(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            with StudioSession(self._archive(root)) as session:
                moved = session.move_indices([1, 3], -1)
                self.assertEqual(moved, [0, 2])
                self.assertEqual(
                    [p.relative_path for p in session.pages],
                    ["02.png", "01.png", "04.png", "03.png"],
                )


if __name__ == "__main__":
    unittest.main()
