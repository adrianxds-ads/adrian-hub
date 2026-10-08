# Architecture

## Hub layer
`adrian-hub` is the launcher/PWA and the coordination point. It owns the app registry, visible version center, shared navigation and bundled modules.

## External repositories
The study applications are separate Git repositories referenced from `apps.json`. The Hub must not silently duplicate their business logic. A change to an external app should normally be made in that app's repository, then reflected in `versions.json`.

## Shared state
`progress-storage.js` and related Hub code coordinate shared progress/state. Cross-device behaviour must be verified rather than inferred from localStorage alone.

## Shared UI/core
The Hub consumes shared Adrián Core assets. Cache/service-worker behaviour can make deployed code differ from what a device displays, so every release must distinguish source version, deployed version and cached client version.

## Versioning
`versions.json` is the user-visible registry for Hub and app versions, builds and changes. `apps.json` is the launch registry. These files must remain consistent.

## Testing surfaces
1. Desktop browser.
2. Pixel/mobile browser or installed PWA.
3. Fresh load/private cache state where relevant.
4. Reload/reopen after progress is written.
5. Cross-device state when the feature is intended to sync.

## Agent model
Agents are replaceable operators. Repository documentation and tests, not a vendor-specific chat history, define expected behaviour.
## Nexo · 2026-10-08
Single visible coordinator for Núcleo Matrix: conversation handoff to ChatGPT, internal triage and local read-only self-audit. Legacy API and training IDs remain compatible. One card and one visible training profile; internal routing assessment retained. ChatGPT mission handoff uses clipboard and the existing public bridge, without automatic memory or execution sharing.

Acceptance 2026-10-08: active private service verified in fresh headless Chrome 390×844 and 1280×800; one Nexo card/profile, real local routing to repair, seven diagnostic checks, clipboard mission handoff to public ChatGPT bridge, no JS errors or horizontal overflow. 31 routing cases and seven self-audit checks passed; isolated bridge tests passed; 45 release assets passed fingerprints. Physical Pixel and shared ChatGPT memory are not claimed. Next step: use Nexo through the existing project URL.

Release confirmed: Hub 30.4.16 and Agent Center 1.0.0 publicly served; seven changed entry/cache/coordinator assets matched canonical local bytes. Private Nexo UI 1.0.0 also verified. Integration commit 640bfd1.

Nexo 1.0.1 / Hub 30.4.17 · 2026-10-08: explicit audit-first requests route Auditor → Reparador → Tester; inactive specialists have no dead transfer button. Active private service passed 390x844 and 1280x800 transfer checks plus 33 routing cases. Live audit exposed stale isolated Hub checkout and omitted adaptive-keyword-speaking allowlist; repository access added, isolated checkout synchronized after commit. Automatic pipeline execution and conversation memory sharing remain unimplemented.

Nexo workflow closure · 2026-10-08 20:51 Europe/Madrid · Hub 30.4.18 / Agent Center 1.0.2. Earlier dead transfer issue resolved: explicit Auditor → Reparador → Tester order, inactive controls hidden; 33 routing cases, 390/1280 live transfer UI, seven self-audit checks and 45 release assets passed. Auditor isolated Hub now on canonical sources; adaptive-keyword-speaking permitted and read. Budget close regression passes without exceeding $0.35. Live final audit 20261008-204949-opus cost $0.287100, partial=true; real report displayed in Hub. Three live diagnostic runs total $0.810772 ($0.307036 + $0.216636 + $0.287100). Report incomplete, no Keyboard Speak defect reproduced and no app patch applied. Automatic specialist sequencing, automatic return to Nexo conversation, physical Pixel voice/keyboard remain unverified/unimplemented. Next: concise mission-specific audit with reproducible evidence before enabling a repair.
