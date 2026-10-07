# Key Word Speaking 1.0.3 · natural dictation
Reproduced: Hub's common large-text !important textarea rule reduced the actual answer font to 17 px. Whole-sentence extraction required both exact printed sides and missed one-sided context.

Changes: answer 32 px mobile / 40 px desktop; MIC extracts gap live with printed prefix, suffix, both, or only gap. Matched printed words stay blue. Context contractions normalized while spoken gap tokens retained. Valid gap-only responses protected from trimming. No word-limit-based cropping or answer completion. Gboard preview never changes composing text; explicit checking extracts context.

Tests: all 120 questions and every reference variant in four speech forms, at 390x844, 360x640, 1280x900. Mock speech event verifies live interim/final gap rendering, blue prefix/suffix, explicit-only 2/2 scoring and voice attribution. Original 15-question session, reload/persistence, extra-word, composing Enter and streak regressions pass. Grammar repository unchanged. Physical microphone/audio on Pixel not observed.

## Publication verified
K c1e6572 / Hub cd058f4. Public release fingerprints all match. Published tests pass on 390, 360 and 1280 px: mobile answer font 32 px, desktop 40 px; all reference variants in four speech forms; mock microphone interim/final events, precise persistent blue context and explicit scoring. Actual K 1.0.3 service-worker cache, offline reload/scoring and Hub 30.2.3 UI/activation pass. Grammar commit remains 53c3e9a4fcb94fdb5fa8d020427600552384ee0a.
