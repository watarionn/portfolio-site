from __future__ import annotations

import tempfile
import time
import zipfile
from pathlib import Path

from PIL import Image, ImageGrab

from mkpdf_safe.gui import APP_VERSION, StudioApp, create_root
from mkpdf_safe.settings import PdfPreset, SettingsStore
from mkpdf_safe.studio import StudioSession


def make_archive(root: Path) -> Path:
    archive = root / "final-gui.cbz"
    items = []
    for rel, color, size in [
        ("01.png", "navy", (360, 520)),
        ("02.png", "gold", (520, 360)),
        ("03.png", "white", (360, 520)),
        ("04.png", "green", (360, 520)),
    ]:
        p = root / rel
        Image.new("RGB", size, color).save(p)
        items.append(p)
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in items:
            zf.write(p, p.name)
    return archive


def settle(root, delay: float = 0.06) -> None:
    root.update_idletasks()
    root.update()
    time.sleep(delay)
    root.update_idletasks()
    root.update()


def top_levels(root) -> list:
    return [w for w in root.winfo_children() if w.winfo_class() == "Toplevel"]


def capture(root, path: Path) -> None:
    settle(root, 0.15)
    x, y = root.winfo_rootx(), root.winfo_rooty()
    w, h = root.winfo_width(), root.winfo_height()
    ImageGrab.grab(bbox=(x, y, x + w, y + h)).save(path)


def main() -> None:
    qa = Path(tempfile.mkdtemp(prefix="mkpdf-v1-gui-"))
    settings_path = qa / "settings.json"
    settings = SettingsStore(settings_path)
    archive = make_archive(qa)
    output = qa / "edited.pdf"
    screenshot = Path.home() / "Documents" / "mkPDF_Studio_v1.0.0_GUI.png"

    root = create_root()
    app = StudioApp(root, settings=settings)
    settle(root, 0.25)

    onboarding_windows = top_levels(root)
    onboarding_opened = any("はじめに" in w.title() for w in onboarding_windows)
    for w in onboarding_windows:
        if "はじめに" in w.title():
            app._finish_onboarding(w)
    settle(root)
    onboarding_saved = SettingsStore(settings_path).onboarding_seen

    app.show_help()
    settle(root)
    help_windows = [w for w in top_levels(root) if "Help" in w.title()]
    help_opened = bool(help_windows)
    for w in help_windows:
        w.destroy()
    settle(root)

    session = StudioSession(archive)
    app.session = session
    app.archive_var.set(str(archive))
    app._refresh_tree(select_indices=[0], focus_index=0)
    settle(root)

    root.event_generate("<Control-a>")
    settle(root)
    select_all_count = len(app._selected_indices())

    root.event_generate("<Control-Right>")
    settle(root)
    all_rotated = all(p.rotation == 90 for p in session.pages)

    app.tree.focus_set()
    app.tree.event_generate("<space>")
    settle(root)
    all_excluded = all(not p.included for p in session.pages)

    root.event_generate("<Control-z>")
    settle(root)
    undo_restored_include = all(p.included for p in session.pages)

    root.event_generate("<Control-z>")
    settle(root)
    undo_restored_rotation = all(p.rotation == 0 for p in session.pages)

    root.event_generate("<Control-y>")
    settle(root)
    redo_rotation = all(p.rotation == 90 for p in session.pages)

    settings.save_preset("QA Landscape", PdfPreset(88, "a4-landscape"))
    app._refresh_presets()
    app._load_preset_values("QA Landscape", persist=True)
    preset_applied = (
        app.quality_var.get() == "88"
        and app.page_size_var.get() == "a4-landscape"
        and SettingsStore(settings_path).last_preset == "QA Landscape"
    )
    settings.delete_preset("QA Landscape")
    custom_deleted = "QA Landscape" not in SettingsStore(settings_path).presets()

    # Keep two pages for final PDF and exercise batch editing.
    app.tree.selection_set(("p0", "p1"))
    app.tree.focus("p0")
    app.toggle_include()  # selected pages become excluded because all were included
    app.toggle_include()  # selected pages included again
    app.tree.selection_set(("p2", "p3"))
    app.tree.focus("p2")
    app.toggle_include()  # pages 3-4 excluded
    settle(root)

    capture(root, screenshot)
    result = session.build(output, quality=92, page_size="a4-portrait")

    print("APP_VERSION", APP_VERSION)
    print("ONBOARDING_OPENED", onboarding_opened)
    print("ONBOARDING_SAVED", onboarding_saved)
    print("HELP_OPENED", help_opened)
    print("SELECT_ALL_COUNT", select_all_count)
    print("ALL_ROTATED", all_rotated)
    print("ALL_EXCLUDED", all_excluded)
    print("UNDO_INCLUDE", undo_restored_include)
    print("UNDO_ROTATION", undo_restored_rotation)
    print("REDO_ROTATION", redo_rotation)
    print("PRESET_APPLIED", preset_applied)
    print("CUSTOM_PRESET_DELETED", custom_deleted)
    print("FINAL_INCLUDED", len(session.included_pages))
    print("OUTPUT_PAGES", result.pages)
    print("OUTPUT_EXISTS", output.exists())
    print("SOURCE_EXISTS", archive.exists())
    print("SCREENSHOT", screenshot)
    print("SCREENSHOT_BYTES", screenshot.stat().st_size)

    checks = [
        APP_VERSION == "1.0.0",
        onboarding_opened,
        onboarding_saved,
        help_opened,
        select_all_count == 4,
        all_rotated,
        all_excluded,
        undo_restored_include,
        undo_restored_rotation,
        redo_rotation,
        preset_applied,
        custom_deleted,
        len(session.included_pages) == 2,
        result.pages == 2,
        output.exists(),
        archive.exists(),
        screenshot.stat().st_size > 5000,
    ]
    if not all(checks):
        raise SystemExit("GUI FINAL QA FAILED")
    print("GUI_FINAL=PASS")
    app.close()


if __name__ == "__main__":
    main()
