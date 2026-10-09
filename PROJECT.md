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


## Quiz learning release · 2026-10-09
Authorized by Adrián: implement audit recommendations directly through ChatGPT/DC, without paid model calls. Eight apps share a tested local feedback utility: correct gap completion or a gold reference card, a 1100 ms hold and guarded automatic advance. Answer time excludes correction hold. Original Cambridge course data/scans/keys and the consolidated Grammar bank are protected by baseline hashes.
Implemented: strict B2 exact grading/constraints (no heuristic partial credit), correction of one malformed training variant; timestamp review weights in Phrasal/B2/mixed Cambridge/Turismo and Quick Classroom; stable Grammar/Català candidate scoring and due-first plans with explicitly labelled extra practice; semantic Cloze targets; targeted ambiguity/distractor fixes; sixteen reviewed Phrasal contexts; optional written retrieval of known Cloze/Català forms and Classroom single-word recall; Català tier unlock by evidence while preserving previously seen tiers.
Session summaries are no longer truncated by app caps. Detailed attempts are archived in local IndexedDB before pruning the active window, with no pruning when archival fails. Export is user-triggered. No previously deleted history is reconstructed, no real sessions invented and cross-device archive replication is not claimed. Existing progress keys, IDs, scores and medals remain untouched. Recognition, written retrieval and delayed evidence are presented separately; no claim of certified mastery.
Future Grammar campaign: separate design only; no new running campaign or questions. Candidate scope: determiners/quantifiers, aspect contrasts, verb patterns with meaning changes, reduced relatives/participles, cohesion/reference, modality/register. Task types: open gaps, justified error correction, meaning-preserving reformulation and context-sensitive alternatives. Use varied contexts and delayed probes; quantity and speed do not demonstrate transfer. Expand only after a reviewed pilot, preserving campaign 1.
Acceptance: isolated Chrome profiles, mobile/desktop, correct/error hold, single advance, persistence, written recall, final Classroom question, Cambridge Parts 1–3, durable archive and archive-failure fallback. Physical Pixel and cross-device sync are separate checks; no real-user answers are generated by tests.
