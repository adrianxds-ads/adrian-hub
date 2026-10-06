#!/usr/bin/env python3
from __future__ import annotations

import argparse
import fnmatch
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
HUB_ROOT = HERE.parent
WORKBENCH = HUB_ROOT.parent
CONFIG_PATH = HERE / "config.json"
RUNS_DIR = HERE / "runs"
TEXT_EXTS = {".md", ".txt", ".json", ".js", ".mjs", ".cjs", ".html", ".css", ".webmanifest", ".yml", ".yaml", ".py"}
SKIP_DIRS = {".git", "node_modules", "backups", "runs", "__pycache__"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def get_config():
    cfg = load_json(CONFIG_PATH)
    if cfg.get("mode") != "audit-only":
        raise RuntimeError("This agent version only supports audit-only mode.")
    return cfg


def safe_path(relative: str, cfg: dict, allow_root: bool = False) -> Path:
    rel = Path(relative or ".")
    target = (WORKBENCH / rel).resolve()
    target.relative_to(WORKBENCH.resolve())
    parts = target.relative_to(WORKBENCH).parts
    if not parts:
        if allow_root:
            return target
        raise ValueError("Workbench root is not a readable file target.")
    if parts[0] not in cfg["allowed_repositories"]:
        raise ValueError("Path is outside the allowed repository set.")
    if any(part in SKIP_DIRS for part in parts):
        raise ValueError("Path is in an excluded directory.")
    return target


def git_info(repo: str, cfg: dict) -> dict:
    if repo not in cfg["allowed_repositories"]:
        raise ValueError("Repository is not allowed.")
    root = WORKBENCH / repo
    def run(*args):
        p = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, encoding="utf-8", errors="replace")
        return p.stdout.strip() if p.returncode == 0 else p.stderr.strip()
    return {
        "repo": repo,
        "branch": run("branch", "--show-current"),
        "head": run("rev-parse", "--short", "HEAD"),
        "status": run("status", "--short") or "clean"
    }


def inventory(cfg: dict) -> list[dict]:
    return [git_info(repo, cfg) for repo in cfg["allowed_repositories"]]


def list_tool(args: dict, cfg: dict) -> str:
    relative = args.get("path", ".")
    depth = min(max(int(args.get("depth", 2)), 0), 4)
    root = safe_path(relative, cfg, allow_root=True)
    base_depth = len(root.parts)
    rows = []
    for current, dirs, files in os.walk(root):
        here = Path(current)
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if len(here.parts) - base_depth >= depth:
            dirs[:] = []
        for name in sorted(dirs):
            rows.append("DIR  " + str((here / name).relative_to(WORKBENCH)))
        for name in sorted(files):
            p = here / name
            if p.suffix.lower() in TEXT_EXTS:
                rows.append("FILE " + str(p.relative_to(WORKBENCH)))
        if len(rows) >= 250:
            rows.append("...truncated...")
            break
    return "\n".join(rows) or "(empty)"


def read_tool(args: dict, cfg: dict) -> str:
    path = safe_path(str(args.get("path", "")), cfg)
    if not path.is_file() or path.suffix.lower() not in TEXT_EXTS:
        raise ValueError("Only known text files may be read.")
    max_lines = int(cfg["max_read_lines"])
    start = max(1, int(args.get("start", 1)))
    end = min(int(args.get("end", start + max_lines - 1)), start + max_lines - 1)
    lines = path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    end = min(end, len(lines))
    body = [f"{i}: {lines[i-1]}" for i in range(start, end + 1)]
    return f"FILE {path.relative_to(WORKBENCH)} lines {start}-{end}/{len(lines)}\n" + "\n".join(body)


def search_tool(args: dict, cfg: dict) -> str:
    query = str(args.get("query", ""))
    if not query:
        raise ValueError("Search query is required.")
    root = safe_path(str(args.get("path", ".")), cfg, allow_root=True)
    pattern = str(args.get("glob", "*"))
    limit = int(cfg["max_search_matches"])
    hits = []
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in TEXT_EXTS:
            continue
        if any(part in SKIP_DIRS for part in p.relative_to(WORKBENCH).parts):
            continue
        if not fnmatch.fnmatch(p.name, pattern):
            continue
        try:
            text = p.read_text(encoding="utf-8-sig", errors="replace")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            if query.casefold() in line.casefold():
                hits.append(f"{p.relative_to(WORKBENCH)}:{i}: {line[:500]}")
                if len(hits) >= limit:
                    return "\n".join(hits) + "\n...truncated..."
    return "\n".join(hits) or "(no matches)"


