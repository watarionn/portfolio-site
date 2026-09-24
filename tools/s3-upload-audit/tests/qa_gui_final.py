from __future__ import annotations

import tempfile
import time
from pathlib import Path

from PIL import ImageGrab

from s3_upload_audit.core import AuditConfig
from s3_upload_audit.gui import APP_VERSION, AuditDashboard
from s3_upload_audit.history import AuditHistoryStore
from s3_upload_audit.settings import AppSettings, AuditPreset


def settle(root, delay=0.08):
    root.update_idletasks()
    root.update()
    time.sleep(delay)
    root.update_idletasks()
    root.update()


def top_levels(root):
    return [w for w in root.winfo_children() if w.winfo_class() == "Toplevel"]


def main():
    import tkinter as tk

    project = Path(__file__).resolve().parents[1]
    qa_root = Path(tempfile.mkdtemp(prefix="s3-audit-v1-"))
    settings = AppSettings(qa_root / "settings.json")
    history = AuditHistoryStore(qa_root / "history.json")
    screenshot = Path.home() / "Documents" / "S3_Upload_Audit_v1.0.0_Dashboard.png"

    root = tk.Tk()
    app = AuditDashboard(root, project_root=project, settings=settings, history=history)
    settle(root, 0.25)

    onboarding = [w for w in top_levels(root) if "Getting started" in w.title()]
    onboarding_opened = bool(onboarding)
    for w in onboarding:
        app._finish_onboarding(w)
    settle(root)
    onboarding_saved = AppSettings(qa_root / "settings.json").onboarding_seen

    app.show_help()
    settle(root)
    help_windows = [w for w in top_levels(root) if "Help" in w.title()]
    help_opened = bool(help_windows)
    for w in help_windows:
        w.destroy()
    settle(root)

    app.run_demo()
    settle(root)
    first_changes = app.change_var.get()
    first_history = len(history.list_entries())
    first_diff_rows = len(app.diff_tree.get_children())

    app.run_demo()
    settle(root)
    second_changes = app.change_var.get()
    second_history = len(history.list_entries())
    second_diff_rows = len(app.diff_tree.get_children())
    second_states = {app.diff_tree.item(i, "values")[1] for i in app.diff_tree.get_children()}

    app.search_var.set("BETA")
    settle(root)
    search_rows = len(app.tree.get_children())
    app.search_var.set("")
    app.status_filter_var.set("provider-error")
    settle(root)
    filter_rows = len(app.tree.get_children())
    app.status_filter_var.set("all")
    settle(root)

    settings.save_preset("QA Preset", AuditPreset(3, 2, 20, 14, r"^\d+_{target}$"))
    app._refresh_presets()
    app._load_preset_values("QA Preset", persist=True)
    preset_applied = (
        app.top_n_var.get() == "3"
        and app.parallel_var.get() == "2"
        and app.timeout_var.get() == "20"
        and app.stale_days_var.get() == "14"
        and AppSettings(qa_root / "settings.json").last_preset == "QA Preset"
    )
    settings.delete_preset("QA Preset")
    preset_deleted = "QA Preset" not in AppSettings(qa_root / "settings.json").presets()

    safe_config = AuditConfig.from_mapping({
        "provider": "awscli",
        "executable": "aws",
        "profile": "qa-readonly",
        "bucket": "qa-bucket",
        "top_n": 2,
        "parallel": 2,
        "timeout_seconds": 15,
        "stale_after_days": 10,
        "folder_pattern": r"^\d+_{target}$",
    })
    config_path = qa_root / "config.json"
    app._write_config(config_path, safe_config)
    reloaded = AuditConfig.load(config_path)
    config_safe = (
        reloaded.profile == "qa-readonly"
        and reloaded.bucket == "qa-bucket"
        and "secret" not in config_path.read_text(encoding="utf-8").casefold()
        and "access_key" not in config_path.read_text(encoding="utf-8").casefold()
    )

    history_rows = len(app.history_tree.get_children())
    if history_rows:
        app.history_tree.selection_set("h0")
        app.view_selected_history()
        settle(root)
    history_view_ok = app.report is not None and app.report.total_targets == 6

    app._focus_search()
    settle(root)
    search_focus = root.focus_get() == app.search_entry

    app.notebook.select(app.dashboard_tab)
    settle(root)
    x, y = root.winfo_rootx(), root.winfo_rooty()
    w, h = root.winfo_width(), root.winfo_height()
    ImageGrab.grab(bbox=(x, y, x + w, y + h)).save(screenshot)

    print("APP_VERSION", APP_VERSION)
    print("ONBOARDING_OPENED", onboarding_opened)
    print("ONBOARDING_SAVED", onboarding_saved)
    print("HELP_OPENED", help_opened)
    print("FIRST_CHANGES", first_changes)
    print("FIRST_HISTORY", first_history)
    print("FIRST_DIFF_ROWS", first_diff_rows)
    print("SECOND_CHANGES", second_changes)
    print("SECOND_HISTORY", second_history)
    print("SECOND_DIFF_ROWS", second_diff_rows)
    print("SECOND_STATES", second_states)
    print("SEARCH_ROWS", search_rows)
    print("FILTER_ROWS", filter_rows)
    print("PRESET_APPLIED", preset_applied)
    print("PRESET_DELETED", preset_deleted)
    print("CONFIG_SAFE", config_safe)
    print("HISTORY_ROWS", history_rows)
    print("HISTORY_VIEW_OK", history_view_ok)
    print("SEARCH_FOCUS", search_focus)
    print("SCREENSHOT", screenshot)
    print("SCREENSHOT_BYTES", screenshot.stat().st_size)

    checks = [
        APP_VERSION == "1.0.0",
        onboarding_opened,
        onboarding_saved,
        help_opened,
        first_changes == "6",
        first_history == 1,
        first_diff_rows == 6,
        second_changes == "0",
        second_history == 2,
        second_diff_rows == 6,
        second_states == {"Unchanged"},
        search_rows == 1,
        filter_rows == 1,
        preset_applied,
        preset_deleted,
        config_safe,
        history_rows == 2,
        history_view_ok,
        search_focus,
        screenshot.stat().st_size > 5000,
    ]
    if not all(checks):
        raise SystemExit("GUI FINAL QA FAILED")
    print("GUI_FINAL=PASS")
    root.destroy()


if __name__ == "__main__":
    main()
