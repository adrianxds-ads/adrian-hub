# Key Word Speaking 1.0.2 audit
- Reproduced 1.0.0: compositionend rewrote full-sentence Gboard input.
- Fixed multiline answer sizing, composition/Enter handling, explicit-only extraction with exact printed boundaries, stale microphone callbacks and per-question voice flag.
- Immediate per-question 0/1/2 points and correct-answer streak; existing statistics key, medals and Oca preserved.
- Corrected eleven question references in K's local bank and all optional-word combinations.
- Tested 120 questions/all reference variants as gap and full sentence, 390x844 / 360x640 / 1280x900, full 15-question sessions, 14-error review, one saved session after reload, no horizontal overflow, long multiline response, no JavaScript errors.
- Edge tests: wrong full sentence retained, word count checked, composing Enter ignored, streak appears, duplicate submission ignored.
- Grammar/adaptive-exam and all other study repositories remain clean.
- Mobile tests emulate browser dimensions/composition; physical Pixel keyboard verification remains unobserved.

- Offline reload reproduced missing scripts because cache keys ignored versioned query variants; K service worker now uses ignoreSearch with release SHA-256 validation.

## Published verification
- K commit 2bcffa9; Hub functional release cee5e5b, versions K 1.0.2 / Hub 30.2.2.
- All ten public release fingerprints match local SHA-256 evidence.
- Actual service worker activation and expected K cache build passed.
- Offline reload, question rendering and correct-answer scoring passed.
- Actual Hub 30.2.2 visible UI and service-worker activation passed.
- All app working trees checked clean; Grammar commit unchanged at 53c3e9a4fcb94fdb5fa8d020427600552384ee0a.
