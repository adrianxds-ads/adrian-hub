# Study acceptance harnesses

See ../../docs/STUDY_ACCEPTANCE_2026-10-08.md for scope, versions and limitations.

These scripts target the existing local snapshot at C:/Users/adria/agent-workbench/pixel-acceptance-20261008/site, served at http://127.0.0.1:18766. They launch installed Chrome with Playwright, fresh browser contexts, muted audio and a request allowlist restricted to that localhost origin.

Run quiz-sessions.py, extra-session-tests.py, library-test.py and pizarras-expiry-test.py with Python. Outputs are written to the acceptance workbench, and approved evidence is copied to results.json. Quiz sessions choose the app's expected answers and exercise the actual controls. Pizarras expiry deliberately advances the deadline after eight UI answers. Cambridge uses practice paper 11 and checks four grades plus duplicate-correction protection.

A PASS does not certify live sync, microphone recognition, physical audio playback or independent correctness of the academic bank. The separate real Pixel keyboard test is recorded in the report/results rather than enabled automatically by these scripts.
