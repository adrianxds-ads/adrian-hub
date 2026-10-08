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
## Nexo real mission acceptance · 2026-10-08 19:40 Europe/Madrid
Tested active Agent Center 1.0.0 / Hub 30.4.16 through private service, Chrome headless 390x844. Mission: "Comprueba Keyboard Speak: teclado que tapa la respuesta, tipografía y micrófono. Audita primero y repara solo errores reproducibles; verifica móvil y escritorio y conserva progreso."
Observed: route selects inactive Tester (97%) followed by Reparador. Clicking #triageGo transfers to neither auditMission nor repairMission (both empty). End-to-end coordination FAIL; no autonomous pipeline or automatic result collection verified. Repair mission manually supplied by test: preflight PASS, issues=[], run 20261008-193940-repair-dry, AI cost 0 USD; no repair/report/diff generated.
Independent trusted regression: agent/test_keyboard_ui.py on keyboard-speak-production-opus-20261007 PASS at 360,390,412,1280: composition/Enter, reduced viewport, bank, 15 transitions, persistence, console. Simulations do not verify physical Pixel microphone or keyboard. No product code/version/deployment changed. Next: correct workflow priority for audit-first mixed requests and represent inactive routes without dead transfer controls; then repeat this same mission and verify report handoff.

Nexo workflow closure · 2026-10-08 20:51 Europe/Madrid · Hub 30.4.18 / Agent Center 1.0.2. Earlier dead transfer issue resolved: explicit Auditor → Reparador → Tester order, inactive controls hidden; 33 routing cases, 390/1280 live transfer UI, seven self-audit checks and 45 release assets passed. Auditor isolated Hub now on canonical sources; adaptive-keyword-speaking permitted and read. Budget close regression passes without exceeding $0.35. Live final audit 20261008-204949-opus cost $0.287100, partial=true; real report displayed in Hub. Three live diagnostic runs total $0.810772 ($0.307036 + $0.216636 + $0.287100). Report incomplete, no Keyboard Speak defect reproduced and no app patch applied. Automatic specialist sequencing, automatic return to Nexo conversation, physical Pixel voice/keyboard remain unverified/unimplemented. Next: concise mission-specific audit with reproducible evidence before enabling a repair.
