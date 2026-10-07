# Keyboard Speak 1.0.4 / Claude repair agent
Claude Opus authored responsive sentence context, editor layout, viewport/focus behavior and guarded voice/IME changes. Integration review retained the published 1.0.3 baseline, corrected a synthetic IME test and stabilized action pointer taps after reproducing focus-induced layout movement.

Verified in headless Chrome: widths 360/390/412/1280, reduced 420px viewport, composition preserves text, IME Enter never submits, answer/check/next transitions, all canonical bank variants, full 15-question session and reload persistence. Existing natural dictation regression passes at 360/390/1280 with four speech forms, blue context, mock recognition, explicit scoring, wrong extra words and contractions. Physical Pixel keyboard and real audio were not observed.
The original 120-question banks, scoring, sync/Oca and stats schema are preserved. Existing offline release fingerprints regenerated.

Agent: agent/repair_agent.py; scoped text edits, atomic patch batches, trusted regression runner, credential manager, per-run spend guard, no arbitrary shell/deployment or question-bank edit capability. Original audit-only agent preserved.
