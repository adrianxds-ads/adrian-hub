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

Aceptación de servicio activo (2026-10-09): Agent Center 1.3.0, dos perfiles limpios 390/1280 contra el servidor privado real; misma misión y fase sin cambios, exportación completa y recarga aprobadas, cero POST/llamadas al modelo. 49 assets coinciden con fingerprints. Código principal ecd5593. El estado de auditoría y reparación sobrevive al reinicio controlado. La publicación pública se comprueba por separado de este servicio privado.


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

Servicio activo verificado tras despliegue (2026-10-09): commit 7773eac, Hub 30.4.31 / Agent Center 1.4.0. Repetidos recorridos de Constructor y Editor a 390/1280 contra la interfaz activa; endpoints reales /triage y /nexo/mission confirman ambos activos en modo chatgpt-handoff, coste cero y autonomous=false. UI servida 1.4.0 confirmada. Sin nuevas llamadas a modelos ni publicación de una aplicación/documento de usuario.


## Quiz learning acceptance · 2026-10-09 · Hub 30.4.32
Fourteen app/viewport checks passed at 390 and 1280 px, plus Cambridge Parts 1–3 at both sizes. Verified: gold correct answer, hold, single advance, reload persistence, written retrieval, final Classroom completion; all protected Grammar/Cambridge hashes unchanged. Archive retained 1300 distinct attempts with repeated question ID across reload, active window 1200; unavailable archive keeps all detail. Planner simulations: ten rounds per Grammar/Català with unseen items, 15 new and zero early reviews, one score per candidate. Bank IDs/counts/options and Cloze JSON/JS mirror passed. No real-user sessions, API calls or physical Pixel tests. Publication and cache fingerprints verified separately. Old discarded detail and cross-device replication of the local archive remain outside this release.


### Quiz patch verification — 2026-10-09
Grammar assessment retains 30 questions even with all items known and not due. Cloze written alternatives tested against source-key variants: like, everybody and illnesses; original Cambridge sources remain byte-identical. Tests run in isolated browser contexts; no real learner sessions.


### Luminous 1.1 · Hub 30.4.44 · 10/10/2026
Reproducido: letras claras sobre pastel, medallas cero atenuadas, objetivos/HUD pequeños, listas y panel común de estadísticas con mezcla de superficies. Corregido en hub-editorial.css y hoja canónica nucleo-game-theme.css, con copias idénticas en ocho apps.
Verificado en Chrome aislado: 136 pantallas/estados a 360/390/412/1280, cero overflow horizontal/errores JS y cero fallos de contraste de superficies sólidas en el recorrido probado; fondos con degradado y pantallas principales también inspeccionados visualmente. Controles y ayudas revisados, respuestas desde 20 px y datos de progreso intactos.
Regresión: 14 recorridos de respuesta correcta/error/espera/avance/guardado; Classroom final único; bancos y materiales protegidos; teclado Cambridge Parts 2/3/4 a 360/390/740 y escritorio; nueve cachés con rechazo de build corrupto/consulta obsoleta; 54 fingerprints Hub y registros coherentes. Las pruebas no usan almacenamiento personal.
Límites: no prueba física Pixel ni sincronización real entre dispositivos. Publicación se verifica contra bytes y versiones efectivamente servidos por separado.