def bootstrap_context(cfg: dict) -> str:
    docs = [
        "adrian-hub/AGENT_BOOTSTRAP.md",
        "adrian-hub/AGENTS.md",
        "adrian-hub/PROJECT.md",
        "adrian-hub/docs/ARCHITECTURE.md",
        "adrian-hub/docs/KNOWN_ISSUES.md",
        "adrian-hub/docs/ACCEPTANCE_TESTS.md",
        "adrian-hub/docs/ECOSYSTEM_MANIFEST.json",
        "adrian-hub/docs/AGENT_FIRST_AUDIT.md",
    ]
    blocks = []
    for rel in docs:
        path = safe_path(rel, cfg)
        blocks.append(f"\n===== {rel} =====\n" + path.read_text(encoding="utf-8-sig", errors="replace"))
    blocks.append("\n===== LIVE GIT INVENTORY =====\n" + json.dumps(inventory(cfg), ensure_ascii=False, indent=2))
    return "".join(blocks)


SYSTEM = """You are the independent senior software auditor for the Adrian Hub ecosystem.
This is PASS 1: AUDIT ONLY. You have no permission to modify code, commit, push, deploy, or run arbitrary shell/network commands.
Never trust release notes as proof. Inspect code and Git state, seek counterexamples, and distinguish confirmed defects from hypotheses.
Reply on every turn with EXACTLY one JSON object and no markdown outside it.
Allowed actions:
{"action":"list","path":"adaptive-pizarras","depth":2}
{"action":"read","path":"adaptive-pizarras/app.js","start":1,"end":250}
{"action":"search","path":"adrian-core","query":"localStorage","glob":"*.js"}
{"action":"git_status","repo":"adrian-core"}
{"action":"report","content":"Final audit report in Spanish..."}
Use tools economically. Prefer targeted reads/searches instead of asking for whole repositories.
The final report must be in Spanish and include severity, evidence, affected files, reproduction logic, proposed fix, confidence, and what you could not verify.
Keep the final report concise: prioritize the 5 most important findings and stay within the report character limit provided by the harness.
Do not claim a bug is reproduced unless the evidence supports that claim.
"""


def parse_action(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].lstrip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        if start < 0:
            raise
        decoder = json.JSONDecoder()
        obj, _ = decoder.raw_decode(cleaned[start:])
        return obj


def call_anthropic(messages: list[dict], system: str, model: str, max_tokens: int):
    import anthropic
    client = anthropic.Anthropic()
    response = client.messages.create(model=model, system=system, max_tokens=max_tokens, messages=messages)
    text = "".join(block.text for block in response.content if getattr(block, "type", "") == "text")
    usage = {
        "input_tokens": int(getattr(response.usage, "input_tokens", 0) or 0),
        "output_tokens": int(getattr(response.usage, "output_tokens", 0) or 0),
    }
    return text, usage


def token_cost(usage: dict, model_cfg: dict) -> float:
    return (
        usage.get("input_tokens", 0) * float(model_cfg["input_usd_per_million"]) / 1_000_000
        + usage.get("output_tokens", 0) * float(model_cfg["output_usd_per_million"]) / 1_000_000
    )


