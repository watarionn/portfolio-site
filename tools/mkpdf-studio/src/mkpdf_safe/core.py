from __future__ import annotations

import os
import re
import shutil
import stat
import subprocess
import tempfile
import unicodedata
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterable

from PIL import Image, ImageOps


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}
ZIP_EXTENSIONS = {".zip", ".cbz"}
SEVEN_ZIP_EXTENSIONS = {".7z", ".rar", ".cbr", ".cb7"}


class ArchiveError(RuntimeError):
    pass


@dataclass(frozen=True)
class Limits:
    max_archive_bytes: int = 4 * 1024**3
    max_entries: int = 20_000
    max_unpacked_bytes: int = 16 * 1024**3
    max_entry_bytes: int = 512 * 1024**2
    max_compression_ratio: float = 250.0
    max_images: int = 5_000
    max_image_pixels: int = 80_000_000
    max_total_pixels: int = 500_000_000


@dataclass(frozen=True)
class ArchiveEntry:
    name: str
    size: int
    packed_size: int


@dataclass(frozen=True)
class ArchiveInspection:
    archive: Path
    format: str
    entries: tuple[ArchiveEntry, ...]
    total_unpacked_bytes: int


@dataclass(frozen=True)
class ConversionResult:
    archive: Path
    output: Path
    pages: int
    image_paths: tuple[str, ...]
    output_bytes: int


def _normalized_text(value: str) -> str:
    return unicodedata.normalize("NFC", value)


def natural_text_key(value: str) -> tuple:
    text = _normalized_text(value).casefold()
    parts = re.split(r"(\d+)", text)
    return tuple((0, int(p)) if p.isdigit() else (1, p) for p in parts if p)


def natural_path_key(path: Path) -> tuple:
    return tuple(natural_text_key(part) for part in path.parts)


def _safe_member_path(name: str) -> PurePosixPath:
    if "\x00" in name:
        raise ArchiveError("Archive entry contains NUL byte")
    normalized = name.replace("\\", "/")
    if normalized.startswith("/") or normalized.startswith("//"):
        raise ArchiveError(f"Absolute archive path rejected: {name}")
    if re.match(r"^[A-Za-z]:", normalized):
        raise ArchiveError(f"Drive-qualified archive path rejected: {name}")
    p = PurePosixPath(normalized)
    if any(part == ".." for part in p.parts):
        raise ArchiveError(f"Path traversal rejected: {name}")
    if not p.parts or all(part in ("", ".") for part in p.parts):
        raise ArchiveError(f"Invalid archive path: {name}")
    return p


def _check_archive_size(archive: Path, limits: Limits) -> None:
    if not archive.is_file():
        raise ArchiveError(f"Archive not found: {archive}")
    size = archive.stat().st_size
    if size > limits.max_archive_bytes:
        raise ArchiveError(f"Archive exceeds size limit: {size} bytes")


def _check_entry_limits(
    entries: Iterable[ArchiveEntry],
    limits: Limits,
    *,
    allow_zero_packed: bool = False,
) -> tuple[ArchiveEntry, ...]:
    checked: list[ArchiveEntry] = []
    total = 0
    for entry in entries:
        if len(checked) >= limits.max_entries:
            raise ArchiveError("Archive entry count exceeds limit")
        _safe_member_path(entry.name)
        if entry.size < 0 or entry.packed_size < 0:
            raise ArchiveError(f"Negative archive size metadata: {entry.name}")
        if entry.size > limits.max_entry_bytes:
            raise ArchiveError(f"Entry exceeds size limit: {entry.name}")
        if entry.size > 0 and not allow_zero_packed:
            if entry.packed_size == 0:
                raise ArchiveError(f"Suspicious zero packed size: {entry.name}")
            ratio = entry.size / max(entry.packed_size, 1)
            if ratio > limits.max_compression_ratio:
                raise ArchiveError(f"Compression ratio exceeds limit: {entry.name}")
        total += entry.size
        if total > limits.max_unpacked_bytes:
            raise ArchiveError("Archive unpacked size exceeds limit")
        checked.append(entry)
    if not checked:
        raise ArchiveError("Archive has no files")
    return tuple(checked)


def _zip_is_symlink(info: zipfile.ZipInfo) -> bool:
    mode = (info.external_attr >> 16) & 0xFFFF
    return stat.S_ISLNK(mode)


def _inspect_zip(archive: Path, limits: Limits) -> ArchiveInspection:
    entries: list[ArchiveEntry] = []
    try:
        with zipfile.ZipFile(archive) as zf:
            for info in zf.infolist():
                if info.is_dir():
                    continue
                if _zip_is_symlink(info):
                    raise ArchiveError(f"Symbolic link rejected: {info.filename}")
                entries.append(ArchiveEntry(info.filename, info.file_size, info.compress_size))
    except zipfile.BadZipFile as exc:
        raise ArchiveError(f"Invalid ZIP archive: {archive}") from exc
    checked = _check_entry_limits(entries, limits)
    return ArchiveInspection(archive, "zip", checked, sum(e.size for e in checked))


