from __future__ import annotations

import tempfile
import time
from pathlib import Path

from PIL import ImageGrab

from s3_upload_audit.cli import write_json, write_tsv
from s3_upload_audit.gui import AuditDashboard


def settle(root, delay=0.08):
    root.update_idletasks()
    root.update()
    time.sleep(delay)
    root.update_idletasks()
    root.update()


def main():
    import tkinter as tk

    project = Path(__file__).resolve().parents[1]
    qa = Path(tempfile.mkdtemp(prefix="s3-audit-gui-"))
    screenshot = Path.home() / "Documents" / "S3_Upload_Audit_Phase2_Dashboard.png"

    root = tk.Tk()
    app = AuditDashboard(root, project_root=project)
    settle(root)

    app.run_demo()
    settle(root)

    assert app.report is not None
    assert app.total_var.get() == "6"
    assert app.healthy_var.get() == "2"
    assert app.stale_var.get() == "1"
    assert app.problem_var.get() == "4"
    assert app.duplicate_var.get() == "1"
    assert len(app.tree.get_children()) == 6

    app.search_var.set("BETA")
    settle(root)
    assert len(app.tree.get_children()) == 1

    app.search_var.set("")
    app.status_filter_var.set("provider-error")
    settle(root)
    assert len(app.tree.get_children()) == 1

    app.status_filter_var.set("all")
    settle(root)
    assert len(app.tree.get_children()) == 6

    out_tsv = qa / "demo.tsv"
    out_json = qa / "demo.json"
    write_tsv(out_tsv, app.report)
    write_json(out_json, app.report)
    assert out_tsv.stat().st_size > 100
    assert out_json.stat().st_size > 100

    x, y = root.winfo_rootx(), root.winfo_rooty()
    w, h = root.winfo_width(), root.winfo_height()
    ImageGrab.grab(bbox=(x, y, x + w, y + h)).save(screenshot)
    assert screenshot.stat().st_size > 5000

    print("TOTAL", app.total_var.get())
    print("HEALTHY", app.healthy_var.get())
    print("STALE", app.stale_var.get())
    print("PROBLEMS", app.problem_var.get())
    print("DUPLICATES", app.duplicate_var.get())
    print("ROWS", len(app.tree.get_children()))
    print("TSV_BYTES", out_tsv.stat().st_size)
    print("JSON_BYTES", out_json.stat().st_size)
    print("SCREENSHOT", screenshot)
    print("SCREENSHOT_BYTES", screenshot.stat().st_size)
    print("GUI_SMOKE=PASS")
    root.destroy()


if __name__ == "__main__":
    main()