def estimated_call_ceiling(messages: list[dict], system: str, max_tokens: int, model_cfg: dict) -> float:
    chars = len(system) + sum(len(str(m.get("content", ""))) for m in messages)
    est_input_tokens = max(1, chars // 2)  # deliberately conservative for budget guarding
    return (
        est_input_tokens * float(model_cfg["input_usd_per_million"]) / 1_000_000
        + max_tokens * float(model_cfg["output_usd_per_million"]) / 1_000_000
    )


def run_tool(action: dict, cfg: dict) -> str:
    name = action.get("action")
    if name == "list":
        return list_tool(action, cfg)
    if name == "read":
        return read_tool(action, cfg)
    if name == "search":
        return search_tool(action, cfg)
    if name == "git_status":
        return json.dumps(git_info(str(action.get("repo", "")), cfg), ensure_ascii=False, indent=2)
    raise ValueError(f"Unsupported action: {name}")


def call_openai(messages: list[dict], system: str, model: str, max_tokens: int):
    from openai import OpenAI
    client = OpenAI()
    response = client.responses.create(
        model=model,
        instructions=system,
        input=messages,
        max_output_tokens=max_tokens,
    )
    text = getattr(response, "output_text", "") or ""
    usage_obj = getattr(response, "usage", None)
    usage = {
        "input_tokens": int(getattr(usage_obj, "input_tokens", 0) or 0),
        "output_tokens": int(getattr(usage_obj, "output_tokens", 0) or 0),
    }
    return text, usage


def provider_api_key(provider: str) -> str | None:
    env_name = {
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "openrouter": "OPENROUTER_API_KEY",
    }.get(provider)
    if env_name and os.environ.get(env_name):
        return os.environ[env_name]
    if provider == "openrouter":
        try:
            import keyring
            return keyring.get_password("AdrianHubAgent", "openrouter")
        except Exception:
            return None
    return None


def call_openrouter(messages: list[dict], system: str, model: str, max_tokens: int):
    from openai import OpenAI
    client = OpenAI(api_key=provider_api_key("openrouter"), base_url="https://openrouter.ai/api/v1")
    chat_messages = [{"role": "system", "content": system}, *messages]
    response = client.chat.completions.create(model=model, messages=chat_messages, max_tokens=max_tokens)
    text = response.choices[0].message.content or ""
    usage_obj = getattr(response, "usage", None)
    usage = {
        "input_tokens": int(getattr(usage_obj, "prompt_tokens", 0) or 0),
        "output_tokens": int(getattr(usage_obj, "completion_tokens", 0) or 0),
    }
    return text, usage


def call_model(messages: list[dict], system: str, model: str, max_tokens: int, model_cfg: dict):
    provider = model_cfg["provider"]
    api_model = model_cfg.get("api_model", model)
    if provider == "anthropic":
        return call_anthropic(messages, system, api_model, max_tokens)
    if provider == "openai":
        return call_openai(messages, system, api_model, max_tokens)
    if provider == "openrouter":
        return call_openrouter(messages, system, api_model, max_tokens)
    raise ValueError(f"Unsupported provider: {provider}")


def required_key_present(provider: str) -> bool:
    return bool(provider_api_key(provider))


def recover_partial_report(text: str) -> str | None:
    """Best-effort recovery when a report JSON was truncated by the model limit."""
    marker = '"content"'
    pos = text.find(marker)
    if pos < 0 or '"report"' not in text[:pos]:
        return None
    colon = text.find(':', pos + len(marker))
    if colon < 0:
        return None
    quote = text.find('"', colon + 1)
    if quote < 0:
        return None
    fragment = text[quote + 1:].rstrip()
    # A complete JSON would already have parsed. Here we expect a truncated JSON string.
    # Trim only a small damaged suffix (e.g. trailing backslash / partial escape) until
    # the JSON string itself can be decoded safely.
    for trim in range(0, min(32, len(fragment)) + 1):
        candidate = fragment[:-trim] if trim else fragment
        if not candidate:
            break
        try:
            recovered = json.loads('"' + candidate + '"')
        except json.JSONDecodeError:
            continue
        recovered = recovered.strip()
        return recovered or None
    return None


def save_partial_report(content: str, meta: dict, reason: str) -> Path:
    notice = (
        "INFORME PARCIAL RECUPERADO AUTOMÁTICAMENTE\n\n"
        f"Motivo: {reason}\n"
        "El contenido siguiente procede de la última respuesta del auditor y puede terminar de forma abrupta.\n\n"
    )
    return save_report(notice + content, meta)


def save_report(content: str, meta: dict) -> Path:
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = RUNS_DIR / f"{stamp}-audit.md"
    header = (
        "# Independent agent audit\n\n"
        f"- Model: `{meta['model']}`\n"
        f"- Provider: `{meta['provider']}`\n"
        f"- Turns: {meta['turns']}\n"
        f"- API cost recorded: ${meta['cost']:.6f}\n"
        f"- Workbench: `{WORKBENCH}`\n\n"
    )
    path.write_text(header + content.strip() + "\n", encoding="utf-8")
    return path


def audit(args, cfg: dict) -> int:
    model = args.model or cfg["default_model"]
    if model not in cfg["models"]:
        print(f"Unknown model: {model}", file=sys.stderr)
        return 2
    model_cfg = cfg["models"][model]
    provider = model_cfg["provider"]
    mission = args.mission or "Execute the first independent audit described in adrian-hub/docs/AGENT_FIRST_AUDIT.md."
    context = bootstrap_context(cfg)
    messages = [{"role": "user", "content": f"MISSION:\n{mission}\n\nBOOTSTRAP CONTEXT:\n{context}"}]
    first_ceiling = estimated_call_ceiling(messages, SYSTEM, int(cfg["max_output_tokens_per_turn"]), model_cfg)
    if args.dry_run:
        print(json.dumps({
            "mode": cfg["mode"],
            "provider": provider,
            "model": model,
            "api_key_present": required_key_present(provider),
            "budget_usd": cfg["max_usd_per_run"],
            "estimated_first_call_ceiling_usd": round(first_ceiling, 6),
            "max_turns": cfg["max_turns"],
            "repositories": len(cfg["allowed_repositories"]),
            "mission": mission,
        }, ensure_ascii=False, indent=2))
        return 0
    if not required_key_present(provider):
        print(f"No {provider} API key is available in the process environment. No request was sent.", file=sys.stderr)
        return 3
    spent = 0.0
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    transcript_path = RUNS_DIR / (datetime.now().strftime("%Y%m%d-%H%M%S") + "-transcript.jsonl")
    force_report_turn = int(cfg.get("force_report_turn", cfg["max_turns"]))
    max_report_chars = int(cfg.get("max_report_chars", 9000))
    recovery_report_chars = int(cfg.get("recovery_report_chars", 5500))
    last_partial_report = None
    last_partial_reason = None
    def log_event(payload: dict):
        with transcript_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(payload, ensure_ascii=False) + "\n")
    for turn in range(1, int(cfg["max_turns"]) + 1):
        finalizing = turn >= force_report_turn
        if finalizing:
            limit = recovery_report_chars if last_partial_report else max_report_chars
            messages.append({"role": "user", "content": (
                "FINALIZATION REQUIRED: stop investigating and return the final audit now using action=report. "
                f"The report content MUST be <= {limit} characters. Prioritize at most 5 findings, compress evidence, "
                "include uncertainty for anything not verified, and do not request another tool. "
                "Return exactly one complete JSON object; no markdown outside JSON."
            )})
        if finalizing:
            max_tokens = int(cfg.get("recovery_output_tokens", 1800) if last_partial_report else cfg.get("final_output_tokens", 2600))
        else:
            max_tokens = int(cfg["max_output_tokens_per_turn"])
        ceiling = estimated_call_ceiling(messages, SYSTEM, max_tokens, model_cfg)
        if spent + ceiling > float(cfg["max_usd_per_run"]):
            if last_partial_report:
                path = save_partial_report(last_partial_report, {"model": model, "provider": provider, "turns": turn - 1, "cost": spent}, last_partial_reason or "budget guard")
                print(json.dumps({"ok": True, "partial": True, "report": str(path), "cost_usd": round(spent, 6), "turns": turn - 1, "warning": "budget guard used recovered partial report"}, ensure_ascii=False, indent=2))
                return 0
            print(f"Budget guard stopped before turn {turn}: ${spent:.6f} spent; next-call ceiling ${ceiling:.6f}. Transcript: {transcript_path}", file=sys.stderr)
            return 4
        text, usage = call_model(messages, SYSTEM, model, max_tokens, model_cfg)
        spent += token_cost(usage, model_cfg)
        log_event({"turn": turn, "type": "model", "usage": usage, "cost_total": spent, "text": text})
        try:
            action = parse_action(text)
        except Exception as exc:
            recovered = recover_partial_report(text) if finalizing else None
            if recovered:
                last_partial_report = recovered
                last_partial_reason = f"turn {turn}: {exc}"
            messages.append({"role": "assistant", "content": text or "(empty response)"})
            if finalizing:
                messages.append({"role": "user", "content": (
                    "FORMAT/TRUNCATION ERROR: your previous report was not valid complete JSON. "
                    f"Retry with action=report and content <= {recovery_report_chars} characters. "
                    "Use fewer findings and shorter evidence. Return exactly one complete JSON object."
                )})
            else:
                messages.append({"role": "user", "content": "FORMAT ERROR: your previous reply was not one valid JSON object. Return exactly one JSON object using one allowed action. No markdown, no prose outside JSON."})
            log_event({"turn": turn, "type": "format_error", "error": str(exc), "partial_report_recovered": bool(recovered)})
            continue
        if action.get("action") == "report":
            report = str(action.get("content", "")).strip()
            path = save_report(report, {"model": model, "provider": provider, "turns": turn, "cost": spent})
            print(json.dumps({"ok": True, "report": str(path), "cost_usd": round(spent, 6), "turns": turn}, ensure_ascii=False, indent=2))
            return 0
        try:
            result = run_tool(action, cfg)
        except Exception as exc:
            result = "TOOL ERROR: " + str(exc)
        log_event({"turn": turn, "type": "tool", "action": action, "result": result[:20000]})
        messages.append({"role": "assistant", "content": text})
        messages.append({"role": "user", "content": "TOOL RESULT:\n" + result[:80000]})
    if last_partial_report:
        path = save_partial_report(last_partial_report, {"model": model, "provider": provider, "turns": int(cfg["max_turns"]), "cost": spent}, last_partial_reason or "max turns reached")
        print(json.dumps({"ok": True, "partial": True, "report": str(path), "cost_usd": round(spent, 6), "turns": int(cfg["max_turns"]), "warning": "max turns reached; recovered partial report saved"}, ensure_ascii=False, indent=2))
        return 0
    print("Max turns reached without a final report.", file=sys.stderr)
    return 5


