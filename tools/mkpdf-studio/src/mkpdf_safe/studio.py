from __future__ import annotations

import os
import tempfile
import uuid
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

from .core import (
    ArchiveError,
    ArchiveInspection,
    ConversionResult,
    Limits,
    _extract_7z,
    _extract_zip,
    _flatten_to_rgb,
    _validate_extracted_tree,
    collect_images,
    inspect_archive,
    verify_generated_pdf,
)

PAGE_SIZES = {
    "original": None,
    "a4-portrait": (1240, 1754),
    "a4-landscape": (1754, 1240),
}


@dataclass
class PageSpec:
    source: Path
    relative_path: str
    rotation: int = 0
    included: bool = True

    def rotate(self, degrees: int) -> None:
        self.rotation = (self.rotation + degrees) % 360


class StudioSession:
    def __init__(
        self,
        archive: Path | str,
        limits: Limits | None = None,
        seven_zip: Path | str = r"C:\Program Files\7-Zip\7z.exe",
    ) -> None:
        self.archive = Path(archive).resolve()
        self.limits = limits or Limits()
        self.seven_zip = Path(seven_zip)
        self.inspection: ArchiveInspection = inspect_archive(
            self.archive, self.limits, self.seven_zip
        )
        self._temp = tempfile.TemporaryDirectory(prefix="mkpdf-studio-")
        self.work = Path(self._temp.name)
        self.extracted = self.work / "extracted"
        self.extracted.mkdir()
        try:
            if self.inspection.format == "zip":
                _extract_zip(self.archive, self.inspection, self.extracted)
                _validate_extracted_tree(self.extracted, self.limits)
            else:
                _extract_7z(self.archive, self.extracted, self.seven_zip, self.limits)
            images = collect_images(self.extracted, self.limits)
            self.pages = [
                PageSpec(path, path.relative_to(self.extracted).as_posix())
                for path in images
            ]
        except Exception:
            self.close()
            raise

    def close(self) -> None:
        temp = getattr(self, "_temp", None)
        if temp is not None:
            temp.cleanup()
            self._temp = None

    def __enter__(self) -> "StudioSession":
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    @property
    def included_pages(self) -> list[PageSpec]:
        return [p for p in self.pages if p.included]

    def snapshot(self) -> tuple[tuple[str, int, bool], ...]:
        return tuple(
            (page.relative_path, page.rotation, page.included)
            for page in self.pages
        )

    def restore(self, snapshot: tuple[tuple[str, int, bool], ...]) -> None:
        current = {page.relative_path: page for page in self.pages}
        if set(current) != {item[0] for item in snapshot}:
            raise ArchiveError("Snapshot does not match the current archive")
        restored: list[PageSpec] = []
        for relative_path, rotation, included in snapshot:
            page = current[relative_path]
            page.rotation = rotation % 360
            page.included = bool(included)
            restored.append(page)
        self.pages = restored

    def move_indices(self, indices: list[int], delta: int) -> list[int]:
        selected = sorted(set(i for i in indices if 0 <= i < len(self.pages)))
        if not selected or delta == 0:
            return selected
        selected_set = set(selected)
        if delta < 0:
            for idx in selected:
                if idx == 0 or idx - 1 in selected_set:
                    continue
                self.pages[idx - 1], self.pages[idx] = self.pages[idx], self.pages[idx - 1]
                selected_set.remove(idx)
                selected_set.add(idx - 1)
            return sorted(selected_set)
        for idx in reversed(selected):
            if idx == len(self.pages) - 1 or idx + 1 in selected_set:
                continue
            self.pages[idx + 1], self.pages[idx] = self.pages[idx], self.pages[idx + 1]
            selected_set.remove(idx)
            selected_set.add(idx + 1)
        return sorted(selected_set)

    def move(self, old_index: int, new_index: int) -> None:
        if old_index == new_index:
            return
        page = self.pages.pop(old_index)
        self.pages.insert(max(0, min(new_index, len(self.pages))), page)

    def thumbnail(self, page: PageSpec, size: tuple[int, int] = (140, 180)) -> Image.Image:
        with Image.open(page.source) as im:
            preview = ImageOps.exif_transpose(im).convert("RGB")
            if page.rotation:
                preview = preview.rotate(-page.rotation, expand=True)
            preview.thumbnail(size, Image.Resampling.LANCZOS)
            return preview.copy()

    def build(
        self,
        output: Path | str,
        *,
        quality: int = 92,
        page_size: str = "original",
        overwrite: bool = False,
    ) -> ConversionResult:
        if quality not in range(60, 101):
            raise ArchiveError("JPEG quality must be between 60 and 100")
        if page_size not in PAGE_SIZES:
            raise ArchiveError(f"Unknown page size preset: {page_size}")
        pages = self.included_pages
        if not pages:
            raise ArchiveError("No pages are included")
        output = Path(output).resolve()
        if output.exists() and not overwrite:
            raise ArchiveError(f"Output already exists: {output}")
        output.parent.mkdir(parents=True, exist_ok=True)
        temp_output = output.with_name(f".{output.name}.{uuid.uuid4().hex}.part")
        page_dir = self.work / "studio-pages"
        if page_dir.exists():
            for old in page_dir.iterdir():
                old.unlink()
        else:
            page_dir.mkdir()
        try:
            rendered: list[Path] = []
            for index, spec in enumerate(pages, start=1):
                target = page_dir / f"{index:06d}.jpg"
                _render_page(spec, target, quality, page_size)
                rendered.append(target)
            opened = [Image.open(p) for p in rendered]
            try:
                opened[0].save(
                    temp_output,
                    "PDF",
                    save_all=True,
                    append_images=opened[1:],
                    resolution=150.0,
                )
            finally:
                for im in opened:
                    im.close()
            count = verify_generated_pdf(temp_output, len(pages))
            os.replace(temp_output, output)
        finally:
            temp_output.unlink(missing_ok=True)
        return ConversionResult(
            self.archive,
            output,
            count,
            tuple(p.relative_path for p in pages),
            output.stat().st_size,
        )


def _render_page(spec: PageSpec, target: Path, quality: int, page_size: str) -> None:
    with Image.open(spec.source) as im:
        rgb = _flatten_to_rgb(im)
        try:
            if spec.rotation:
                rotated = rgb.rotate(-spec.rotation, expand=True, fillcolor="white")
                rgb.close()
                rgb = rotated
            canvas_size = PAGE_SIZES[page_size]
            if canvas_size is not None:
                canvas = Image.new("RGB", canvas_size, "white")
                margin = 48
                fitted = ImageOps.contain(
                    rgb,
                    (canvas_size[0] - margin * 2, canvas_size[1] - margin * 2),
                    Image.Resampling.LANCZOS,
                )
                x = (canvas_size[0] - fitted.width) // 2
                y = (canvas_size[1] - fitted.height) // 2
                canvas.paste(fitted, (x, y))
                fitted.close()
                rgb.close()
                rgb = canvas
            rgb.save(
                target,
                "JPEG",
                quality=quality,
                optimize=True,
                subsampling=0,
            )
        finally:
            rgb.close()
