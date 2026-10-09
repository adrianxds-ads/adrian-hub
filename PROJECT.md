# Adrián Hub — Project Contract

## Purpose
Adrián Hub is the launcher and coordination layer for a personal ecosystem of study, productivity, work and utility apps. It must remain understandable and maintainable by different AI coding agents, not by one chat history.

## Source of truth
- App registry: `apps.json`
- Hub/app versions and release notes: `versions.json`
- Hub shell: `index.html`, `app.js`, `styles.css`
- Offline/cache layer: `service-worker.js`
- Shared progress/storage: `progress-storage.js`
- Path/Oca game: `hub-path-game.js`
- Bundled apps: `apps/`
- External app repositories: each `apps.json` entry with a `repo` field

## Current ecosystem
Public study apps include Adaptive English, Adaptive Phrasal Verbs, Pizarras, B2 Multiple-Choice Cloze, Cambridge B2, Català · Verbs and HOTI0108. Bundled modules include Adaptive Gym, Cambio, DC Inbox, Hub Control and Job Engine. Limpieza is private.

## Product principles
- The Hub is the common entry point.
- User progress is more important than visual polish: never lose a completed lesson/session.
- Mobile behaviour is a first-class requirement.
- Cross-device state must be explicit and testable.
- The version shown to the user must correspond to the code actually being served.
- A release is not complete until the relevant acceptance tests pass.

## Agent portability goal
Any capable coding agent should be able to enter this repository, understand the system from repository documentation, inspect linked app repositories, reproduce reported issues, make a bounded patch, test it, version it and leave a clear audit trail.
## OpenRouter provider adapter 1.1.0 — 2026-10-09
- The quiz audit attempt returned empty final responses; no comprehensive quiz report was produced.
- Tiny live probe with reasoning effort low: final OK, finish_reason stop, reported cost $0.000172.
- Compact real Phrasal Sprint excerpt via the patched adapter: complete action=report JSON, finish_reason stop, zero reasoning tokens reported, cost $0.016380, conservative ceiling $0.028140. This verifies transport and parsing, not a full app audit.
- Opus requests now specify low reasoning effort. SDK automatic retries are disabled. Empty final text raises a diagnostic failure; the Auditor records finish_reason, generation ID, token usage and provider cost and stops without another paid call. Internal reasoning text is neither logged nor treated as a report.
- Offline tests verify a complete response, cost accounting, empty length response, one-call stop and budget finalization. Existing spending caps and read-only permissions are unchanged.
- Exact cause of the earlier empty responses cannot be established from their incomplete captured metadata. Output exhaustion is a probable explanation, not a verified provider root cause.
- Next: audit individual current applications with compact evidence packages; protected Cambridge originals and the consolidated Grammar campaign remain untouched.