def _parse_7z_slt(text: str, archive: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    current: dict[str, str] = {}
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            if current:
                records.append(current)
                current = {}
            continue
        if " = " in line:
            key, value = line.split(" = ", 1)
            current[key] = value
    if current:
        records.append(current)
    archive_norm = str(archive.resolve()).casefold()
    out: list[dict[str, str]] = []
    for rec in records:
        p = rec.get("Path")
        if not p:
            continue
        try:
            same_archive = str(Path(p).resolve()).casefold() == archive_norm
        except OSError:
            same_archive = False
        if same_archive and "Type" in rec:
            continue
        out.append(rec)
    return out


def _inspect_7z(archive: Path, limits: Limits, seven_zip: Path) -> ArchiveInspection:
    if not seven_zip.is_file():
        raise ArchiveError(f"7-Zip not found: {seven_zip}")
    proc = subprocess.run(
        [str(seven_zip), "l", "-slt", "-ba", str(archive)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=60,
    )
    if proc.returncode != 0:
        raise ArchiveError(f"7-Zip listing failed with code {proc.returncode}")
    entries: list[ArchiveEntry] = []
    for rec in _parse_7z_slt(proc.stdout, archive):
        if rec.get("Folder") == "+":
            continue
        if rec.get("Encrypted") == "+":
            raise ArchiveError(f"Encrypted entry rejected: {rec.get('Path','?')}")
        if rec.get("Symbolic Link") or rec.get("Hard Link"):
            raise ArchiveError(f"Link entry rejected: {rec.get('Path','?')}")
        attrs = rec.get("Attributes", "")
        if "L" in attrs.upper():
            raise ArchiveError(f"Link-like entry rejected: {rec.get('Path','?')}")
        name = rec.get("Path", "")
        try:
            size = int(rec.get("Size", "0") or 0)
            packed = int(rec.get("Packed Size", "0") or 0)
        except ValueError as exc:
            raise ArchiveError(f"Invalid size metadata: {name}") from exc
        entries.append(ArchiveEntry(name, size, packed))
    checked = _check_entry_limits(entries, limits, allow_zero_packed=True)
    total_unpacked = sum(e.size for e in checked)
    archive_bytes = max(archive.stat().st_size, 1)
    if total_unpacked / archive_bytes > limits.max_compression_ratio:
        raise ArchiveError("Archive compression ratio exceeds limit")
    return ArchiveInspection(archive, "7z", checked, total_unpacked)


def inspect_archive(
    archive: Path | str,
    limits: Limits | None = None,
    seven_zip: Path | str = r"C:\Program Files\7-Zip\7z.exe",
) -> ArchiveInspection:
    archive = Path(archive)
    limits = limits or Limits()
    _check_archive_size(archive, limits)
    ext = archive.suffix.lower()
    if ext in ZIP_EXTENSIONS:
        return _inspect_zip(archive, limits)
    if ext in SEVEN_ZIP_EXTENSIONS:
        return _inspect_7z(archive, limits, Path(seven_zip))
    raise ArchiveError(f"Unsupported archive extension: {ext}")


def _target_under(root: Path, member_name: str) -> Path:
    rel = _safe_member_path(member_name)
    target = root.joinpath(*rel.parts)
    root_resolved = root.resolve()
    target_parent = target.parent.resolve()
    if target_parent != root_resolved and root_resolved not in target_parent.parents:
        raise ArchiveError(f"Extraction target escapes root: {member_name}")
    return target


def _extract_zip(archive: Path, inspection: ArchiveInspection, destination: Path) -> None:
    allowed = {e.name for e in inspection.entries}
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            if info.filename not in allowed:
                raise ArchiveError(f"Unexpected ZIP entry during extraction: {info.filename}")
            target = _target_under(destination, info.filename)
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info, "r") as src, target.open("wb") as dst:
                shutil.copyfileobj(src, dst, length=1024 * 1024)


def _validate_extracted_tree(root: Path, limits: Limits) -> None:
    total = 0
    root_resolved = root.resolve()
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ArchiveError(f"Extracted symbolic link rejected: {path}")
        resolved = path.resolve()
        if resolved != root_resolved and root_resolved not in resolved.parents:
            raise ArchiveError(f"Extracted path escapes work directory: {path}")
        if path.is_file():
            size = path.stat().st_size
            if size > limits.max_entry_bytes:
                raise ArchiveError(f"Extracted file exceeds limit: {path}")
            total += size
            if total > limits.max_unpacked_bytes:
                raise ArchiveError("Extracted data exceeds total size limit")


def _extract_7z(archive: Path, destination: Path, seven_zip: Path, limits: Limits) -> None:
    proc = subprocess.run(
        [str(seven_zip), "x", "-y", "-bb0", f"-o{destination}", str(archive)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=600,
    )
    if proc.returncode != 0:
        raise ArchiveError(f"7-Zip extraction failed with code {proc.returncode}")
    _validate_extracted_tree(destination, limits)


def collect_images(root: Path, limits: Limits) -> tuple[Path, ...]:
    images = [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]
    images.sort(key=lambda p: natural_path_key(p.relative_to(root)))
    if not images:
        raise ArchiveError("No supported images found in archive")
    if len(images) > limits.max_images:
        raise ArchiveError("Image count exceeds limit")
    total_pixels = 0
    checked: list[Path] = []
    for path in images:
        try:
            with Image.open(path) as im:
                width, height = im.size
                pixels = width * height
                if width <= 0 or height <= 0:
                    raise ArchiveError(f"Invalid image dimensions: {path}")
                if pixels > limits.max_image_pixels:
                    raise ArchiveError(f"Image pixel count exceeds limit: {path}")
                total_pixels += pixels
                if total_pixels > limits.max_total_pixels:
                    raise ArchiveError("Total image pixel count exceeds limit")
                im.verify()
        except ArchiveError:
            raise
        except Exception as exc:
            raise ArchiveError(f"Invalid image: {path}") from exc
        checked.append(path)
    return tuple(checked)


def _flatten_to_rgb(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode == "RGB":
        return image.copy()
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        bg = Image.new("RGB", rgba.size, "white")
        bg.paste(rgba, mask=rgba.getchannel("A"))
        return bg
    return image.convert("RGB")


def _build_pdf(images: tuple[Path, ...], output: Path, work: Path) -> None:
    pages_dir = work / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    page_files: list[Path] = []
    for idx, src in enumerate(images, start=1):
        target = pages_dir / f"{idx:06d}.jpg"
        with Image.open(src) as im:
            rgb = _flatten_to_rgb(im)
            try:
                rgb.save(target, "JPEG", quality=95, optimize=True, subsampling=0)
            finally:
                rgb.close()
        page_files.append(target)
    opened = [Image.open(p) for p in page_files]
    try:
        first, rest = opened[0], opened[1:]
        first.save(output, "PDF", save_all=True, append_images=rest, resolution=100.0)
    finally:
        for im in opened:
            im.close()


def verify_generated_pdf(path: Path, expected_pages: int) -> int:
    if not path.is_file():
        raise ArchiveError("PDF output was not created")
    size = path.stat().st_size
    if size <= 1024:
        raise ArchiveError("PDF output is unexpectedly small")
    data = path.read_bytes()
    if not data.startswith(b"%PDF-"):
        raise ArchiveError("PDF header missing")
    if b"%%EOF" not in data[-2048:]:
        raise ArchiveError("PDF EOF marker missing")
    pages = len(re.findall(rb"/Type\s*/Page\b", data))
    if pages != expected_pages:
        raise ArchiveError(f"PDF page count mismatch: expected {expected_pages}, got {pages}")
    return pages
def convert_archive(
    archive: Path | str,
    output: Path | str | None = None,
    limits: Limits | None = None,
    seven_zip: Path | str = r"C:\Program Files\7-Zip\7z.exe",
    overwrite: bool = False,
) -> ConversionResult:
    archive = Path(archive).resolve()
    limits = limits or Limits()
    inspection = inspect_archive(archive, limits, seven_zip)
    output = Path(output).resolve() if output else archive.with_suffix(".pdf")
    if output.exists() and not overwrite:
        raise ArchiveError(f"Output already exists: {output}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temp_output = output.with_name(f".{output.name}.{uuid.uuid4().hex}.part")
    try:
        with tempfile.TemporaryDirectory(prefix="mkpdf-safe-") as td:
            work = Path(td)
            extracted = work / "extracted"
            extracted.mkdir()
            if inspection.format == "zip":
                _extract_zip(archive, inspection, extracted)
                _validate_extracted_tree(extracted, limits)
            else:
                _extract_7z(archive, extracted, Path(seven_zip), limits)
            images = collect_images(extracted, limits)
            _build_pdf(images, temp_output, work)
            pages = verify_generated_pdf(temp_output, len(images))
            os.replace(temp_output, output)
            rels = tuple(p.relative_to(extracted).as_posix() for p in images)
    finally:
        temp_output.unlink(missing_ok=True)
    return ConversionResult(archive, output, pages, rels, output.stat().st_size)