def doctor(cfg: dict) -> int:
    issues = []
    rows = inventory(cfg)
    for row in rows:
        if row["branch"] != "agent-workbench-2026-10-06":
            issues.append(f"{row['repo']}: unexpected branch {row['branch']}")
    try:
        import anthropic  # noqa: F401
        anthropic_ok = True
    except Exception:
        anthropic_ok = False
        issues.append("Anthropic Python SDK is not installed.")
    try:
        import openai  # noqa: F401
        openai_ok = True
    except Exception:
        openai_ok = False
        issues.append("OpenAI Python SDK is not installed.")
    model = cfg["default_model"]
    provider = cfg["models"][model]["provider"]
    result = {
        "ok": not issues,
        "mode": cfg["mode"],
        "workbench": str(WORKBENCH),
        "default_model": model,
        "default_provider": provider,
        "default_api_key_present": required_key_present(provider),
        "budget_usd": cfg["max_usd_per_run"],
        "anthropic_sdk": anthropic_ok,
        "openai_sdk": openai_ok,
        "repositories": rows,
        "issues": issues,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not issues else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only local AI auditor for the Adrián Hub workbench")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("doctor", help="Validate the isolated workbench without making API calls")
    sub.add_parser("inventory", help="Show repository branches, commits and Git status")
    p_audit = sub.add_parser("audit", help="Run the autonomous read-only audit")
    p_audit.add_argument("--dry-run", action="store_true", help="Show configuration and cost ceiling without an API request")
    p_audit.add_argument("--model", help="Override the configured model")
    p_audit.add_argument("--mission", help="Override the default audit mission")
    args = parser.parse_args()
    cfg = get_config()
    if args.command == "doctor":
        return doctor(cfg)
    if args.command == "inventory":
        print(json.dumps(inventory(cfg), ensure_ascii=False, indent=2))
        return 0
    if args.command == "audit":
        return audit(args, cfg)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
