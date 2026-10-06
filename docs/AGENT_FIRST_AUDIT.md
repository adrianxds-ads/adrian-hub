# AGENT_FIRST_AUDIT.md

## Objective
Act as an independent senior software auditor. Assume previous ChatGPT work may contain mistakes. Find defects or architectural risks that are supported by evidence.

## Phase 1 — Read only
Do not modify any file. Do not commit. Do not deploy.

## Required checks
1. Confirm every repository HEAD matches `ECOSYSTEM_MANIFEST.json` and report deviations.
2. Trace cross-device persistence end-to-end: app localStorage -> `adrian-sync.js` -> sync server -> second-client reconciliation. Look for loss, regression, conflict, stale-revision or deletion hazards.
3. Inspect service-worker/cache behavior for stale builds and mismatched version reporting.
4. Verify Pizarras completion is idempotent and cannot lose a timed class at the final transition.
5. Verify Hub Version Center claims correspond to code actually served and that build identifiers are meaningful.
6. Audit mobile-critical layouts/interactions: viewport overflow, touch targets, timers, overlays, final screens and Hub Control visibility/minimize/close/F8 behavior.
7. Check that shared components copied into individual apps have not drifted from the canonical Core implementation.
8. Look for encoding/mojibake regressions without blindly re-encoding files.
9. Identify untracked/generated files that could affect reproducibility.
10. Run syntax/static/runtime smoke checks that do not mutate persistent user data.

## Report format
For each finding provide:
- Severity: P0/P1/P2/P3
- Repository + file/line or function
- Evidence
- Reproduction steps or test used
- Root cause
- Minimal proposed fix
- Risk of the proposed fix
- Confidence: high/medium/low

Finish with:
- Top 5 priorities
- Items checked and found healthy
- Items not verifiable and why
- Exact HEADs observed

Do not say an issue is fixed; this mission is audit-only.