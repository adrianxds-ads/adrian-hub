# Retirada de avisos Sync en juegos · publicada el 02/11/2026

## Causa comprobada
Grammar Quest publicado muestra 3.36.20 y carga Core Sync 1.0.15.
El navegador de comprobación reprodujo el aviso exacto de la captura sin iniciar una partida.
`adrian-core/components/adrian-sync.js:status()` permite explícitamente crear el nodo
`adrianSyncStatus` en cuatro rutas de estudio para estados offline/conflict/blocked.
Los fallos de GET/POST activan offline; los temporizadores repiten la consulta cada 30 s.
El commit 39f19c5 del 31/10/2026 añadió la excepción y el texto del aviso.
El commit b0ec2a0 del 01/11 corrigió conflictos y colas, pero conservó esa excepción.
Por tanto no basta con quitar un mensaje de conflicto ni ocultar un nodo temporalmente.

El endpoint privado depende de la conectividad disponible. Esta sesión no accede al Pixel
ni al servidor privado: no se atribuye el fallo actual del usuario a DNS, VPN o CORS.
La caché puede retener el código anterior: los workers sirven JS desde su caché de release
y validan SHA-256. La existencia de una caché obsoleta en el Pixel NO se ha verificado.

## Cambio
Core Sync 1.0.16 emite los mismos eventos de diagnóstico y no crea overlays fuera del Hub.
Retira además un nodo legado si está presente. No se modifican guardado, recuperación,
protocolo, temporizadores, claves de progreso ni protección de base remota.
El Hub conserva su indicador. Ningún banner/toast/modal nuevo en los juegos.
Versiones candidatas: Grammar 3.36.21, Cloze 1.12.12, Català 0.10.21,
Phrasal 0.13.25 y Hub 30.5.32. Referencias de script/worker y manifiestos actualizados.
En la preparación no se subieron commits ni se publicó GitHub Pages. Tras la aceptación
QQS del usuario se publicó el cambio; véase el cierre de verificación. No se cambiaron datos reales.

## Verificación y límites
`node ../adrian-core/scripts/test_sync_no_game_overlay.cjs`: 12 escenarios con el módulo
completo en una VM desechable, DOM/HTTP/reloj simulados. Cinco rutas educativas, todos
los estados, reintentos repetidos, nodo legado, arranque sin body, Hub y origen aislado.
Historial sintético de 446 sesiones/6922 respuestas; nueva ronda offline 447/6937,
recarga con cola intacta, reconexión y confirmación remota, HTTP 503 y restauración
de remoto superior. No se generan sesiones personales ni peticiones al servidor real.
La misma prueba contra el código original falla por recreación del aviso.

No equivale a probar respuestas, pausa o reanudación en un navegador móvil real.
El navegador remoto no puede alcanzar el servidor local (ERR_CONNECTION_REFUSED).
Quedan pendientes prueba visual móvil, actualización de PWA instalada, IndexedDB
en navegador y sincronización real entre dispositivos. La sintaxis e integridad de
los candidatos se comprueban por separado. No declarar la reparación publicada.

Resultado final técnico: 12 escenarios VM aprobados; `node --check` aprobado en
Core y en app.js/service-worker.js de las cinco aplicaciones. 265/265 huellas
canónicas de cuatro juegos y Hub coinciden. Puerta obligatoria
`python tests/verify_study_manifests.py`: 173/173, cero fallos. Las cinco funciones
de integridad de caché aceptan Sync 1.0.16 y rechazan los bytes de 1.0.15.
Comparación normalizada contra origin/main confirma que los cuatro motores solo
cambian versión/notas, sin cambios de lógica educativa ni almacenamiento.
Commits locales de juegos: Grammar 5d91a2f, Cloze 50f778d, Català 0f2f782,
Phrasal 392fe2b; Core d4fe1ff. Esta fue la validación anterior a publicar.

## Publicación y reversión
Requiere autorización expresa de Adrián y superar las comprobaciones pendientes aplicables.
Publicar primero Core y después las apps/Hub con sus manifiestos correspondientes;
durante el cambio de Core a apps las huellas antiguas pueden rechazar una instalación nueva.
No limpiar localStorage, IndexedDB ni cachés durables de progreso. Las versiones anteriores
quedan en los padres de los commits locales para preparar reversión con huellas coherentes.


## Cierre de publicación verificado

Publicación autorizada mediante QQS en respuesta a la propuesta concreta de publicar.
El conector GitHub publicó árboles idénticos a los candidatos comprobados,
sobre las cabeceras remotas vigentes, sin forzar referencias ni sobrescribir otros cambios.
Commits funcionales publicados:
- Core Sync 1.0.16: 569b553d90214c958964d3e371b772304eaff95d.
- Grammar Quest 3.36.21: 55c7a6e50ed45ee851c29382912570aad865b2ed.
- Cloze Quiz 1.12.12: 04fa6ff3951a40e9955cf5780496c25bfb83c8d5.
- Conjuga CAT 0.10.21: 77bd678e2740019914c661ac3f1f357dd02e3e8e.
- Phrasal Sprint 0.13.25: ed259fe5ca33709f8628e1aa31dd31536579169e.
- Hub 30.5.32 y registro coherente: 465468e37ba59aabdd6711b7d2d18f759806112a.

Los seis despliegues GitHub Pages terminaron con éxito.
203/203 recursos públicos únicos comprobados por SHA-256 coinciden con las fuentes
publicadas: manifiestos de cuatro juegos/Hub, dependencias compartidas y versions.json.
El control obligatorio de manifiestos volvió a pasar sobre las cabeceras publicadas:
173/173 huellas, cero fallos. Los 12 escenarios VM vuelven a pasar sin modificaciones.

Chrome remoto abrió las cuatro URLs oficiales: versiones nuevas visibles y ausencia
del nodo adrianSyncStatus. Grammar 3.36.21 siguió sin aviso después de varias ventanas
de reintento y una recarga; Hub confirmó 30.5.32. Se observaron cargas iniciales
transitorias durante el despliegue, resueltas al completar la carga/recargar.
No se iniciaron partidas ni se generaron respuestas o sesiones personales.

Límites vigentes: estas comprobaciones son de publicación y portadas en Chrome remoto.
No acreditan una partida física en Pixel, actualización de su PWA instalada, IndexedDB
real del usuario ni conectividad con el servidor privado. Las simulaciones cubren
el guardado offline y la reconexión, pero no se presentan como sincronización física.
