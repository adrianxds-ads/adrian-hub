# Study acceptance — 2026-10-08

Test target: released design versions from Hub 30.4.14, with the Phrasal START correction 0.12.9 and Hub registry 30.4.15. Tested on installed Windows Chrome headless at 411 × 801 and real Pixel 10 / Android 17 Chrome. Test sessions used a separate localhost origin and empty browser profiles. External requests were blocked in the isolated browser sessions; no real user progress or sync credentials were copied. No paid model calls were needed.

| App | Version | Observed functional result |
| --- | --- | --- |
| Adaptive English | 3.34.8 | 15/15; one saved session; survives reload |
| Phrasal Verbs | 0.12.9 | 15/15 after START fix; one saved session; survives reload |
| Pizarras | 2.1.12 | Quick session 15/15; one saved session; survives reload |
| Cloze | 1.10.12 | 15/15; one saved session; survives reload |
| Català Verbs | 0.9.12 | 15/15; one saved session; survives reload |
| Key Word Speaking | 1.0.8 | 15 transformations, 30/30; one saved session; survives reload |
| HOTI0108 | 2.6.11-read-first | 15/15; one round history entry; survives reload |
| Cambridge | 1.2.15 | Practice paper 11 Parts 1–4: 8/8, 8/8, 8/8, 6/6; four attempts survive reload |
| Biblioteca | 0.1.2 | 233 episodes; search, ascending/descending order, listened marker and reload persistence |

Cambridge retains 120 exercises; invoking correction again after grading did not add a second attempt. This test checks application grading against its own expected answer data, not independent academic validation of that answer bank.

Pizarras timed study: answered eight real UI questions, then simulated expiry by moving the test session deadline into the past. The session finished once, cleared activeSession and persisted after reload. Repeated finish/clock callbacks did not duplicate it. This was an expiry-condition regression, not an eight-minute wall-clock endurance test.

## Defect found and correction

Phrasal START raised a ReferenceError because startSession used sessionStarting without declaring it. Added sessionStarting=false to the existing runtime state declaration. No scoring, data schema, storage keys or question bank changed. App release 0.12.8 → 0.12.9, commit 8b02937. The initial failures remain in local test evidence; the corrected complete session passed without page errors.

The service-worker fixture normalized CRLF only for Hub. Extended normalization to all textual fixture responses to match release-build.py canonical LF hashes, and included Key Word in the suite. All nine installation, corrupt-build rejection, failed-precache cleanup and exact-query cache tests pass. Version Center consistency and release integrity pass; precache asset inventories have no missing files.

## Physical Pixel evidence

Real phone screenshot of Key Word home verified layout and version. Later, in the isolated test tab, a real touch opened native Gboard, ADB text input wrote "test", and the editor, sentence context and COMPROBAR stayed visible above the keyboard. Visual viewport shrank from about 801 to 409 CSS pixels. Screenshot reviewed visually. The previous foreground app was restored when the user had not changed apps.

The first attempt stopped at the phone lock. A subsequent automation attempt selected a background duplicate tab; that result was rejected, the foreground target corrected and the physical test rerun successfully. No lock bypass or keyboard settings changes.

## Limits

Live speech recognition/dictation and audible playback on the Pixel remain pending. SpeechRecognition availability alone does not establish a successful recording. Actual user cross-device synchronization, all scanned Cambridge exercises, long-duration endurance and every question-bank branch were not exercised. These tests establish completion and local persistence for the specific cases above.

## Reproduction and evidence

Harnesses are in tests/study-acceptance-20261008. They expect a Git-tracked snapshot of the repositories served at http://127.0.0.1:18766/<repository>/, installed Chrome and Playwright. They use isolated profiles and mute audio. The desktop fixture and detailed JSON/screenshots are under C:/Users/adria/agent-workbench/pixel-acceptance-20261008. These harnesses use test-internal answers to exercise real controls; they never import the user's progress.

Separate published-version and fingerprint verification is required before treating this report as proof of deployment.

## Publication verification

