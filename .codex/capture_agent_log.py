#!/usr/bin/env python3
"""Append Codex prompt/response lifecycle events to an assignment session log."""

from __future__ import annotations

import datetime as dt
import fcntl
import json
import re
import sys
import tempfile
from pathlib import Path


AUTHOR = "KulsoomMujtaba"
PROJECT = "naano-rebuild"
TOOL = "codex-cli"
FALLBACK_MODEL = "gpt-5.6-sol"


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def model_from_transcript(transcript_path: str | None) -> str:
    if not transcript_path:
        return FALLBACK_MODEL
    model = None
    try:
        with Path(transcript_path).open(encoding="utf-8") as transcript:
            for line in transcript:
                record = json.loads(line)
                payload = record.get("payload", {})
                if record.get("type") == "turn_context" and payload.get("model"):
                    model = payload["model"]
                elif record.get("type") == "session_meta":
                    provenance = payload.get("base_instructions", {}).get("provenance", {})
                    model = provenance.get("model", model)
    except (OSError, ValueError, TypeError):
        pass
    return model or FALLBACK_MODEL


def new_log(session_id: str, timestamp: str, model: str) -> str:
    short_id = session_id[:8]
    date = timestamp[:10]
    return (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        f"model: {model}\n"
        f"tool: {TOOL}\n"
        f"project: {PROJECT}\n"
        "total_exchanges: 0\n"
        f"first_prompt_time: {timestamp}\n"
        f"last_prompt_time: {timestamp}\n"
        "---\n\n"
        f"# Session Log - {date}\n\n"
        f"Session: `{short_id}` | Project: `{PROJECT}` | Author: `{AUTHOR}`\n\n"
        "---\n"
    )


def update_header(log: str, event: str, timestamp: str, model: str) -> str:
    log = re.sub(r"(?m)^model: .*?$", f"model: {model}", log, count=1)
    if event == "UserPromptSubmit":
        prompts = len(re.findall(r"^\[LOG_ENTRY type=PROMPT ", log, flags=re.MULTILINE)) + 1
        log = re.sub(r"(?m)^total_exchanges: \d+$", f"total_exchanges: {prompts}", log, count=1)
        log = re.sub(r"(?m)^last_prompt_time: .*?$", f"last_prompt_time: {timestamp}", log, count=1)
    return log


def repository_root(cwd: Path) -> Path:
    for candidate in (cwd, *cwd.parents):
        if (candidate / ".git").exists():
            return candidate
    return cwd


def main() -> int:
    event = json.load(sys.stdin)
    event_name = event.get("hook_event_name")
    if event_name not in {"UserPromptSubmit", "Stop"}:
        return 0

    session_id = str(event["session_id"])
    timestamp = utc_now()
    model = model_from_transcript(event.get("transcript_path"))
    root = repository_root(Path(event.get("cwd") or Path.cwd()).resolve())
    log_dir = root / ".agent-logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    matching = list(log_dir.glob(f"*_{session_id}.md"))
    if matching:
        log_path = matching[0]
    else:
        filename_time = timestamp[:19].replace("T", "_").replace(":", "-")
        log_path = log_dir / f"{filename_time}_{session_id}.md"

    lock_path = Path(tempfile.gettempdir()) / "naano-agent-capture.lock"
    with lock_path.open("a+", encoding="utf-8") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        log = log_path.read_text(encoding="utf-8") if log_path.exists() else new_log(session_id, timestamp, model)
        log = update_header(log, event_name, timestamp, model)
        if event_name == "UserPromptSubmit":
            number = len(re.findall(r"^\[LOG_ENTRY type=PROMPT ", log, flags=re.MULTILINE)) + 1
            body = event.get("prompt", "")
            entry_type = "PROMPT"
        else:
            number = len(re.findall(r"^\[LOG_ENTRY type=RESPONSE ", log, flags=re.MULTILINE)) + 1
            body = event.get("last_assistant_message") or ""
            entry_type = "RESPONSE"
        entry = (
            f"\n\n[LOG_ENTRY type={entry_type} num={number} session={session_id[:8]}]\n"
            f"timestamp: {timestamp}\n"
            f"model: {model}\n\n"
            f"{body}\n"
        )
        log_path.write_text(log + entry, encoding="utf-8")
        fcntl.flock(lock, fcntl.LOCK_UN)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
