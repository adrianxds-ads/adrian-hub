# Known Issues / Audit Queue

This file is an audit queue, not proof that every item is still reproducible. Each item must be verified against the current build before editing.

## Critical / state integrity
- Pizarras historical final-question freeze: verified against 2.1.4 on 2026-10-06 with an expired 89-answer session; completion was recorded once and `activeSession` cleared. Keep as regression test.
- Cross-device Hub state: Core Sync 1.0.3 fixes the confirmed rejected-regression path and passed a protocol simulation. Real desktop/mobile end-to-end verification remains pending.

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