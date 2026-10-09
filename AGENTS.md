# AGENTS.md

This repository is the control point for the Adrián Hub ecosystem.

## Mandatory workflow
1. Read `PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/KNOWN_ISSUES.md` and `docs/ACCEPTANCE_TESTS.md` before editing.
2. Inspect the real code and current Git status; never assume a task is already applied.
3. Preserve existing behaviour unless the requested change explicitly replaces it.
4. Prefer small, reversible diffs. Do not rewrite unrelated files.
5. Reproduce a bug before fixing it when practical.
6. After a change, run the relevant acceptance checks and verify the actual UI/state.
7. Never report "fixed", "done" or "deployed" only because code was edited; verify the result.
8. Do not overwrite uncommitted user work.
9. Version every functional release. `versions.json` is the Hub's version registry and changelog source.
10. When an app changes, update its own version and the Hub registry consistently.

## Cross-device rules
- Treat mobile and desktop as distinct test targets.
- Progress, stars, garden/game state and completed sessions must survive reloads and sync as designed.
- Service-worker/cache changes require an explicit stale-version check.

## Safety
- Never commit credentials, API keys, tokens or private URLs intended to remain local.
- Never force-push or delete branches without explicit approval.
- Keep a recoverable Git state before broad refactors.

## Completion report
For each task state: files changed, version changed, tests run, observed result, and any remaining uncertainty.
## Pixel UI sessions
Use the private bridge adb helper for Pixel UI work: it renews the temporary screen lease automatically. Direct ADB scripts must renew through agent/pixel_work_session.py before UI operations and release when done. Never disable the secure lock or change the user's normal timeout to keep a session awake. Device-side expiry is the recovery path if a session disconnects.
