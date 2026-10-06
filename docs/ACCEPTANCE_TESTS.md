# Acceptance Tests

A change is complete only when the relevant checks pass and the observed result is recorded.

## Hub release check
- Load the Hub from a clean/fresh browser state.
- Confirm the visible Hub version matches `versions.json`.
- Confirm each visible app has the expected version/build metadata.
- Launch at least one external app and one bundled module successfully.
- Reload and confirm the Hub does not regress to stale assets.

## Pizarras completion check
- Start a normal timed lesson.
- Reach the final question / expiry condition.
- Confirm the session completes without freezing.
- Confirm progress is recorded exactly once.
- Reload/reopen and confirm completion persists.

## Cross-device progress check
- Make one identifiable progress change on device A.
- Allow the intended sync mechanism to complete.
- Open/reload on device B.
- Confirm the same progress/stars/garden/path state appears without duplicating rewards.

## Hub Control check
- Open Hub Control.
- Verify minimize/hide behaviour.
- Verify full close behaviour.
- Verify the configured keyboard shortcut (currently expected: F8) reopens/toggles it where supported.
- Confirm the control does not obstruct primary content on mobile.

## Mobile regression check
- Test portrait viewport and real touch interaction.
- Complete a full answer transition sequence.
- Confirm timers remain visible and usable.
- Confirm no final screen/action is unreachable below the fold.

## Release evidence
Record: date, tested version/build, device/browser, test result, failure notes, and commit hash.