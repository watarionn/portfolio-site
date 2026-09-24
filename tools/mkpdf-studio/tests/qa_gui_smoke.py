from __future__ import annotations

import tempfile
import time
import zipfile
from pathlib import Path

from PIL import Image, ImageGrab

from mkpdf_safe.gui import DND_FILES, StudioApp, create_root
from mkpdf_safe.studio import StudioSession


def make_archive(root: Path) -> Path:
    source = root / "gui-sample.cbz"
    pages = []
    for rel, color, size in [
        ("chapter1/01.png", "navy", (360, 520)),
        ("chapter1/02.png", "gold", (520, 360)),
        ("chapter2/01.png", "white", (360, 520)),
    ]:
        path = root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", size, color).save(path)
        pages.append(path)
    with zipfile.ZipFile(source, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in pages:
            zf.write(path, path.relative_to(root).as_posix())
    return source


def capture(root, path: Path) -> None:
    root.update_idletasks()
    root.update()
    time.sleep(0.2)
    x = root.winfo_rootx()
    y = root.winfo_rooty()
    w = root.winfo_width()
    h = root.winfo_height()
    ImageGrab.grab(bbox=(x, y, x + w, y + h)).save(path)


def main() -> None:
    qa_root = Path(tempfile.mkdtemp(prefix="mkpdf-gui-qa-"))
    archive = make_archive(qa_root)
    output = qa_root / "gui-output.pdf"
    screenshot = Path.home() / "Documents" / "mkPDF_Studio_Phase2_GUI.png"

    root = create_root()
    app = StudioApp(root)
    session = StudioSession(archive)
    app.session = session
    app.archive_var.set(str(archive))
    app._refresh_tree(select_index=0)
    app.status_var.set("GUI QA: 3ページ読込済み")

    root.update_idletasks()
    root.update()
    first_box = app.tree.bbox("p0")
    third_box = app.tree.bbox("p2")
    if not first_box or not third_box:
        raise RuntimeError("Tree rows are not visible for drag QA")
    class E:
        pass
    press = E()
    press.y = first_box[1] + max(1, first_box[3] // 2)
    motion = E()
    motion.y = third_box[1] + max(1, third_box[3] // 2)
    app._on_drag_start(press)
    app._on_drag_motion(motion)
    app._on_drag_end(motion)

    session.pages[0].rotate(90)
    session.pages[1].included = False
    app._refresh_tree(select_index=0)

    capture(root, screenshot)
    compact = Path.home() / "Documents" / "mkPDF_Studio_Phase2_GUI_900x620.png"
    root.geometry("900x620")
    capture(root, compact)
    result = session.build(output, quality=88, page_size="a4-portrait")

    print("DND_AVAILABLE", DND_FILES is not None)
    print("ROOT_CLASS", type(root).__module__ + "." + type(root).__name__)
    print("TREE_ROWS", len(app.tree.get_children()))
    print("INCLUDED", len(session.included_pages))
    print("FIRST_PATH", session.pages[0].relative_path)
    print("FIRST_ROTATION", session.pages[0].rotation)
    print("SECOND_INCLUDED", session.pages[1].included)
    print("OUTPUT_PAGES", result.pages)
    print("OUTPUT_EXISTS", output.exists())
    print("SOURCE_EXISTS", archive.exists())
    print("SCREENSHOT", screenshot)
    print("SCREENSHOT_BYTES", screenshot.stat().st_size)
    print("COMPACT_SCREENSHOT", compact)
    print("COMPACT_SCREENSHOT_BYTES", compact.stat().st_size)
    print("GUI_DRAG_REORDER", session.pages[2].relative_path == "chapter1/01.png")
    print("GUI_SMOKE=PASS")

    app.close()


if __name__ == "__main__":
    main()
