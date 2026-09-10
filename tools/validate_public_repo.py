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
HOLOCA_ROOT = "services/holoca/"
HOLOCA_PUBLIC_ROOT = "services/holoca/public/"
HOLOSCOPE_ROOT = "services/holoscope/"
HOLOSCOPE_PUBLIC_ROOT = "services/holoscope/public/"
EXPECTED_STAGE5_HOLOSCOPE_TREE = "ba9a9051a28382917e87dda6c309c902bd11ea4d"
EXPECTED_STAGE5_HOLOSCOPE_FILE_COUNT = 86
SHISHA_ROOT = "services/shisha/"
SHISHA_PUBLIC_ROOT = "services/shisha/public/"
EXPECTED_STAGE6_SHISHA_TREE = "2b4f36d8c4aeee08c384517e05dda952e3b7724f"
EXPECTED_STAGE6_SHISHA_FILE_COUNT = 9
SECRET_ROOM_ROOT = "apps/secret-room/"
SECRET_ROOM_PUBLIC_ROOT = "apps/secret-room/public/"
EXPECTED_STAGE7_SECRET_TREE = "c778ee30cac4737b1a4dcf0aec65241ece41ea20"
EXPECTED_STAGE7_SECRET_FILE_COUNT = 7

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
    "services/holoca/public/card_search_api.php": "ac4194259e1bfdec98f25ba8a4c904fbd073cb2e",
    "services/holoca/public/holoca.css": "0020d0bf35b18ea9946f7c90ec7db4a0df604002",
    "services/holoca/public/holoca.html": "67f68842b8f3b9915b8f387a7743132e94119b54",
    "services/holoca/public/holoca.js": "0ca68949ebbea99ff676bf764f8d9a8e73c1a575",
    "services/holoca/public/index.html": "67f68842b8f3b9915b8f387a7743132e94119b54",
}

REQUIRED_STAGE6_SHISHA_FILES = {
    "services/shisha/public/.htaccess",
    "services/shisha/public/api/facets.php",
    "services/shisha/public/api/shops.php",
    "services/shisha/public/api/stations.php",
    "services/shisha/public/assets/app.css",
    "services/shisha/public/assets/app.js",
    "services/shisha/public/config.example.php",
    "services/shisha/public/includes/bootstrap.php",
    "services/shisha/public/index.php",
}

EXPECTED_STAGE6_SHISHA_BLOBS = {
    "services/shisha/public/.htaccess": "6408a95cff1909367a920ad45d4619aafc102641",
    "services/shisha/public/api/facets.php": "f44c9653fa0ea444af0063f8798dc18dbde65fe3",
    "services/shisha/public/api/shops.php": "75a58f0ccd33b1f2a38cae1391c8098391d9a5f0",
    "services/shisha/public/api/stations.php": "a8b44997cdcf948d3a2c9f53eff7589ec8ca3199",
    "services/shisha/public/assets/app.css": "61b9bf0eb89486038fb4f021cf3db33cfe4a510e",
    "services/shisha/public/assets/app.js": "155c1fe2d3d79dae11a6c324ff9010ae587e32c0",
    "services/shisha/public/config.example.php": "a45bee891e8ea336b414ab415ddf27b22b4faef8",
    "services/shisha/public/includes/bootstrap.php": "3b2355a4b0f6f3c2a919a0edf42387d6780008d5",
    "services/shisha/public/index.php": "cc4f960a17f3f6bf6aeed0d82ffe3bcaa3eb6527",
}

REQUIRED_STAGE7_SECRET_FILES = {
    "apps/secret-room/public/Hamigaki.png",
    "apps/secret-room/public/Kusarigama.png",
    "apps/secret-room/public/check.php",
    "apps/secret-room/public/index.html",
    "apps/secret-room/public/secret-effects.js",
    "apps/secret-room/public/secret.css",
    "apps/secret-room/public/secret.js",
}

