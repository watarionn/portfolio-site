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
    "services/shisha/",
    "apps/secret-room/",
)

YOREI_ROOT = "apps/yorei/"
YOREI_PUBLIC_ROOT = "apps/yorei/public/"
AQUARIUM_ROOT = "apps/aquarium/"
AQUARIUM_PUBLIC_ROOT = "apps/aquarium/public/"
HOLOCA_ROOT = "services/holoca/"
HOLOCA_PUBLIC_ROOT = "services/holoca/public/"
HOLOSCOPE_ROOT = "services/holoscope/"
HOLOSCOPE_PUBLIC_ROOT = "services/holoscope/public/"
EXPECTED_STAGE5_HOLOSCOPE_TREE = "ba9a9051a28382917e87dda6c309c902bd11ea4d"
EXPECTED_STAGE5_HOLOSCOPE_FILE_COUNT = 86

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

REQUIRED_STAGE4_HOLOCA_FILES = {
    "services/holoca/public/card_search_api.php",
    "services/holoca/public/holoca.css",
    "services/holoca/public/holoca.html",
    "services/holoca/public/holoca.js",
    "services/holoca/public/index.html",
}

EXPECTED_STAGE4_HOLOCA_BLOBS = {
    "services/holoca/public/card_search_api.php": "67ec6d3b666e5bda63471f594a0960bb733ac01a",
    "services/holoca/public/holoca.css": "bd62c0d8f94920c00378bee17a71750c940e1907",
    "services/holoca/public/holoca.html": "a1781c59567445e6840f4725ab3ea628484144fc",
    "services/holoca/public/holoca.js": "4679d51361f53eb9525bc6587b44f8176945e730",
    "services/holoca/public/index.html": "a1781c59567445e6840f4725ab3ea628484144fc",
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


def git_blob_sha(path: Path) -> str:
    result = subprocess.run(
        ["git", "hash-object", path.relative_to(ROOT).as_posix()],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def git_tree_sha(rel_path: str) -> str:
    result = subprocess.run(
        ["git", "rev-parse", f"HEAD:{rel_path}"],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


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

    missing_holoca = sorted(REQUIRED_STAGE4_HOLOCA_FILES - tracked_rel)
    if missing_holoca:
        fail("missing required Stage 4 HOLOCA files: " + ", ".join(missing_holoca))

    holoscope_files = sorted(rel for rel in tracked_rel if rel.startswith(HOLOSCOPE_PUBLIC_ROOT))
    if len(holoscope_files) != EXPECTED_STAGE5_HOLOSCOPE_FILE_COUNT:
        fail(
            "Stage 5 HoloScope public shell file-count mismatch: "
            f"expected {EXPECTED_STAGE5_HOLOSCOPE_FILE_COUNT}, got {len(holoscope_files)}"
        )

    for rel_text in sorted(tracked_rel):
        if rel_text.startswith(FORBIDDEN_PREFIXES):
            fail(f"deferred/private surface is not allowed in Stage 5: {rel_text}")

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

        if rel_text.startswith(HOLOCA_ROOT):
            if not rel_text.startswith(HOLOCA_PUBLIC_ROOT):
                fail(f"non-public HOLOCA surface is not allowed: {rel_text}")
            if rel_text not in REQUIRED_STAGE4_HOLOCA_FILES:
                fail(f"unreviewed HOLOCA public file is not allowed: {rel_text}")

        if rel_text.startswith(HOLOSCOPE_ROOT):
            if not rel_text.startswith(HOLOSCOPE_PUBLIC_ROOT):
                fail(f"non-public HoloScope surface is not allowed: {rel_text}")

    actual_holoscope_tree = git_tree_sha("services/holoscope/public")
    if actual_holoscope_tree != EXPECTED_STAGE5_HOLOSCOPE_TREE:
        fail(
            "Stage 5 HoloScope locked-source tree mismatch: "
            f"expected {EXPECTED_STAGE5_HOLOSCOPE_TREE}, got {actual_holoscope_tree}"
        )

    aquarium_php = ROOT / "apps/aquarium/public/aquarium.php"
    aquarium_index = ROOT / "apps/aquarium/public/index.php"
    if aquarium_php.read_bytes() != aquarium_index.read_bytes():
        fail("AQUARIUM index.php must remain byte-identical to aquarium.php")

    aquarium_text = aquarium_php.read_text(encoding="utf-8")
    if "require_once __DIR__ . '/../../config.php';" not in aquarium_text:
        fail("AQUARIUM source must preserve the reviewed private config.php dependency")

    holoca_html = ROOT / "services/holoca/public/holoca.html"
    holoca_index = ROOT / "services/holoca/public/index.html"
    if holoca_html.read_bytes() != holoca_index.read_bytes():
        fail("HOLOCA index.html must remain byte-identical to holoca.html")

    for rel_text, expected_sha in sorted(EXPECTED_STAGE4_HOLOCA_BLOBS.items()):
        actual_sha = git_blob_sha(ROOT / rel_text)
        if actual_sha != expected_sha:
            fail(
                f"HOLOCA locked-source blob mismatch: {rel_text}: "
                f"expected {expected_sha}, got {actual_sha}"
            )

    holoca_api = (ROOT / "services/holoca/public/card_search_api.php").read_text(encoding="utf-8")
    required_api_literals = (
        "$configPath = __DIR__ . '/../config.php';",
        "if (!is_file($configPath))",
        "respond_service_error(503);",
        "'error' => '検索サービスは現在利用できません。',",
        "error_log('HOLOCA card search failed: '",
    )
    for literal in required_api_literals:
        if literal not in holoca_api:
            fail(f"HOLOCA hardened API contract missing: {literal}")

    holoca_js = (ROOT / "services/holoca/public/holoca.js").read_text(encoding="utf-8")
    if "data-card-index" not in holoca_js or "bindSearchResultActions" not in holoca_js:
        fail("HOLOCA search-result event binding hardening is missing")
    if "const cardJson" in holoca_js or "addFromSearch('${cardJson}'" in holoca_js:
        fail("HOLOCA must not embed serialized card JSON in inline event handlers")

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
    print(
        "Stage 5 required surfaces are present; YOREI, AQUARIUM, HOLOCA, and the locked "
        "HoloScope public shell are limited to reviewed public slices; deferred/private surfaces are absent."
    )


if __name__ == "__main__":
    main()
