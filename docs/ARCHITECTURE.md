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

## Nexo mission tracking · 2026-10-08 · Hub 30.4.19 / Agent Center 1.1.0
Nexo starts the existing read-only Auditor after route/budget confirmation, tracks its run ID and mission in browser-local storage, polls status, and collects only a report verified against that run before and after retrieval. Reload resumes observation without repeating a paid call. Inactive/unsupported routes do not start execution. Partial, failed, preflight and superseded runs cannot prepare repair; a complete Keyboard Speak audit can prepare a reviewable 1600-character mission excerpt, without starting repair or publishing. Generic audits cannot invoke the fixed Keyboard Speak repair target. Browser-local history does not synchronize between devices; closing the panel does not stop the PC worker. ChatGPT conversation memory/result transfer remains manual.
Verification: intercepted API tests at 390x844 and 1280x800 cover single launch, reload, partial stop, complete handoff, text escaping, changed run rejection and no automatic repair. Existing real partial audit 20261008-204949-opus recovered at both widths, persisted across reload, and repair stayed disabled; zero POST/model calls. Mobile screenshot visually inspected. No Keyboard Speak product patch. Additional API cost: 0 USD. Next: complete a compact reproducible diagnostic, then review the prepared repair mission.

Publication acceptance 2026-10-08: public Hub 30.4.19 / Agent Center 1.1.0 registry confirmed, five changed UI/cache assets matched canonical bytes. Extended inactive-route and non-Keyboard repair-target tests passed in both viewports. Real previous report recovery remains verified with zero new model calls. Mission control release commit a9919ef; following test fixture correction supplies its request after reload.


## Nexo: reparación automática (2026-10-08, Agent Center 1.2.0)
- Activación opcional al iniciar una auditoría de Keyboard Speak: techo Auditor 0,35 + Reparador 1,65 = 2,00 USD.
- El servicio privado continúa la derivación sin panel abierto. El navegador recupera el mismo run; nunca vuelve a lanzar una llamada por recargar.
- El servidor vincula el informe completo al run del Auditor, rechaza parciales/fallos/dry-run/otra app y mantiene un registro persistente de deduplicación antes de iniciar trabajo con coste.
- El informe completo llega al Reparador sin recortes del textarea. La copia se mantiene aislada; se reproduce antes de cambiar y no se publica.
- Un informe de éxito requiere regresión aprobada después del último cambio; toda escritura invalida la prueba anterior. Nexo recoge informe y diff y vuelve a comprobar la identidad del run.
- Tests sin gasto: test_nexo_repair.py (guardas, deduplicación, pruebas fallidas/obsoletas), test_nexo_bridge_repair.py (servicio automático) y test_nexo_mission.py (390/1280, recarga, ruta automática, informe parcial, fallo final, contenido escapado).
- Limitación real: la última auditoría de Keyboard Speak sigue siendo parcial; este despliegue habilita la ruta, no demuestra una reparación de la app ni pruebas del teclado físico de Android.