Hub 30.4.15 commit e8c6ee6 passed its Pages deployment. Public canonical hashes initially matched 54/56 verified files; only Phrasal app.js and build-assets.js still served 0.12.8. Its first deployment failed with a GitHub Pages HTTP 500 (run 37798830724); the failed job was rerun. This temporary deployment failure is distinct from the passing local 0.12.9 session. Final deployment verification follows below when available.

Final publication: a fresh complete Pages build (run 37800462613) succeeded. The public Phrasal 0.12.9 app.js matches SHA-256 69f2eecf1f3e2911b52f6e36cc1ce43c81632718153381d487b6f001a60b69fb. A clean public Chrome session started, answered all 15 questions, displayed 15/15, saved exactly one session and retained it after reload with no page errors. All 56 public verification fingerprints now match, including Hub 30.4.15 and Phrasal 0.12.9. The deployment block is resolved; the live-voice, audible-playback and real-user cross-device limitations above remain.

## Follow-up: remaining tests — 2026-10-08

This section supersedes the earlier untested voice/audio/transport status. It does not certify full progress reconciliation.

- Pixel playback: the real Easy Catalan catalog audio loaded, HTMLAudioElement.play resolved, readyState reached 4 and currentTime advanced to approximately 2.17 seconds on the physical Pixel. The previous app was restored. This is device playback/decoder evidence; no independent human listening verdict was supplied.
- Pixel microphone: getUserMedia returned a live audio track and measured nonzero input (maximum RMS approximately 0.0151). Actual SpeechRecognition events included audio, sound and speech detection, followed by a nonempty final transcript with confidence approximately 0.55. Raw recordings were not saved and the recognized utterance is excluded from public evidence. The synthesized target sentence was not matched, so this does not claim a complete scored English round by voice.
- Key Word full-sentence extraction: all 120 bank questions generated a valid full sentence from their expected gap; parseFullSentence extracted the answer and scoreTransformation returned 2/2 in every case. This checks the parser against its own bank, separately from microphone recognition.
- Real PC ↔ Pixel transport: a unique temporary marker written in the desktop browser reached the real Pixel profile. The Pixel changed it and the desktop subsequently read that change from the production endpoint. Markers were tombstoned on the server and removed from the desktop. The phone's final tombstone pull awaits its next unlocked session.
- Full app synchronization remains NOT APPROVED: Pixel flush reported incomplete and six existing pending keys were observed (Pizarras, Cloze, English, Phrasal, and the Cloze/English global-level keys). A successful marker round trip must not be presented as proof that these app histories have reconciled.

### Storage finding and bounded recovery

The Pixel origin held about 5,239,565 characters and a 10 KB diagnostic write raised QuotaExceededError. There were 39 recovery copies plus approximately 1.22 million characters of sync metadata. All recovery copies were archived under the existing private sync-server backups directory and the written backup reread and verified. Nine uncompressed copies were converted to the existing ADRIAN:GZIP:1 format, saving 163,799 characters. Every one of the 39 recovery copies still decoded to the exact original content. No quiz session, medal or garden field was deliberately edited. This relieved storage pressure but did not resolve the six pending progress states.

The physical phone locked during follow-up; no unlock bypass was attempted. Remaining work is to inspect the app conflict acknowledgements and reconcile preserved progress, then verify identical histories/counters and final marker cleanup on an unlocked Pixel. The report records the failure rather than declaring complete synchronization. No OpenRouter/model calls or infrastructure upgrade were required.

Evidence is appended to tests/study-acceptance-20261008/results.json. Recovery payloads remain private and are not included in the public repository.


## Cambridge Quiz 1.2.16 · tiempos · 2026-10-08

Incorporados tres tiempos: 180 segundos como valor inicial, media orientativa de examen (53/53/45 segundos) y sin límite. Tabla completa con 75 minutos, revisión, asterisco que identifica la propuesta de la IA y enlace a Cambridge. Preferencia persistente y modalidad registrada con cada respuesta.

Verificación: 18 rondas completas en Chrome a 412 y 1280 px; caducidad única, ausencia de caducidad sin límite, duración real, preferencia tras recarga y tabla sin desbordamiento. Captura móvil inspeccionada. Publicación 014414f verificada: siete archivos públicos coinciden con los hashes locales; UI pública móvil sirve 180/45 segundos, instala la nueva caché y elimina la anterior. GitHub Pages completado con éxito. Pruebas con perfiles aislados y sincronización bloqueada, sin utilizar el progreso real ni ocupar el Pixel. Registro del Hub: 01544e4.


