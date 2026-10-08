# Study acceptance — 2026-10-08

Test target: released design versions from Hub 30.4.14, with the Phrasal START correction 0.12.9 and Hub registry 30.4.15. Tested on installed Windows Chrome headless at 411 × 801 and real Pixel 10 / Android 17 Chrome. Test sessions used a separate localhost origin and empty browser profiles. External requests were blocked in the isolated browser sessions; no real user progress or sync credentials were copied. No paid model calls were needed.

| App | Version | Observed functional result |
| --- | --- | --- |
| Adaptive English | 3.34.8 | 15/15; one saved session; survives reload |
| Phrasal Verbs | 0.12.9 | 15/15 after START fix; one saved session; survives reload |
| Pizarras | 2.1.12 | Quick session 15/15; one saved session; survives reload |
| Cloze | 1.10.12 | 15/15; one saved session; survives reload |
| Català Verbs | 0.9.12 | 15/15; one saved session; survives reload |
| Key Word Speaking | 1.0.8 | 15 transformations, 30/30; one saved session; survives reload |
| HOTI0108 | 2.6.11-read-first | 15/15; one round history entry; survives reload |
| Cambridge | 1.2.15 | Practice paper 11 Parts 1–4: 8/8, 8/8, 8/8, 6/6; four attempts survive reload |
| Biblioteca | 0.1.2 | 233 episodes; search, ascending/descending order, listened marker and reload persistence |

Cambridge retains 120 exercises; invoking correction again after grading did not add a second attempt. This test checks application grading against its own expected answer data, not independent academic validation of that answer bank.

Pizarras timed study: answered eight real UI questions, then simulated expiry by moving the test session deadline into the past. The session finished once, cleared activeSession and persisted after reload. Repeated finish/clock callbacks did not duplicate it. This was an expiry-condition regression, not an eight-minute wall-clock endurance test.

## Defect found and correction

Phrasal START raised a ReferenceError because startSession used sessionStarting without declaring it. Added sessionStarting=false to the existing runtime state declaration. No scoring, data schema, storage keys or question bank changed. App release 0.12.8 → 0.12.9, commit 8b02937. The initial failures remain in local test evidence; the corrected complete session passed without page errors.

The service-worker fixture normalized CRLF only for Hub. Extended normalization to all textual fixture responses to match release-build.py canonical LF hashes, and included Key Word in the suite. All nine installation, corrupt-build rejection, failed-precache cleanup and exact-query cache tests pass. Version Center consistency and release integrity pass; precache asset inventories have no missing files.

## Physical Pixel evidence

Real phone screenshot of Key Word home verified layout and version. Later, in the isolated test tab, a real touch opened native Gboard, ADB text input wrote "test", and the editor, sentence context and COMPROBAR stayed visible above the keyboard. Visual viewport shrank from about 801 to 409 CSS pixels. Screenshot reviewed visually. The previous foreground app was restored when the user had not changed apps.

The first attempt stopped at the phone lock. A subsequent automation attempt selected a background duplicate tab; that result was rejected, the foreground target corrected and the physical test rerun successfully. No lock bypass or keyboard settings changes.

## Limits

Live speech recognition/dictation and audible playback on the Pixel remain pending. SpeechRecognition availability alone does not establish a successful recording. Actual user cross-device synchronization, all scanned Cambridge exercises, long-duration endurance and every question-bank branch were not exercised. These tests establish completion and local persistence for the specific cases above.

## Reproduction and evidence

Harnesses are in tests/study-acceptance-20261008. They expect a Git-tracked snapshot of the repositories served at http://127.0.0.1:18766/<repository>/, installed Chrome and Playwright. They use isolated profiles and mute audio. The desktop fixture and detailed JSON/screenshots are under C:/Users/adria/agent-workbench/pixel-acceptance-20261008. These harnesses use test-internal answers to exercise real controls; they never import the user's progress.

Separate published-version and fingerprint verification is required before treating this report as proof of deployment.

## Publication verification

Hub 30.4.15 commit e8c6ee6 passed its Pages deployment. Public canonical hashes initially matched 54/56 verified files; only Phrasal app.js and build-assets.js still served 0.12.8. Its first deployment failed with a GitHub Pages HTTP 500 (run 37798830724); the failed job was rerun. This temporary deployment failure is distinct from the passing local 0.12.9 session. Final deployment verification follows below when available.