## Nexo: trabajo simultáneo y continuidad · 2026-10-09 · Agent Center 1.3.0
Estado verificado:
- Ciclo real Auditor → Reparador → regresión: audit 20261009-141652-opus-977500 ($0.189184), repair 20261009-141724-291500 ($0.309188), total $0.498372. Informe final y tests exit 0; no fallo reproducido, ningún archivo cambiado, sin publicación de Keyboard Speak.
- Ese ciclo usó la antigua base 1.0.4. Al observar Pixel/publicación 1.0.9 se sincronizó el checkout del Auditor a 057c9f5 y se creó una nueva base limpia keyboard-speak-baseline-20261009-nexo. Regresión de la nueva base aprobada a 360/390/412/1280. Nunca se extrapola el diagnóstico de la base antigua a la versión actual.
- /agents/nexo/mission y /agents/nexo/context componen la misión desde snapshots e informes existentes y recuperan el vínculo del ledger. Son consultas, sin llamadas al modelo. Dos navegadores nuevos 390/1280 recuperan mismo run, fase, costes e informes y persisten tras recargar.
- Copiar resultado y Continuar en ChatGPT conservan la petición y el resultado asociado. El pegado en ChatGPT sigue siendo una acción del usuario; no hay memoria conversacional sincronizada ni inyección automática en un chat.
- Los resultados con regresión aprobada y diff vacío aparecen como sin fallo reproducido/pruebas aprobadas, no como parche generado.
- specialist_contracts.json define alcance, entradas, salidas y límites. Tester ejecuta regresión dentro del Reparador; Constructor y Editor están preparados pero sin ejecutor activo. Cambridge tiene auditoría; reparación automática pendiente de regresión específica.
- Pixel físico: app pública 1.0.9 abierta y árbol de accesibilidad leído; Chrome informa soporte de micrófono. No se logró completar enfoque/teclado: retorno a ChatGPT y timeout de uiautomator tras 8 s. Teclado físico y dictado real siguen pendientes; no se puntuó una respuesta ni se completó sesión.
Siguiente trabajo: prueba física breve de teclado/micrófono, ejecutores concretos de Constructor/Editor y regresión de Cambridge. Mantener las nuevas funciones compartidas y conservar la revisión previa a publicación.


## Pixel: protección temporal de pantalla · 2026-10-09 · Agent Center 1.3.1
- Estado original real: screen_off_timeout=60000, stay_on_while_plugged_in=0, lock_screen_lock_after_timeout=30000.
- Android ofrece cmd power set-wakelock acquire/release SCREEN_BRIGHT_WAKE_LOCK. Nexo usa ese bloqueo temporal de suspensión; no modifica ajustes de pantalla, carga, PIN ni bloqueo seguro.
- El helper adb del servicio renueva una concesión de 600 s antes de input, uiautomator, screencap, monkey y am start/start-activity/startservice. Lecturas de estado y procesos de PC no renuevan la concesión.
- Guardian en el propio Pixel libera el wake lock al caducar la concesión incluso si desaparece el PC/ADB. Un reinicio de Android elimina el wake lock; se reconoce boot_id para limpiar el estado del guardián. Renovaciones no acumulan referencias.
- Verificación física aprobada: adquisición, caducidad de 5 s comprobada tras 8 s sin heartbeat, renovación doble con refCount=1, liberación explícita y activación automática por screencap del bridge. Los tres ajustes originales permanecieron iguales. La prueba terminó con el wake lock liberado.
- Alcance: operaciones de Nexo vía bridge/helper. Scripts que usen ADB directamente deben llamar pixel_work_session. No permite saltar un PIN ni evita un bloqueo manual solicitado por el usuario.


### Pixel: lectura fresca y prueba parcial (2026-10-09)

Keyboard Speak 1.0.9 abre Gboard y muestra texto escrito en una captura física. La frase completa y el dictado quedan pendientes: hubo cambios de aplicación entre operaciones. No se completó ninguna sesión ni se generó un parche de la app. La orientación se restauró y la protección temporal se liberó. Sin llamadas adicionales a modelos.

El puente privado elimina el XML anterior antes de uiautomator, permite 25 segundos para el volcado y exige un archivo nuevo no vacío. Rechaza mensajes ERROR incluso con código de salida cero. El test test_pixel_ui_freshness.py --bridge comprueba orden, error con salida cero y ausencia de XML nuevo: tres casos aprobados sin tocar el teléfono.


## Constructor y Editor vía ChatGPT · 2026-10-09 · Agent Center 1.4.0
Ambos disponibles como preparación local de encargos y continuación manual en ChatGPT, sin API adicional ni ejecutor autónomo. Constructor exige encargo, alcance y aceptación; Editor exige encargo, original o ubicación y criterios de estilo/conservación. Borradores separados en este navegador; no se afirma sincronización entre dispositivos. Copia completa, alternativa manual si falla el portapapeles, y botón de continuación al puente existente. Cambiar una entrada invalida el paquete preparado. Triaje deriva a formularios reales. No se modifica el original ni se publica desde el formulario.
Verificación: 33 casos de triaje, estado compartido y servidor aislado aprobados; pruebas Playwright a 390/1280 de derivación, entradas, recarga, paquete íntegro, texto literal, fallo de portapapeles, invalidación y continuación sin solicitudes de ejecución. Captura móvil inspeccionada. No se ha construido una app ni editado un documento de usuario: esta entrega configura el recorrido.


