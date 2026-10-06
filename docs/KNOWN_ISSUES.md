# Known Issues / Audit Queue

This file is an audit queue, not proof that every item is still reproducible. Each item must be verified against the current build before editing.

## Critical / state integrity
- Pizarras: a completed timed lesson has previously reached the final question and become stuck without recording completion/progress. Current `versions.json` claims a recovery fix in Pizarras 2.1.4; this must be independently reproduced and verified.
- Cross-device Hub state: progress/garden/shared game state has previously appeared on one device but not another. Verify current sync end-to-end on desktop and mobile.

## Hub control / UI
- Hub Control has had reports that minimize/hide/close behaviour and F8 invocation were absent or not observable in the served version. Verify code, deployed build and cached client separately.
- Version visibility must allow the user to confirm the Hub version and each app version/change history from the Hub itself.
- The Oca/path game should remain below the main Hub/garden content and must not obstruct primary navigation.

## Mobile
- Several apps have previously behaved worse on mobile than desktop. Audit touch targets, viewport layout, timers, answer transitions and final-state completion on a real mobile-sized viewport.

## Encoding / content quality
- `apps.json` currently contains visible mojibake in some subtitles (for example `ExÃ¡menes`, `automatizaciÃ³n`, `mÃ©tricas`). Confirm whether this is file encoding, terminal rendering or actually served text before fixing.

## Rule
When an issue is verified fixed, move it to the release notes/version history rather than silently deleting the evidence.