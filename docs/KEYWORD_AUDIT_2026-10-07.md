# Key Word Speaking 1.0.1 audit
- Reproduced 1.0.0: compositionend rewrote full-sentence Gboard input.
- Fixed multiline answer sizing, composition/Enter handling, explicit-only extraction with exact printed boundaries, stale microphone callbacks and per-question voice flag.
- Immediate per-question 0/1/2 points and correct-answer streak; existing statistics key, medals and Oca preserved.
- Corrected eleven question references in K's local bank and all optional-word combinations.
- Tested 120 questions/all reference variants as gap and full sentence, 390x844 / 360x640 / 1280x900, full 15-question sessions, 14-error review, one saved session after reload, no horizontal overflow, long multiline response, no JavaScript errors.
- Edge tests: wrong full sentence retained, word count checked, composing Enter ignored, streak appears, duplicate submission ignored.
- Grammar/adaptive-exam and all other study repositories remain clean.
- Mobile tests emulate browser dimensions/composition; physical Pixel keyboard verification remains unobserved.
