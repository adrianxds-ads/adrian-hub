# Sync 1.0.6 — candidato preparado el 7 de octubre de 2026

Estado final: **publicado y verificado tras autorización**. Sync 1.0.6 y Hub 30.1.3. Este documento conserva la preparación del candidato; el cierre actual figura en DEPLOYMENT-2026-10-07.md.

La unión automática cubre intentos Cambridge identificados. Conserva cada resultado completo, evita duplicados y mantiene como conflicto cualquier identificador con contenido distinto, metadatos incompatibles o registro sin identificador. Los contadores agregados de otras apps siguen preservados sin conciliación automática.

Versiones candidatas: Hub 30.1.3, Core/servidor Sync 1.0.6; english 3.34.2, phrasal-verbs 0.12.2, pizarras 2.1.6, b2-cloze 1.10.6, cambridge 1.2.9, catala 0.9.6, hoti0108 2.6.5-read-first.

Se prepararon pins, builds SHA-256, catálogo y referencias coherentes en los ocho consumidores. No se ejecutó sync-consumers.ps1 -Apply. No se modificaron repositorios de producción, estado, secretos, logs ni copias reales.

Pruebas pasadas: sync-integrity.cjs, sync-merge.cjs, test-versions.cjs, test-service-workers.cjs, test-precache.cjs, test-core-consumers.py, test-update-center.py y test-mobile.py (360×640, 390×844, 740×420). El estado del servidor y la sincronización se simularon para probar la unión sin alterar progreso real.

El ACK del servidor confirma únicamente el payload exacto. Cuando guarda una unión más completa, devuelve mergedKeys y obliga a descargarla; los clientes anteriores también siguen ese camino. El cliente respalda su historial antes de sustituirlo y conserva las uniones pendientes tras recarga.

## Commits

| Repositorio | Commit |
| --- | --- |
| adrian-core | b6773df |
| adrian-sync-server | 896486e |
| adaptive-english | 3842115 |
| adaptive-exam | 505463c |
| adaptive-hoti0108 | 6a66a8a |
| adaptive-phrasal-verbs | b4c97c3 |
| adaptive-pizarras | 3b613ad |
| adaptive-verbs-catala | 15a1577 |
| b2-multiple-choice-cloze | f4f0935 |

## Publicación completada

Publicar servidor y Core compatibles con preservación previa, después apps y Hub; comprobar huellas reales y transporte con una clave desechable. Las sesiones abiertas activan el nuevo worker al cerrarse naturalmente.

El usuario autorizó la publicación. Se verificaron 67 huellas servidas, servidor 1.0.6, interfaz pública, workers activos y transporte PC 1.0.6 ↔ Pixel 1.0.5. La unión se probó con datos sintéticos; la prueba real usó una clave desechable y conservó las diez claves de progreso protegidas.
