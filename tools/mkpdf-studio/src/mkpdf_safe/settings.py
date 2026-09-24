from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class PdfPreset:
    quality: int
    page_size: str


BUILTIN_PRESETS: dict[str, PdfPreset] = {
    "Balanced": PdfPreset(92, "original"),
    "Compact": PdfPreset(80, "original"),
    "Print A4": PdfPreset(95, "a4-portrait"),
}


class SettingsStore:
    def __init__(self, path: Path | str | None = None) -> None:
        if path is None:
            appdata = Path(os.environ.get("APPDATA", Path.home()))
            path = appdata / "mkPDF Studio" / "settings.json"
        self.path = Path(path)
        self.data: dict = {
            "onboarding_seen": False,
            "last_preset": "Balanced",
            "presets": {},
        }
        self.load()

    def load(self) -> None:
        if not self.path.exists():
            return
        try:
            loaded = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return
        if isinstance(loaded, dict):
            self.data.update(loaded)
        if not isinstance(self.data.get("presets"), dict):
            self.data["presets"] = {}

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(
            json.dumps(self.data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        temp.replace(self.path)

    @property
    def onboarding_seen(self) -> bool:
        return bool(self.data.get("onboarding_seen"))

    def mark_onboarding_seen(self) -> None:
        self.data["onboarding_seen"] = True
        self.save()

    @property
    def last_preset(self) -> str:
        return str(self.data.get("last_preset", "Balanced"))

    def set_last_preset(self, name: str) -> None:
        self.data["last_preset"] = name
        self.save()

    def presets(self) -> dict[str, PdfPreset]:
        result = dict(BUILTIN_PRESETS)
        for name, value in self.data.get("presets", {}).items():
            if not isinstance(name, str) or not isinstance(value, dict):
                continue
            try:
                quality = int(value["quality"])
                page_size = str(value["page_size"])
            except (KeyError, TypeError, ValueError):
                continue
            if 60 <= quality <= 100 and page_size in {"original", "a4-portrait", "a4-landscape"}:
                result[name] = PdfPreset(quality, page_size)
        return result

    def save_preset(self, name: str, preset: PdfPreset) -> None:
        clean = " ".join(name.strip().split())
        if not clean:
            raise ValueError("Preset name is empty")
        if len(clean) > 40:
            raise ValueError("Preset name is too long")
        if clean in BUILTIN_PRESETS:
            raise ValueError("Built-in preset names are reserved")
        if not 60 <= preset.quality <= 100:
            raise ValueError("Quality must be 60-100")
        if preset.page_size not in {"original", "a4-portrait", "a4-landscape"}:
            raise ValueError("Unknown page size")
        self.data.setdefault("presets", {})[clean] = {
            "quality": preset.quality,
            "page_size": preset.page_size,
        }
        self.data["last_preset"] = clean
        self.save()

    def delete_preset(self, name: str) -> None:
        if name in BUILTIN_PRESETS:
            raise ValueError("Built-in presets cannot be deleted")
        presets = self.data.setdefault("presets", {})
        presets.pop(name, None)
        if self.data.get("last_preset") == name:
            self.data["last_preset"] = "Balanced"
        self.save()
