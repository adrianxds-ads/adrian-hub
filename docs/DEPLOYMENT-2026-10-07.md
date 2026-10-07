# Publicación verificada de Adrián Hub — 7 de octubre de 2026

Estado final: **Hub 30.1.4 y Sync 1.0.7 publicados, probados y aceptados en PC↔Pixel real**. Los seis bloques iniciales, la mejora Cambridge 1.0.6 y la reconciliación automática determinista 1.0.7 quedan cerrados.

## Versiones finales

| Componente | Versión |
| --- | --- |
| Hub | 30.1.4 |
| Core / servidor Sync | 1.0.7 |
| Hub Control | 0.4.3 |
| Teclado compartido | 4.1.2 |
| english | 3.34.3 |
| phrasal-verbs | 0.12.3 |
| pizarras | 2.1.7 |
| b2-cloze | 1.10.7 |
| cambridge | 1.2.10 |
| catala | 0.9.7 |
| hoti0108 | 2.6.6-read-first |

## Qué cierra Sync 1.0.7

Sync 1.0.7 incorpora revisión-base por clave y fusión determinista de estados divergentes. El servidor conserva snapshots de ancestros y puede combinar contribuciones concurrentes sin sumar dos veces el mismo progreso.

La política cubre las campañas English/B2 Cloze/Català, Phrasal Verbs, Pizarras, HOTI0108, intentos Cambridge identificados, estrellas del Hub, Oca y el estado legacy del Path Game. Los estados comprimidos se normalizan antes de fusionar. Un conflicto que no puede demostrarse seguro se conserva en lugar de inventar progreso o destruir una rama.

El cliente mantiene baselines por dispositivo, envía `baseRevision`, adopta el resultado canónico devuelto por el servidor y conserva snapshots locales de recuperación para claves protegidas.

## Pruebas automáticas

- 12 pruebas específicas de política de fusión: campañas, Phrasal, Pizarras, HOTI, Cambridge, estrellas, Oca, Path Game, identidades incompatibles y pares seguros.
- Prueba de protocolo: rama A aceptada desde una base común, rama B fusionada desde esa misma base y contribuciones de ambos dispositivos preservadas.
- Integridad de cliente: `baseRevision`, adopción del resultado fusionado, estados comprimidos, borrados protegidos, recuperación, cola offline y conflictos no resolubles.
- Version Center, service workers, caches y coherencia de catálogo: pasaron.
- Consumo de Core, copias fallback, pins de Sync/Nav y fingerprints Git canónicos: pasaron.
- Móvil 360×640, 390×844 y 740×420: Hub Control, Cambridge Parts 2/3/4, foco, teclado y límites de campos: pasaron.
- 28 fingerprints de archivos públicos de las siete apps: verificados contra la publicación real.
- Hub público verificado como `30.1.4 / hub-30.1.4-20261007`.
- Core público y servidor verificados como Sync 1.0.7.

## Aceptación real PC↔Pixel de divergencia 1.0.7

La prueba final se realizó con Chrome real de Windows y el perfil real del Pixel 10, ambos en Sync 1.0.7.

Para no tocar respuestas ni puntuaciones se utilizó únicamente `adaptive_hoti0108_v1` y dos marcadores temporales en mapas de posición de navegación. No se modificaron intentos, rondas, puntos, exámenes ni historiales.

1. PC y Pixel partieron de la misma revisión-base HOTI 319.
2. PC creó una rama en `studyPositions` y Pixel otra distinta en `flashPositions`.
3. La rama PC fue aceptada en la revisión HOTI 321.
4. El servidor recibió la rama Pixel desde la base 319 y produjo un estado canónico que contenía **ambas contribuciones**.
5. El Pixel adoptó ese estado fusionado, quedó sin pendiente para HOTI y registró la nueva base.
6. Se restauró el valor HOTI previo mediante el protocolo normal de Sync. El servidor eliminó los marcadores y el Pixel quedó restaurado, sin pendiente, con base 330.
7. La comparación semántica final confirma que HOTI coincide exactamente con la copia previa a la prueba.
8. Las claves desechables de aceptación quedaron borradas; no queda ninguna clave de aceptación viva en el servidor.

Tras la prueba se retiró el forward ADB temporal. Chrome volvió a segundo plano/congelable y ChatGPT quedó otra vez en primer plano.

## Estado del progreso

La prueba final no alteró progreso de estudio. HOTI terminó con el mismo contenido semántico que antes de la aceptación. Las demás claves protegidas no fueron utilizadas para crear la divergencia.

Durante la aceptación hubo actividad normal de sincronización en otras apps; esos cambios legítimos se conservaron y no se restauraron desde snapshots antiguos.

## Política de conflictos restante

No queda pendiente una “fusión universal” como tarea de desarrollo. Sync 1.0.7 fusiona automáticamente los esquemas conocidos con reglas específicas. Los casos que violan invariantes o cuya identidad no es demostrable se mantienen como conflicto preservado **por diseño**, para priorizar integridad frente a una unión especulativa.

## Commits finales de código

| Repositorio | Commit |
| --- | --- |
| adrian-core | c3e3a83 |
| adrian-sync-server | 0b5ab96 |
| adrian-hub | fcd49a6 |
| adaptive-english | 6d3df03 |
| adaptive-exam | 0ce6d7f |
| adaptive-hoti0108 | 1eb5c93 |
| adaptive-phrasal-verbs | 5b352bf |
| adaptive-pizarras | c447b09 |
| adaptive-verbs-catala | 8656734 |
| b2-multiple-choice-cloze | 0b33737 |

Los seis bloques originales constan en `REPAIR-2026-10-07.md`. El candidato Cambridge anterior se conserva como historial en `SYNC-1.0.6-CANDIDATE.md`. Este documento representa el cierre final de la jornada.
