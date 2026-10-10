"""Close only batches whose final Rinka-edited articles match the formal artifacts."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import editorial_closure as closure


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def editor_proven(batch, campaign, spool):
    try:
        ids = closure.selected_video_ids(campaign, batch)
    except Exception:
        return False
    if not ids:
        return False
    for vid in ids:
        root = spool / "hinata-draft-factory" / vid / "rinka-editor"
        result = root / "editor_result.json"
        edited = root / "article.md"
        formal = campaign / "batches" / batch / "articles" / vid / "article.md"
        if not all(p.is_file() for p in (result, edited, formal)):
            return False
        row = read(result)
        if row.get("status") != "EDITOR_READY_FOR_PROMOTION" or row.get("manual_review_required") is True:
            return False
        if int(row.get("fatal_after") or row.get("fatal") or 0) != 0:
            return False
        if sha(edited) != sha(formal):
            return False
    return True


def main():
    _, _, campaign, spool = closure.runtime()
    result = {"closed": [], "blocked": []}
    batches = sorted((campaign / "batches").glob("batch-*"), key=lambda p: int(p.name.split("-")[-1]) if p.name.split("-")[-1].isdigit() else -1)
    for folder in batches:
        batch = folder.name
        marker = closure.marker_path(spool, batch)
        status = read(marker).get("status") if marker.is_file() else None
        if status == "CLOSED":
            continue
        if not editor_proven(batch, campaign, spool):
            continue
        try:
            if status in {"READY_FOR_CLOSURE", "BLOCKED_RETRYABLE"}:
                closure.finalize(batch)
            else:
                closure.approve_and_finalize(batch, editor="rinka")
            result["closed"].append(batch)
        except Exception as exc:
            result["blocked"].append({"batch": batch, "error": str(exc)[:400]})
    print(json.dumps(result, ensure_ascii=False))
    return 1 if result["blocked"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
