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