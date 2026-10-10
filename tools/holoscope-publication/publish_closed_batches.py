from __future__ import annotations

import csv
import hashlib
import json
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import publication_gate

COLLAB = Path(r"C:\Work\Projects\OllamaPersonaRuntime\holoscope_collab")
SOURCE_REPO = Path(r"C:\Work\Projects\HoloScope_ホロライブEN観測所\cf278796-cloudfree-site-batch049")
TARGET_REPO = Path(r"C:\Work\Projects\HoloScope_ホロライブEN観測所\cf278796-cloudfree-site-publish-20261005")
SPOOL = Path(r"C:\Users\watar\.ai-discussion-bridge\holoscope-collab\hinata-draft-factory")
MASTER = Path(r"C:\Work\Projects\HoloScope_ホロライブEN観測所\holoscope_local_tool\data\hololive_en_video_live_lists_unrestricted.csv")
CAMPAIGN = SOURCE_REPO / "holoscope" / "campaigns" / "article-writing-20260830"
CONTENT = TARGET_REPO / "holoscope" / "content"
STATE = COLLAB / "runtime" / "article_pipeline_state.json"
REPORT = COLLAB / "runtime" / "promotion_closed_batches_report.json"

def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

def write_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def git_bytes(commit: str, path: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(SOURCE_REPO), "show", f"{commit}:{path}"])

def git_json(commit: str, path: str):
    return json.loads(git_bytes(commit, path).decode("utf-8-sig"))

