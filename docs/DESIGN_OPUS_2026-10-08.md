# Claude design release — 2026-10-08

Nine scoped copies were repaired with Claude Opus. The original Keyboard Speak repair agent stays unchanged. The new design agent supports allowlisted study repositories with only HTML/CSS/README writes, no shell/network/deploy tools, budget guards and mandatory successful regression before final report.

Changes:
- adaptive-english 3.34.7 → 3.34.8
- adaptive-phrasal-verbs 0.12.7 → 0.12.8
- adaptive-pizarras 2.1.11 → 2.1.12
- b2-multiple-choice-cloze 1.10.11 → 1.10.12
- adaptive-exam 1.2.14 → 1.2.15
- adaptive-keyword-speaking 1.0.7 → 1.0.8
- adaptive-verbs-catala 0.9.11 → 0.9.12
- adaptive-hoti0108 2.6.10-read-first → 2.6.11-read-first
- biblioteca 0.1.1 → 0.1.2

Validation: three headless Chrome viewports (360, 390, 1280 px) per app; no horizontal page overflow or uncaught page errors; all original DOM IDs and inline scripts preserved; original app.js differs only in APP_VERSION; a localStorage sentinel survives reload. These checks do not establish actual user cross-device sync or physical Pixel keyboard, microphone or audio behavior. Early missing bundled Playwright browser errors were corrected by using installed Chrome and the first three tests independently rerun successfully.

Agent run total: 1.8855 USD, excluding the prior audit. Account key ceiling remains 15 USD. Cache manifests and Version Center regenerated using canonical LF hashes.

Pixel screenshots in the prior audit remained white; physical visual review remains pending.

## Published verification

Published Hub 30.4.14 and all nine app releases. Verified all 41 public file fingerprints against the release catalog. Clean headless Chrome at 390 px loaded and reloaded every public app, kept the expected APP_VERSION, had no uncaught page errors or horizontal page overflow, and exercised statistics navigation where present; Biblioteca search and order toggling passed. Earlier isolated tests covered 360/390/1280 px. OpenRouter key usage after these repairs: 10.882750 USD, remaining key allowance 4.117250 USD, ceiling unchanged at 15 USD. This is the API-key allowance, not the account credit balance. Physical Pixel visual, microphone and keyboard checks remain pending.
