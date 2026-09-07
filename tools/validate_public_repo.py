from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_EXACT = {
    ".env",
    "config.php",
    "user.ini",
    "admin.local.php",
    "config.local.php",
}

FORBIDDEN_PARTS = {
    ".git",
    ".installer",
    "runtime",
    "operator",
}

FORBIDDEN_PREFIXES = (
    "characters/",
    "apps/yorei/schema/",
    "holoca/",
    "holoscope/",
    "shisha/",
    "secret/",
)

YOREI_ROOT = "apps/yorei/"
YOREI_PUBLIC_ROOT = "apps/yorei/public/"
AQUARIUM_ROOT = "apps/aquarium/"
AQUARIUM_PUBLIC_ROOT = "apps/aquarium/public/"

REQUIRED_STAGE1_FILES = {
    "index.html",
    "index-style.css",
    "index-script.js",
    "profile/index.html",
    "tools/anagram/index.html",
    "tools/actress-finder/index.html",
    "tools/cheatsheet/index.html",
    "tools/location-csv-checker/index.html",
    "tools/maze-maker/index.html",
    "tools/pixel-art-maker/index.html",
    "tools/word-generator/index.html",
    "works/dqb2/index.html",
    "works/formula-stratum-world/index.html",
    "works/madori/index.html",
    "works/prime-dot-art/index.html",
    "works/sphere/index.html",
}

REQUIRED_STAGE2_YOREI_FILES = {
    "apps/yorei/public/auth-page.css",
    "apps/yorei/public/auth-page.js",
    "apps/yorei/public/auth.html",
    "apps/yorei/public/auth.js",
    "apps/yorei/public/card-render.js",
    "apps/yorei/public/cards.html",
    "apps/yorei/public/cards.js",
    "apps/yorei/public/common.css",
    "apps/yorei/public/config.js",
    "apps/yorei/public/dictionaries.html",
    "apps/yorei/public/dictionaries.js",
    "apps/yorei/public/edit.html",
    "apps/yorei/public/edit.js",
    "apps/yorei/public/index.html",
    "apps/yorei/public/my-cards.html",
    "apps/yorei/public/my-cards.js",
    "apps/yorei/public/my-dicts.html",
    "apps/yorei/public/my-dicts.js",
    "apps/yorei/public/my.css",
    "apps/yorei/public/nav.js",
    "apps/yorei/public/plaza.css",
    "apps/yorei/public/yorei.css",
    "apps/yorei/public/yorei.html",
    "apps/yorei/public/yorei.js",
}

REQUIRED_STAGE3_AQUARIUM_FILES = {
    "apps/aquarium/public/aquarium.css",
    "apps/aquarium/public/aquarium.js",
    "apps/aquarium/public/aquarium.php",
    "apps/aquarium/public/index.php",
}

TEXT_SUFFIXES = {
    ".html",
    ".htm",
    ".css",
    ".js",
    ".mjs",
    ".json",
    ".md",
    ".txt",
    ".py",
    ".yml",
    ".yaml",
    ".xml",
    ".csv",
    ".tsv",
    ".php",
}

SECRET_PATTERNS = [
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(r"(?i)\b(?:password|passwd|api[_-]?key|access[_-]?token|secret[_-]?key)\b\s*[:=]\s*['\"][^'\"]{8,}['\"]"),
]


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def tracked_paths() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def main() -> None:
    tracked = tracked_paths()
    tracked_rel = {path.relative_to(ROOT).as_posix() for path in tracked}

    missing_stage1 = sorted(REQUIRED_STAGE1_FILES - tracked_rel)
    if missing_stage1:
        fail("missing required Stage 1 files: " + ", ".join(missing_stage1))

    missing_yorei = sorted(REQUIRED_STAGE2_YOREI_FILES - tracked_rel)
    if missing_yorei:
        fail("missing required Stage 2 YOREI files: " + ", ".join(missing_yorei))

    missing_aquarium = sorted(REQUIRED_STAGE3_AQUARIUM_FILES - tracked_rel)
    if missing_aquarium:
        fail("missing required Stage 3 AQUARIUM files: " + ", ".join(missing_aquarium))

    for rel_text in sorted(tracked_rel):
        if rel_text.startswith(FORBIDDEN_PREFIXES):
            fail(f"deferred/private surface is not allowed in Stage 3: {rel_text}")

        if rel_text.startswith(YOREI_ROOT):
            if not rel_text.startswith(YOREI_PUBLIC_ROOT):
                fail(f"non-public YOREI surface is not allowed: {rel_text}")
            if rel_text not in REQUIRED_STAGE2_YOREI_FILES:
                fail(f"unreviewed YOREI public file is not allowed: {rel_text}")

        if rel_text.startswith(AQUARIUM_ROOT):
            if not rel_text.startswith(AQUARIUM_PUBLIC_ROOT):
                fail(f"non-public AQUARIUM surface is not allowed: {rel_text}")
            if rel_text not in REQUIRED_STAGE3_AQUARIUM_FILES:
                fail(f"unreviewed AQUARIUM public file is not allowed: {rel_text}")

    aquarium_php = ROOT / "apps/aquarium/public/aquarium.php"
    aquarium_index = ROOT / "apps/aquarium/public/index.php"
    if aquarium_php.read_bytes() != aquarium_index.read_bytes():
        fail("AQUARIUM index.php must remain byte-identical to aquarium.php")

    aquarium_text = aquarium_php.read_text(encoding="utf-8")
    if "require_once __DIR__ . '/../../config.php';" not in aquarium_text:
        fail("AQUARIUM source must preserve the reviewed private config.php dependency")

    for path in tracked:
        rel = path.relative_to(ROOT)
        parts = set(rel.parts)

        if any(part in FORBIDDEN_PARTS for part in parts):
            fail(f"forbidden tracked path component: {rel}")

        if path.name in FORBIDDEN_EXACT or path.name.startswith(".env."):
            fail(f"forbidden public file: {rel}")

        if path.is_symlink():
            fail(f"symlink is not allowed in public repository: {rel}")

        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue

        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            fail(f"expected UTF-8 text file is not UTF-8: {rel}: {exc}")

        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                fail(f"high-confidence secret-like content detected: {rel}")

    print(f"Public repository boundary validation passed ({len(tracked)} tracked files).")
    print("Stage 3 required surfaces are present; YOREI and AQUARIUM are limited to their reviewed public slices; deferred/private surfaces are absent.")


if __name__ == "__main__":
    main()
