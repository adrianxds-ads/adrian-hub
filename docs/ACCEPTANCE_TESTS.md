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

## Nexo: reparación automática (2026-10-08, Agent Center 1.2.0)
- Activación opcional al iniciar una auditoría de Keyboard Speak: techo Auditor 0,35 + Reparador 1,65 = 2,00 USD.
- El servicio privado continúa la derivación sin panel abierto. El navegador recupera el mismo run; nunca vuelve a lanzar una llamada por recargar.
- El servidor vincula el informe completo al run del Auditor, rechaza parciales/fallos/dry-run/otra app y mantiene un registro persistente de deduplicación antes de iniciar trabajo con coste.
- El informe completo llega al Reparador sin recortes del textarea. La copia se mantiene aislada; se reproduce antes de cambiar y no se publica.
- Un informe de éxito requiere regresión aprobada después del último cambio; toda escritura invalida la prueba anterior. Nexo recoge informe y diff y vuelve a comprobar la identidad del run.
- Tests sin gasto: test_nexo_repair.py (guardas, deduplicación, pruebas fallidas/obsoletas), test_nexo_bridge_repair.py (servicio automático) y test_nexo_mission.py (390/1280, recarga, ruta automática, informe parcial, fallo final, contenido escapado).
- Limitación real: la última auditoría de Keyboard Speak sigue siendo parcial; este despliegue habilita la ruta, no demuestra una reparación de la app ni pruebas del teclado físico de Android.