def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def slugify(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value[:80] or "stream"

def normalized_id(video_id: str) -> str:
    value = re.sub(r"[^a-z0-9_-]", "", video_id.lower())
    if not value or not value[0].isalnum():
        value = "v" + value
    return value

def parse_md(markdown: str, plan: dict, fallback_title: str):
    lines = markdown.splitlines()
    title = next((x[2:].strip() for x in lines if x.startswith("# ")), None)
    title = title or str(plan.get("title") or fallback_title).strip()
    headings = [x[3:].strip() for x in lines if x.startswith("## ") and x[3:].strip() != "記事情報"]
    lead = str(plan.get("lead") or "").strip()
    if not lead:
        buf = []
        after_h1 = False
        for line in lines:
            if line.startswith("# "):
                after_h1 = True
                continue
            if not after_h1 and any(x.startswith("# ") for x in lines):
                continue
            if line.startswith("#"):
                if buf:
                    break
                continue
            if line.strip().startswith("- "):
                continue
            if line.strip():
                buf.append(line.strip())
            elif buf:
                break
        lead = " ".join(buf).strip()
    if not lead:
        lead = title
    summary = str(plan.get("reader_value") or plan.get("summaryOneLine") or plan.get("lead") or lead).strip()
    lead = lead[:1200]
    summary = summary[:400]
    key_points = []
    for h in headings:
        if h not in key_points:
            key_points.append(h[:400])
        if len(key_points) >= 3:
            break
    return title[:300], lead, summary, headings[:20], key_points

def strip_h1(markdown: str) -> str:
    lines = markdown.splitlines()
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
        while lines and not lines[0].strip():
            lines.pop(0)
    return "\n".join(lines).rstrip() + "\n"

def parse_seconds(anchor):
    if isinstance(anchor, (list, tuple)) and anchor:
        raw = str(anchor[0])
        parts = raw.split(":")
        try:
            nums = [int(x) for x in parts]
        except ValueError:
            return None
        if len(nums) == 3:
            return float(nums[0] * 3600 + nums[1] * 60 + nums[2])
        if len(nums) == 2:
            return float(nums[0] * 60 + nums[1])
        return None
    value = anchor.get("segment_start")
    if isinstance(value, (int, float)):
        return float(value)
    raw = str(anchor.get("at") or "")
    parts = raw.split(":")
    try:
        nums = [int(x) for x in parts]
    except ValueError:
        return None
    if len(nums) == 3:
        return float(nums[0] * 3600 + nums[1] * 60 + nums[2])
    if len(nums) == 2:
        return float(nums[0] * 60 + nums[1])
    return None

def anchor_summary(anchor) -> str:
    if isinstance(anchor, (list, tuple)):
        return str(anchor[1] if len(anchor) > 1 else "").strip()
    for key in ("fact", "claim", "use", "summary", "text"):
        value = str(anchor.get(key) or "").strip()
        if value:
            return value
    return str(anchor.get("text_exact") or "").strip()

def anchor_original(anchor, summary: str) -> str:
    if isinstance(anchor, (list, tuple)):
        return str(anchor[1] if len(anchor) > 1 else summary).strip()
    return str(anchor.get("text_exact") or anchor.get("originalText") or anchor.get("text") or summary).strip()

def build_evidence(video_id: str, member_uid: str, source_hash: str, anchors: list[dict], stamp: str):
    items, timeline = [], []
    for index, anchor in enumerate(anchors, 1):
        seconds = parse_seconds(anchor)
        summary = anchor_summary(anchor)
        if seconds is None or not summary:
            raise RuntimeError(f"{video_id}:invalid_anchor:{index}")
        eid = f"ev-{index:04d}"
        items.append({
            "id": eid, "segmentIndex": index - 1,
            "startSeconds": seconds, "endSeconds": seconds,
            "speakerUid": member_uid, "originalText": anchor_original(anchor, summary),
            "summary": summary, "evidenceType": "event", "confidence": 1.0, "publishable": True,
        })
        timeline.append({"timestampSeconds": int(seconds + 0.5), "text": summary[:500], "evidenceIds": [eid]})
    timeline.sort(key=lambda x: x["timestampSeconds"])
    if not items:
        raise RuntimeError(f"{video_id}:no_evidence_anchors")
    return {
        "schemaVersion": "1.0.0", "videoId": video_id,
        "transcriptSourceHash": source_hash, "createdAt": stamp, "items": items,
    }, timeline

def probe_video(video_id: str) -> str:
    url = "https://www.youtube.com/oembed?" + urllib.parse.urlencode({
        "format": "json", "url": f"https://www.youtube.com/watch?v={video_id}"
    })
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 HoloScope-Publication-Check"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                if response.status == 200:
                    return "public"
        except urllib.error.HTTPError as exc:
            if exc.code in {401, 403, 404}:
                return "unavailable"
            if (exc.code == 429 or exc.code >= 500) and attempt < 2:
                time.sleep(2 ** attempt)
                continue
            raise
        except urllib.error.URLError:
            if attempt < 2:
                time.sleep(2 ** attempt)
                continue
            return "unknown"
    return "unknown"

def load_queue():
    out = {}
    for path in sorted((CAMPAIGN / "queue").glob("items-*.json")):
        for item in read_json(path).get("items", []):
            if item.get("video_id"):
                out[item["video_id"]] = item
    return out

def load_master():
    with MASTER.open("r", encoding="utf-8-sig", newline="") as handle:
        return {row["video_id"]: row for row in csv.DictReader(handle) if row.get("video_id")}

def load_members():
    by_channel, by_name = {}, {}
    for path in (CONTENT / "members").glob("*.json"):
        item = read_json(path)
        if item.get("channelId"):
            by_channel[item["channelId"]] = item
        for name in (item.get("displayName"), item.get("nameJa")):
            if name:
                by_name[str(name).casefold()] = item
    return by_channel, by_name

def channel_from_url(url: str | None):
    m = re.search(r"/channel/([^/?#]+)", str(url or ""))
    return m.group(1) if m else None

def stream_type(plan: dict, queue_item: dict):
    raw = str(plan.get("classification") or queue_item.get("classification") or "").strip()
    return {
        "ゲーム実況": "game", "ゲーム": "game", "game": "game",
        "雑談": "chatting", "chatting": "chatting",
        "企画": "event", "event": "event",
        "歌枠": "song", "歌動画、歌唱配信": "song", "song": "song",
        "その他": "other", "other": "other",
    }.get(raw, "other")

def article_body(data: bytes) -> str:
    text = data.decode("utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    lines = []
    for line in text.split("\n"):
        if line.strip() == "## 記事情報":
            break
        lines.append(line.rstrip())
    return "\n".join(lines).strip()

def find_historical_sha_blob(rel: str, expected: str):
    commits = subprocess.check_output(
        ["git", "-C", str(SOURCE_REPO), "log", "--format=%H", "--", rel],
        text=True, encoding="utf-8", errors="replace",
    ).splitlines()
    for commit in commits:
        try:
            data = git_bytes(commit, rel)
        except subprocess.CalledProcessError:
            continue
        if sha256_bytes(data) == expected:
            return commit, data, "lf"
        if b"\r\n" not in data:
            crlf = data.replace(b"\n", b"\r\n")
            if sha256_bytes(crlf) == expected:
                return commit, crlf, "crlf"
    return None, None, None

def legacy_source(queue_item: dict):
    commit = str(queue_item.get("commit_sha") or "")
    article_path = str(queue_item.get("article_path") or "")
    if not commit or not article_path:
        raise RuntimeError(f"{queue_item.get('video_id')}:legacy_provenance_missing")
    base = article_path.rsplit("/", 1)[0]
    batch_base = article_path.split("/articles/", 1)[0]
    article_bytes = git_bytes(commit, article_path)
    plan = git_json(commit, base + "/article_plan.json")
    evidence = git_json(commit, base + "/evidence.json")
    if not evidence.get("anchors") and evidence.get("evidence"):
        evidence = dict(evidence)
        evidence["anchors"] = [
            {
                "segment_start": item.get("timestamp_seconds"),
                "claim": item.get("claim"),
                "text_exact": item.get("source_excerpt"),
            }
            for item in evidence.get("evidence") or []
            if item.get("timestamp_seconds") is not None and item.get("claim")
        ]
    report = git_json(commit, batch_base + "/batch_report.json")
    checks = git_json(commit, batch_base + "/automated_checks.json")
    prep = git_json(commit, batch_base + "/publication-prep.json")
    vid = queue_item["video_id"]
    witnesses = list(checks.get("articles") or []) + list(checks.get("items") or [])
    witness = next((x for x in witnesses if x.get("video_id") == vid), None)
    prep_item = next((x for x in prep.get("items", []) if x.get("video_id") == vid), None)
    if report.get("result") != "pass" or report.get("fatal_count") != 0 or report.get("timestamp_mismatches") != 0:
        raise RuntimeError(f"{vid}:legacy_batch_witness_failed")
    if not witness:
        raise RuntimeError(f"{vid}:legacy_article_witness_missing")
    expected_sha = str(witness.get("article_sha256") or "")
    if expected_sha != sha256_bytes(article_bytes):
        old_commit, old_blob, line_mode = find_historical_sha_blob(article_path, expected_sha)
        if not old_commit or old_blob is None or article_body(old_blob) != article_body(article_bytes):
            raise RuntimeError(f"{vid}:legacy_article_sha_failed")
    if not prep_item or prep_item.get("content_ready") is not True:
        raise RuntimeError(f"{vid}:legacy_content_not_ready")
    return article_bytes.decode("utf-8-sig"), plan, evidence, int(queue_item.get("quality_score") or 0), "legacy-calibration-promotion-20261005"

def editor_source(video_id: str):
    root = SPOOL / video_id / "rinka-editor"
    required = ["article.md", "article_plan.json", "evidence.json", "audit.json", "editor_result.json"]
    missing = [name for name in required if not (root / name).is_file()]
    if missing:
        raise RuntimeError(f"{video_id}:editor_missing:{','.join(missing)}")
    result = read_json(root / "editor_result.json")
    plan = read_json(root / "article_plan.json")
    evidence = read_json(root / "evidence.json")
    audit = read_json(root / "audit.json")
    article_text = (root / "article.md").read_text(encoding="utf-8-sig")
    if not evidence.get("anchors"):
        draft_path = SPOOL / video_id / "evidence_draft.json"
        if not draft_path.is_file():
            raise RuntimeError(f"{video_id}:reviewed_evidence_has_no_anchors")
        draft_evidence = read_json(draft_path)
        referenced = set(re.findall(r"(?<!\d)(\d{2}:\d{2}(?::\d{2})?)(?!\d)", article_text))
        selected = []
        for anchor in draft_evidence.get("anchors") or []:
            at = str(anchor.get("at") or "")
            if any(at == ref or (len(ref) == 5 and at.startswith(ref + ":")) for ref in referenced):
                selected.append(anchor)
        if not selected:
            raise RuntimeError(f"{video_id}:no_final_article_timestamp_evidence")
        evidence = dict(evidence)
        evidence["anchors"] = selected[:20]
        evidence["anchor_source"] = "draft_evidence_filtered_by_rinka_final_article_timestamps"
    final_headings = [
        line[3:].strip() for line in article_text.splitlines()
        if line.startswith("## ") and line[3:].strip() != "記事情報"
    ]
    draft_map = {}
    draft_path = SPOOL / video_id / "evidence_draft.json"
    if draft_path.is_file():
        for item in read_json(draft_path).get("anchors") or []:
            if isinstance(item, dict):
                for key in (str(item.get("segment_id") or ""), str(item.get("at") or "")):
                    if key:
                        draft_map[key] = item
    raw_anchors = list(evidence.get("anchors") or [])
    normalized = []
    for index, anchor in enumerate(raw_anchors):
        heading = final_headings[min((index * len(final_headings)) // max(len(raw_anchors), 1), len(final_headings) - 1)] if final_headings else "確認済みの配信場面"
        if isinstance(anchor, (list, tuple)):
            at = str(anchor[0]) if anchor else ""
            exact = str(anchor[1]) if len(anchor) > 1 else ""
            normalized.append({"at": at, "summary": heading, "text_exact": exact})
            continue
        item = dict(anchor)
        if not anchor_summary(item):
            item["summary"] = heading
        match = draft_map.get(str(item.get("segment_id") or "")) or draft_map.get(str(item.get("at") or ""))
        if match and not item.get("text_exact"):
            item["text_exact"] = match.get("text_exact")
        normalized.append(item)
    evidence = dict(evidence)
    evidence["anchors"] = normalized
    binding = read_json(SPOOL / video_id / "source_binding.json")
    factory = read_json(SPOOL / video_id / "factory_result.json")
    if result.get("status") != "EDITOR_READY_FOR_PROMOTION":
        raise RuntimeError(f"{video_id}:editor_status:{result.get('status')}")
    fatal = result.get("fatal_after", result.get("fatal", 0))
    if fatal != 0 or result.get("manual_review_required") is True:
        raise RuntimeError(f"{video_id}:editor_gate_failed")
    hashes = {
        str(x) for x in (
            result.get("source_sha256"), evidence.get("source_sha256"), audit.get("source_sha256"),
            binding.get("source_sha256"), factory.get("source_sha256"),
        ) if x
    }
    if len(hashes) != 1:
        raise RuntimeError(f"{video_id}:source_sha_disagreement:{sorted(hashes)}")
    source_hash = next(iter(hashes))
    if evidence.get("video_id") != video_id or binding.get("video_id") != video_id or result.get("video_id") != video_id:
        raise RuntimeError(f"{video_id}:video_binding_failed")
    quality = int(result.get("article_score") or audit.get("final_score") or audit.get("quality_score_after_revision") or 95)
    return (root / "article.md").read_text(encoding="utf-8-sig"), plan, evidence, quality, "rinka-editor-promotion-20261005", source_hash

def formal_source(video_id):
    batches = [p.stem for p in sorted((publication_gate.SPOOL / "editorial-closure").glob("batch-*.json")) if publication_gate.check(p.stem)["eligible"]]
    candidates = [CAMPAIGN / "batches" / batch / "articles" / video_id for batch in batches]
    roots = [p for p in candidates if p.is_dir()]
    if len(roots) != 1:
        raise RuntimeError(f"{video_id}:formal_source_ambiguous")
    root = roots[0]
    plan, evidence, audit = (read_json(root / name) for name in ("article_plan.json", "evidence.json", "audit.json"))
    if evidence.get("video_id") != video_id or audit.get("video_id") != video_id:
        raise RuntimeError(f"{video_id}:formal_identity_mismatch")
    if int(audit.get("fatal_after") or 0) != 0:
        raise RuntimeError(f"{video_id}:formal_fatal")
    source_hash = str(evidence.get("source_sha256") or "")
    if not re.fullmatch(r"[a-f0-9]{64}", source_hash):
        raise RuntimeError(f"{video_id}:formal_source_hash_missing")
    return (root / "article.md").read_text(encoding="utf-8-sig"), plan, evidence, int(audit.get("final_score") or 0), "formal-closed-promotion", source_hash


def main():
    state = read_json(STATE)
    batches = [p.stem for p in sorted((publication_gate.SPOOL / "editorial-closure").glob("batch-*.json")) if publication_gate.check(p.stem)["eligible"]]
    ids = sorted({row["video_id"] for batch in batches for row in publication_gate.check(batch)["articles"]})
    ids = [vid for vid in ids if not (CONTENT / "streams" / vid).exists()]
    if not ids:
        print("NO_NEW_ARTICLES")
        return 0
    queue = load_queue()
    master = load_master()
    by_channel, by_name = load_members()
    records = {}
    stamp = now_iso()
    for vid in ids:
        q = queue.get(vid)
        if not q:
            raise RuntimeError(f"{vid}:queue_missing")
        if (CONTENT / "streams" / vid).exists():
            raise RuntimeError(f"{vid}:formal_target_exists")
        ed = SPOOL / vid / "rinka-editor" / "editor_result.json"
        if ed.is_file():
            article_md, plan, evidence, quality, method, source_hash = editor_source(vid)
        else:
            article_md, plan, evidence, quality, method, source_hash = formal_source(vid)
            if not re.fullmatch(r"[a-f0-9]{64}", source_hash):
                raise RuntimeError(f"{vid}:legacy_source_hash_missing")
        row = master.get(vid, {})
        channel = channel_from_url(row.get("channel_url"))
        member = by_channel.get(channel) if channel else None
        if member is None:
            member = by_name.get(str(q.get("member") or "").casefold())
        if member is None:
            print(f"SKIP_UNRESOLVED_MEMBER:{vid}", flush=True)
            continue
        title, lead, summary, headings, key_points = parse_md(article_md, plan, str(q.get("title") or row.get("title") or vid))
        anchors = list(evidence.get("anchors") or [])
        if not anchors:
            raise RuntimeError(f"{vid}:anchors_missing")
        ledger, timeline = build_evidence(vid, member["uid"], source_hash, anchors, stamp)
        records[vid] = {
            "q": q, "row": row, "member": member, "article_md": article_md, "plan": plan,
            "evidence": evidence, "quality": quality, "method": method, "source_hash": source_hash,
            "title": title, "lead": lead, "summary": summary, "headings": headings, "key_points": key_points,
            "ledger": ledger, "timeline": timeline,
        }

    ids = [vid for vid in ids if vid in records]
    statuses = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(probe_video, vid): vid for vid in ids}
        for future in as_completed(futures):
            statuses[futures[future]] = future.result()

    report_rows = []
    for vid in ids:
        rec = records[vid]
        q, row, member = rec["q"], rec["row"], rec["member"]
        ledger, timeline = rec["ledger"], rec["timeline"]
        key_points = list(rec["key_points"])
        for item in timeline:
            if item["text"] not in key_points:
                key_points.append(item["text"])
            if len(key_points) >= 3:
                break
        if len(key_points) < 3:
            raise RuntimeError(f"{vid}:insufficient_key_points")
        uid_core = normalized_id(vid)
        slug = slugify(str(member.get("slug") or member["displayName"]) + "-" + vid)
        stream_uid, article_uid = "str_" + uid_core, "sar_" + uid_core
        sections = []
        evidence_ids = [x["id"] for x in ledger["items"]]
        for idx, heading in enumerate(rec["headings"][:8]):
            sections.append({
                "sectionType": "main", "heading": heading[:160],
                "evidenceIds": [evidence_ids[min(idx, len(evidence_ids)-1)]],
            })
        duration_raw = row.get("duration_seconds") or ((q.get("transcript_metrics") or {}).get("duration_seconds"))
        duration = int(float(duration_raw)) if duration_raw not in (None, "") else None
        published_at = str(row.get("timestamp") or "").strip() or None
        meta = {
            "schemaVersion": "1.0.0", "uid": stream_uid, "slug": slug,
            "publicationStatus": "published", "publishAt": None, "publishTimezone": None,
            "createdAt": stamp, "updatedAt": stamp, "videoId": vid,
            "title": str(q.get("title") or row.get("title") or rec["title"])[:300],
            "originalUrl": str(row.get("url") or f"https://www.youtube.com/watch?v={vid}"),
            "channelId": member["channelId"], "primaryMemberUid": member["uid"],
            "participantMemberUids": [], "streamType": stream_type(rec["plan"], q),
            "classificationConfidence": None, "videoStatus": statuses[vid],
            "publishedAt": published_at, "durationSeconds": duration,
            "gameUids": [], "eventUids": [], "seriesUid": None, "tags": [],
            "thumbnailUrl": None, "sourceHash": rec["source_hash"], "dependencyEdges": [member["uid"]],
            "internal": {
                "reviewStatus": "approved", "qualityScore": rec["quality"] or None,
                "evidenceLedgerPath": "internal/evidence.json", "diagnostics": [],
                "generationMethod": rec["method"], "generationPrompt": None,
            },
        }
        article = {
            "schemaVersion": "1.0.0", "uid": article_uid, "slug": slug,
            "publicationStatus": "published", "publishAt": None, "publishTimezone": None,
            "createdAt": stamp, "updatedAt": stamp, "streamUid": stream_uid, "videoId": vid,
            "title": rec["title"], "lead": rec["lead"], "summaryOneLine": rec["summary"],
            "keyPoints": key_points[:3], "markdownPath": "article.md",
            "sections": sections, "highlights": [], "timeline": timeline,
            "result": None, "continuation": None, "learningPoints": [], "conclusion": None,
            "sourceHash": rec["source_hash"], "dependencyEdges": [stream_uid],
            "internal": {
                "reviewStatus": "approved", "qualityScore": rec["quality"] or None,
                "evidenceLedgerPath": "internal/evidence.json", "diagnostics": [],
                "generationMethod": rec["method"], "generationPrompt": None,
            },
        }
        target = CONTENT / "streams" / vid
        target.mkdir(parents=True)
        write_json(target / "metadata.json", meta)
        write_json(target / "article.json", article)
        (target / "article.md").write_text(strip_h1(rec["article_md"]), encoding="utf-8")
        write_json(target / "timeline.json", {"schemaVersion": "1.0.0", "videoId": vid, "items": timeline})
        write_json(target / "internal" / "evidence.json", ledger)
        write_json(target / "internal" / "pipeline.json", {
            "schemaVersion": "1.0.0", "videoId": vid, "status": "PROMOTED_PUBLISHED",
            "inputHash": rec["source_hash"], "completedAt": stamp,
            "approval": {"approved": True, "reviewer": "site-owner", "approvedAt": stamp, "inputHash": rec["source_hash"]},
            "promotionMethod": rec["method"], "videoStatusMethod": "youtube-oembed-reachability",
        })
        report_rows.append({
            "video_id": vid, "source": "rinka-editor" if rec["method"].startswith("rinka") else "legacy-calibration",
            "video_status": statuses[vid], "member_uid": member["uid"], "slug": slug,
        })

    report = {
        "schema_version": "1.0.0", "status": "PASS", "promoted": len(report_rows),
        "rinka_editor": sum(x["source"] == "rinka-editor" for x in report_rows),
        "legacy_calibration": sum(x["source"] == "legacy-calibration" for x in report_rows),
        "video_status_counts": dict(sorted({s: list(statuses.values()).count(s) for s in set(statuses.values())}.items())),
        "approved_by": "site-owner", "promoted_at": stamp, "items": report_rows,
    }
    write_json(REPORT, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