EXPECTED_STAGE7_SECRET_BLOBS = {
    "apps/secret-room/public/Hamigaki.png": "646a28d3c35c8c51ae397d06c7dc03e6a87fcf33",
    "apps/secret-room/public/Kusarigama.png": "97e294dc4306b0da6bf26bfd906c3717350d9002",
    "apps/secret-room/public/check.php": "b37fff8c8e5793cd2b2b896527b5d9d44734de8d",
    "apps/secret-room/public/index.html": "432dcbcbde133db2c8d602f8df7b34af85e29c51",
    "apps/secret-room/public/secret-effects.js": "4810f9ecbdd1704ed3764272756c2ef6d2dcee75",
    "apps/secret-room/public/secret.css": "957e37f1926f8828c2c7bcaaa15beed7fac6a1eb",
    "apps/secret-room/public/secret.js": "99be18f8e3f2ef85b2066e6deab853e039d37f15",
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

    missing_shisha = sorted(REQUIRED_STAGE6_SHISHA_FILES - tracked_rel)
    if missing_shisha:
        fail("missing required Stage 6 SHISHA files: " + ", ".join(missing_shisha))

    missing_secret = sorted(REQUIRED_STAGE7_SECRET_FILES - tracked_rel)
    if missing_secret:
        fail("missing required Stage 7 SECRET files: " + ", ".join(missing_secret))

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

        if rel_text.startswith(SHISHA_ROOT):
            if not rel_text.startswith(SHISHA_PUBLIC_ROOT):
                fail(f"non-public SHISHA surface is not allowed: {rel_text}")
            if rel_text not in REQUIRED_STAGE6_SHISHA_FILES:
                fail(f"unreviewed SHISHA public file is not allowed: {rel_text}")

        if rel_text.startswith(SECRET_ROOM_ROOT):
            if not rel_text.startswith(SECRET_ROOM_PUBLIC_ROOT):
                fail(f"non-public SECRET surface is not allowed: {rel_text}")
            if rel_text not in REQUIRED_STAGE7_SECRET_FILES:
                fail(f"unreviewed SECRET public file is not allowed: {rel_text}")

    actual_holoscope_tree = git_tree_sha("services/holoscope/public")
    if actual_holoscope_tree != EXPECTED_STAGE5_HOLOSCOPE_TREE:
        fail(
            "Stage 5 HoloScope locked-source tree mismatch: "
            f"expected {EXPECTED_STAGE5_HOLOSCOPE_TREE}, got {actual_holoscope_tree}"
        )

    shisha_files = sorted(rel for rel in tracked_rel if rel.startswith(SHISHA_PUBLIC_ROOT))
    if len(shisha_files) != EXPECTED_STAGE6_SHISHA_FILE_COUNT:
        fail(
            "Stage 6 SHISHA public viewer file-count mismatch: "
            f"expected {EXPECTED_STAGE6_SHISHA_FILE_COUNT}, got {len(shisha_files)}"
        )

    actual_shisha_tree = git_tree_sha("services/shisha/public")
    if actual_shisha_tree != EXPECTED_STAGE6_SHISHA_TREE:
        fail(
            "Stage 6 SHISHA locked-source tree mismatch: "
            f"expected {EXPECTED_STAGE6_SHISHA_TREE}, got {actual_shisha_tree}"
        )

    for rel_text, expected_sha in sorted(EXPECTED_STAGE6_SHISHA_BLOBS.items()):
        actual_sha = git_blob_sha(ROOT / rel_text)
        if actual_sha != expected_sha:
            fail(
                f"SHISHA locked-source blob mismatch: {rel_text}: "
                f"expected {expected_sha}, got {actual_sha}"
            )

    secret_files = sorted(rel for rel in tracked_rel if rel.startswith(SECRET_ROOM_PUBLIC_ROOT))
    if len(secret_files) != EXPECTED_STAGE7_SECRET_FILE_COUNT:
        fail(
            "Stage 7 SECRET public entrance file-count mismatch: "
            f"expected {EXPECTED_STAGE7_SECRET_FILE_COUNT}, got {len(secret_files)}"
        )

    actual_secret_tree = git_tree_sha("apps/secret-room/public")
    if actual_secret_tree != EXPECTED_STAGE7_SECRET_TREE:
        fail(
            "Stage 7 SECRET locked-source tree mismatch: "
            f"expected {EXPECTED_STAGE7_SECRET_TREE}, got {actual_secret_tree}"
        )

    for rel_text, expected_sha in sorted(EXPECTED_STAGE7_SECRET_BLOBS.items()):
        actual_sha = git_blob_sha(ROOT / rel_text)
        if actual_sha != expected_sha:
            fail(
                f"SECRET locked-source blob mismatch: {rel_text}: "
                f"expected {expected_sha}, got {actual_sha}"
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
        "$configPath = __DIR__ . '/../../config.php';",
        "$charset = defined('DB_CHARSET')",
        "? (string) DB_CHARSET : 'utf8mb4'",
        "ce.official_id = c.official_id",
        "t.official_id = c.official_id",
        "a.official_id = c.official_id",
        "ce2.official_id = c.official_id",
        "ab.official_id = c.official_id",
        "if (!is_file($configPath))",
        "respond_service_error(503);",
        "'error' => '検索サービスは現在利用できません。',",
        "error_log('HOLOCA card search failed: '",
    )
    for literal in required_api_literals:
        if literal not in holoca_api:
            fail(f"HOLOCA hardened API contract missing: {literal}")
    for stale_join in (
        "ce.card_no = c.card_no", "t.card_no = c.card_no", "a.card_no = c.card_no",
        "ce2.card_no = c.card_no", "ab.card_no = c.card_no",
    ):
        if stale_join in holoca_api:
            fail(f"HOLOCA stale card_no join remains: {stale_join}")

    holoca_js = (ROOT / "services/holoca/public/holoca.js").read_text(encoding="utf-8")
    if "data-card-index" not in holoca_js or "bindSearchResultActions" not in holoca_js:
        fail("HOLOCA search-result event binding hardening is missing")
    if "const cardJson" in holoca_js or "addFromSearch('${cardJson}'" in holoca_js:
        fail("HOLOCA must not embed serialized card JSON in inline event handlers")

    holoca_html_text = holoca_html.read_text(encoding="utf-8")
    holoca_css = (ROOT / "services/holoca/public/holoca.css").read_text(encoding="utf-8")
    for marker in (
        'class="project-intro"', 'id="summary-oshi"', 'id="summary-main"',
        'id="summary-yell"', 'id="deck-health"', 'data-tab="deck"',
        'data-tab="search"', 'aria-hidden="true"',
    ):
        if marker not in holoca_html_text:
            fail(f"HOLOCA Stage 9 presentation marker missing: {marker}")
    for attribute in ("onclick=", "oninput=", "onchange=", "onkeydown=", "onblur=", "onerror="):
        if attribute in holoca_html_text or attribute in holoca_js:
            fail(f"HOLOCA inline event handler remains: {attribute}")
    for marker in (
        "function bindStaticActions()", "function updateDeckHealth()", "function downloadImage()",
        "canvas.toBlob", "aria-current=\"page\"",
        "modal.setAttribute('aria-hidden','false')", "modal.setAttribute('aria-hidden','true')",
    ):
        if marker not in holoca_js:
            fail(f"HOLOCA Stage 9 interaction marker missing: {marker}")
    for marker in ("Stage 9 portfolio framing / HOLOCA Deck Lab", "tbody td::before", ".project-intro-grid"):
        if marker not in holoca_css:
            fail(f"HOLOCA Stage 9 responsive marker missing: {marker}")

    dqb2_html = (ROOT / "works/dqb2/index.html").read_text(encoding="utf-8")
    dqb2_js = (ROOT / "works/dqb2/dqb2.js").read_text(encoding="utf-8")
    dqb2_css = (ROOT / "works/dqb2/dqb2.css").read_text(encoding="utf-8")
    for marker in ('class="project-intro"', 'id="material-count"', 'data-scope="items"', 'id="result-count"'):
        if marker not in dqb2_html:
            fail(f"DQB2 Stage 9 presentation marker missing: {marker}")
    for marker in ("function getUniqueMaterialCount()", "function trapModalFocus(event)", "grid.replaceChildren()"):
        if marker not in dqb2_js:
            fail(f"DQB2 Stage 9 interaction marker missing: {marker}")
    if "innerHTML" in dqb2_js:
        fail("DQB2 must not use HTML-string rendering")
    for marker in (".block-illustration", ".room-grid", "@media (max-width: 560px)"):
        if marker not in dqb2_css:
            fail(f"DQB2 Stage 9 responsive marker missing: {marker}")

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
        "Stage 7 required surfaces are present; YOREI, AQUARIUM, HOLOCA, HoloScope, SHISHA, and the locked "
        "SECRET entrance source are limited to reviewed public slices; protected/private surfaces are absent."
    )


if __name__ == "__main__":
    main()
