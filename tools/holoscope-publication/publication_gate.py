"""Fail-closed publication eligibility audit; does not publish."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8-sig"))
SPOOL = Path(CONFIG["spool_root"])
CAMPAIGN = Path(CONFIG["holoscope_repo"]) / CONFIG["campaign_dir"]
FILES = ("article.md", "article_plan.json", "evidence.json", "audit.json")


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def check(batch_id):
    result = {"batch_id": batch_id, "eligible": False, "reasons": [], "articles": []}
    marker = SPOOL / "editorial-closure" / (batch_id + ".json")
    if not marker.is_file():
        result["reasons"].append("closure_missing")
        return result
    closure = read(marker)
    if closure.get("status") != "CLOSED":
        result["reasons"].append("closure_incomplete")
        return result
    binding = closure.get("approval_binding") or {}
    articles = binding.get("articles") or {}
    if binding.get("batch_id") != batch_id or not articles:
        result["reasons"].append("closure_binding_missing")
        return result
    for vid, snapshot in articles.items():
        row = {"video_id": vid, "reasons": []}
        job = SPOOL / "jobs" / ("lookahead-" + vid + ".json")
        editor = SPOOL / "hinata-draft-factory" / vid / "rinka-editor" / "editor_result.json"
        formal = CAMPAIGN / "batches" / batch_id / "articles" / vid
        if not job.is_file() or not editor.is_file():
            # Closed legacy batches have an independently validated formal snapshot.
            # Closure is authoritative for these older articles.
            if not closure.get("closure_result") or closure["closure_result"].get("returncode") != 0:
                row["reasons"].append("editor_record_missing")
        else:
            j, e = read(job), read(editor)
            if j.get("rinka_editor_status") != "editor_ready_for_promotion" or e.get("status") != "EDITOR_READY_FOR_PROMOTION":
                row["reasons"].append("editor_not_ready")
            source = e.get("source_sha256")
            if not source or source != j.get("rinka_editor_source_sha256"):
                row["reasons"].append("source_sha_mismatch")
            if e.get("manual_review_required") is True or int(e.get("fatal_after", e.get("fatal", 0))) != 0:
                row["reasons"].append("editor_audit_block")
        for name in FILES:
            path = formal / name
            expected = (snapshot.get("files") or {}).get(name)
            if not path.is_file() or not expected or digest(path) != expected:
                row["reasons"].append("approval_sha_mismatch:" + name)
        if (formal / "audit.json").is_file():
            audit = read(formal / "audit.json")
            if int(audit.get("fatal_after", audit.get("fatal_count", 0))) != 0 or audit.get("manual_review_required") is True:
                row["reasons"].append("formal_audit_block")
        result["articles"].append(row)
    result["eligible"] = bool(result["articles"]) and all(not row["reasons"] for row in result["articles"])
    if not result["eligible"]:
        result["reasons"].append("article_gate_failed")
    return result


if __name__ == "__main__":
    ids = sys.argv[1:] or [p.name for p in sorted((CAMPAIGN / "batches").glob("batch-*")) if p.is_dir()]
    print(json.dumps({"mode": "READ_ONLY", "publication_executed": False, "batches": [check(x) for x in ids]}, ensure_ascii=False, indent=2))
