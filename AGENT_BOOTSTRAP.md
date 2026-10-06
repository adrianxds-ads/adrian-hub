# AGENT_BOOTSTRAP.md

## Purpose
This file is the entry point for any external AI agent working on the Adrián Hub ecosystem.

## Workspace
Open `C:\Users\adria\agent-workbench\Adrian-Ecosystem.code-workspace`.
All repositories in this workspace are isolated Git worktrees on branch `agent-workbench-2026-10-06`. The user's normal working copies under `C:\Users\adria\...` must not be edited from this workspace.

## Mandatory reading order
1. `AGENTS.md`
2. `PROJECT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ECOSYSTEM_MANIFEST.json`
5. `docs/KNOWN_ISSUES.md`
6. `docs/ACCEPTANCE_TESTS.md`
7. `docs/AGENT_FIRST_AUDIT.md`

## Operating contract
- First pass is READ-ONLY audit. Do not edit, commit, merge, deploy, install packages, change service-worker caches, alter persistent state, or call external paid APIs.
- Treat current code as evidence, not as proof of correctness.
- Reproduce reported bugs when practical.
- Check Git status and exact HEAD before and after every task.
- Never use `main`/`master` for experimental changes.
- Never force-push, delete branches, rewrite Git history, or commit credentials/state/backups.
- A claim of "fixed" requires a reproducible test and observed result.
- For UI bugs, inspect both desktop and mobile-sized behavior.
- For state bugs, test reload and cross-device/sync semantics where possible.

## First mission
Run the independent audit defined in `docs/AGENT_FIRST_AUDIT.md` and produce a report only. Do not change code during that mission.

## Later repair mode
Only after explicit approval, fix one confirmed issue at a time. Each repair must include: root cause, minimal diff, test, version/build update when functional behavior changes, and a commit on the workbench branch.