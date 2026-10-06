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