## Podcast garden — 2026-10-09 — Hub 30.4.34 / Biblioteca 0.4.0
Rex uses the existing AdrianGarden 1.3.0 renderer and registry with currentApp=null, retaining the Hub overview layout, live progress/snapshots, stars and shared solarState. Scene refreshes on task entry, foreground return, storage changes and sync notification. No task/reward records are written by the scenery module. Garden updates use existing sync data; this release does not establish new cross-device synchronization.
Verification: isolated Edge 412x915, 915x412 and 1280x800: nine plants, identical solar palette and earned-star count, no overflow or page errors. Existing task-mode regression passed portrait and landscape. Physical Pixel not tested. Cleaning flower beds remain a design proposal; private Limpieza scoring unchanged. Next: agree concrete task-to-flower rules before implementing cleaning growth.


## Cottage garden — 2026-10-09 — Hub 30.4.36 / Biblioteca 0.5.0
Shared Hub-local garden-cottage.js adds a fixed SVG cottage and deterministic cumulative plant details to the existing overview renderer in the Hub and Rex task journey. 250 plants, 20 details per plant, 5,000 completed task blocks; total block statistics continue above the visual cap. Seeds/stems/leaves/flowers and occasional climbing plants appear in stable order without revealing a mature preview to the learner. Existing trees, solar atmosphere and Adaptive stars are unchanged.
Growth derives read-only from adrianEasyCatalanTaskSessionsV1, completed status only, deduplicating IDs within libraryId (default easy-catalan). Repeated completed episodes with distinct session IDs count. Current saved completed/recovered sessions contribute; no fabricated history or new reward store. Existing task medals are replaced by cottage progress in the Hub and Biblioteca. Private Limpieza records/algorithms are not modified.
Future collections can share the task history contract with libraryId; importing or adding Six Minute English audio/catalogue is not implemented by this release. Reuse existing synchronization; cross-device propagation was not newly verified. Same-page updates notify after successful history persistence. Scenery does not change task audio, scoring or persistence. Cache shell includes both cottage and task-garden scripts.
Acceptance: isolated Edge 360/412/915/1280, completed vs interrupted/listening, duplicate IDs, library namespacing, deterministic detail counts 0/1/2/19/20/21/4999/5000, persistence and identical two-step growth in Hub/Rex, nine original trees, zero JS errors/overflow. Existing portrait/landscape task flow and 52 release fingerprints passed. Mobile image inspected; proportions corrected to preserve SVG aspect ratio. Physical Pixel and cross-device sync not tested. Next: add new podcast collections when chosen, retaining the shared history contract and growth.


### Luminous 1.1 · Hub 30.4.44 · 10/10/2026
Reproducido: letras claras sobre pastel, medallas cero atenuadas, objetivos/HUD pequeños, listas y panel común de estadísticas con mezcla de superficies. Corregido en hub-editorial.css y hoja canónica nucleo-game-theme.css, con copias idénticas en ocho apps.
Verificado en Chrome aislado: 136 pantallas/estados a 360/390/412/1280, cero overflow horizontal/errores JS y cero fallos de contraste de superficies sólidas en el recorrido probado; fondos con degradado y pantallas principales también inspeccionados visualmente. Controles y ayudas revisados, respuestas desde 20 px y datos de progreso intactos.
Regresión: 14 recorridos de respuesta correcta/error/espera/avance/guardado; Classroom final único; bancos y materiales protegidos; teclado Cambridge Parts 2/3/4 a 360/390/740 y escritorio; nueve cachés con rechazo de build corrupto/consulta obsoleta; 54 fingerprints Hub y registros coherentes. Las pruebas no usan almacenamiento personal.
Límites: no prueba física Pixel ni sincronización real entre dispositivos. Publicación se verifica contra bytes y versiones efectivamente servidos por separado.
