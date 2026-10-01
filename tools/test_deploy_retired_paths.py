from __future__ import annotations

import ftplib
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts" / "deploy_production.py"
spec = importlib.util.spec_from_file_location("deploy_production", MODULE_PATH)
deploy = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(deploy)


class FakeFTP:
    def __init__(self, listings: dict[str, list[str]], directories: set[str]):
        self.listings = listings
        self.directories = directories
        self.deleted: list[str] = []
        self.removed: list[str] = []
        self.listed: list[str] = []

    def nlst(self, path: str) -> list[str]:
        self.listed.append(path)
        if path not in self.listings:
            raise ftplib.error_perm("550 no such file")
        return list(self.listings[path])

    def delete(self, path: str) -> None:
        if path in self.directories:
            raise ftplib.error_perm(f"550 {path}: Is a directory")
        self.deleted.append(path)

    def rmd(self, path: str) -> None:
        self.removed.append(path)


class RetiredPathDeletionTests(unittest.TestCase):
    def test_dot_entries_never_escape_retired_root(self) -> None:
        root = "/site/public_html/AI_CREATION_WORKBENCH"
        nested = root + "/nested"
        ftp = FakeFTP(
            {
                root: [root + "/.", root + "/..", root + "/index.html", nested],
                nested: [nested + "/.", nested + "/..", nested + "/app.js"],
            },
            {root, nested},
        )

        deploy.remove_remote_tree(ftp, root)

        self.assertEqual(
            ftp.deleted,
            [root + "/index.html", nested + "/app.js"],
        )
        self.assertEqual(ftp.removed, [nested, root])
        self.assertTrue(all(deploy.remote_path_within(path, root) for path in ftp.listed))
        self.assertNotIn("/site/public_html", ftp.listed)
        self.assertNotIn("/site", ftp.listed)
        self.assertNotIn("/", ftp.listed)

    def test_listing_outside_retired_root_is_rejected(self) -> None:
        root = "/site/public_html/AI_CREATION_WORKBENCH"
        outside = "/site/public_html/prompt-studio"
        ftp = FakeFTP(
            {root: [root + "/.", root + "/..", outside]},
            {root, outside},
        )

        with self.assertRaisesRegex(RuntimeError, "escaped retired root"):
            deploy.remove_remote_tree(ftp, root)

        self.assertEqual(ftp.deleted, [])
        self.assertEqual(ftp.removed, [])


if __name__ == "__main__":
    unittest.main()