## Cambridge 1.2.18 · Quiz por examen · 2026-10-08

Añadido Quiz por examen para los 30 exámenes, partes 1–3: ocho preguntas originales en orden, mismo contexto, corrección y tres tiempos. Quiz mezclado conserva quince preguntas. Exam points y Game points separados en ronda y resultado. Historial y medallas reconocen rondas de ocho y conservan las antiguas de quince.

Pruebas: 36 rondas completas a 412 y 1280 px, ambas rutas y los tres tiempos; respuestas del banco, puntos correctos, orden, repetición, caducidad, historial y recarga. Comprobadas las 90 partes del banco, con ocho preguntas únicas cada una. Capturas móviles de selector y marcadores revisadas. Publicación f9b8342: siete hashes públicos coinciden; Exam 01 completado con sus ocho preguntas en orden; ronda persiste y caché nueva elimina la anterior. Perfiles de prueba aislados, sincronización bloqueada y sin ocupar el Pixel. Registro: 9600eee.


## Cambridge 1.2.19 · tabla de exámenes · 2026-10-08

Lista vertical Exam 01–30 por parte: completado, veces, últimos fallos, mejores Exam points y Game points, jugar/repetir. Datos derivados de las rondas existentes, sin migración ni duplicación de progreso; excluye rondas parciales y Quiz mezclado. Gráfica ampliable de todo el histórico del modo por examen. Resultado con identidad Exam NN y parte; repetir, siguiente (misma parte y tiempo) y elegir desde la lista. El Exam 30 cierra la secuencia.

Verificado en 360/412/1280 px: lista de treinta filas, estados pendientes/completados, repeticiones, último error frente a mejor puntuación, independencia por parte, exclusión de siete respuestas parciales, recarga, navegación y límite Exam 30; gráfica con 39 registros conserva todo el historial. Captura móvil inspeccionada. Las 36 rondas de regresión siguen pasando. Publicación 23cf5dc: siete hashes coinciden; lista, Exam 01, paso a Exam 02, persistencia, apertura de gráfica ampliada y nueva caché con limpieza de la anterior verificados en origen público. Registro del Hub: b9a3f51. Perfiles aislados, sincronización bloqueada, sin ocupar el Pixel ni usar progreso real.


## Estrellas por aplicación · Hub 30.4.20 · 2026-10-08
Regla: estrellas locales=floor(oros de esa app/5); el Hub suma las estrellas locales. Las medallas y los restos hacia la siguiente estrella pertenecen a cada app. Indicador superior compacto con símbolo y cantidad, sin rótulo ni progreso global; jardín mantiene las estrellas ganadas. Corregido el inventario Cambridge para contar rondas completas, no respuestas, y el alias duplicado de Key Word. Historial sin cambios; ledger previo respaldado antes de recalcular.

Pruebas aisladas: 0/4/5/9/10 oros, 4+4=0 estrellas, 5+4=1, 10+5=3; medallas locales; Key Word sin duplicar; cinco rondas Cambridge perfectas de ocho respuestas dan cinco oros y una estrella, excluyendo ronda parcial y registro duplicado. Hub y jardín coinciden en móvil 412 px y escritorio 1280 px; indicador de menos de 85 px, captura revisada. Sin usar progreso real ni ocupar el Pixel.


Cierre de publicación de estrellas: Core 17d0718, Hub e7a6b40 (30.4.20) y las ocho apps adoptan el componente de estrellas locales; Cambridge 1.2.20. Verificados 39 archivos públicos por SHA-256. En origen público: 4+4 oros dan cero estrellas, 5+4 dan una; contador compacto y jardín coinciden. Key Word muestra una estrella local cuando el Hub suma tres (dos de English y una de Key Word), sin duplicar el alias anterior. Comprobaciones con perfiles aislados y sincronización bloqueada; no se ha modificado el progreso real durante las pruebas.
