# Publicación verificada de Adrián Hub — 7 de octubre de 2026

Estado: **Sync 1.0.6 y Hub 30.1.3 publicados y verificados**, con autorización expresa. Cierra la mejora adicional de conciliación Cambridge posterior a los seis bloques originales y su aceptación.

## Versiones publicadas

| Componente | Versión |
| --- | --- |
| Hub | 30.1.3 |
| Core / servidor Sync | 1.0.6 |
| Hub Control | 0.4.3 |
| Teclado compartido | 4.1.2 |
| english | 3.34.2 |
| phrasal-verbs | 0.12.2 |
| pizarras | 2.1.6 |
| b2-cloze | 1.10.6 |
| cambridge | 1.2.9 |
| catala | 0.9.6 |
| hoti0108 | 2.6.5-read-first |

## Resultado

Cambridge une historiales por identificador de intento, conserva resultados completos y evita duplicarlos al reenviar. Identificadores con datos incompatibles, registros antiguos sin id y metadatos diferentes siguen preservados como conflicto. Las otras apps conservan sus guardas; la conciliación automática de contadores agregados sigue abierta.

Servidor y Core se publicaron antes de sus consumidores. Se conservaron una referencia Git previa y un snapshot privado del estado antes del reinicio. El servidor arrancó con la misma revisión previa; ninguna restauración sobrescribió estado. Los repositorios reales se actualizaron por fast-forward y los archivos locales no comprometidos de Cambridge se preservaron.

## Pruebas

- 67 archivos realmente publicados coinciden con SHA-256 esperados.
- Navegador real sobre publicación: Hub 30.1.3, evidencia de versiones, Sync 1.0.6, Cambridge 1.2.9, contexto/foco/escritura y activación de service workers.
- PC con Chrome aislado Sync 1.0.6 → servidor real → Pixel con su perfil real Sync 1.0.5: pasó.
- Pixel → servidor real → PC: pasó.
- Escritura offline, recarga real del PC y entrega al Pixel al reconectar: pasó.
- Diez claves protegidas del Pixel y del servidor permanecieron idénticas a las copias previas. Revisión 257 → 261 por las operaciones de prueba.
- Clave desechable eliminada de ambos clientes; queda solo el marcador normal de borrado del servidor. Retirado el forward temporal ADB y devuelto el Pixel a ChatGPT.
- Unión conmutativa, asociativa e idempotente, colisiones, registros antiguos, reloj atrasado, ACK, recuperación y cola tras recarga: pruebas sintéticas pasadas.
- Cachés, precache, catálogo, consumidores, centro de actualización y móvil en tres tamaños: pasaron antes de publicar.

## Límites

La prueba real de transporte usa una clave desechable; no inventa resultados de ejercicios para forzar una unión en producción. La unión de historiales se verifica de forma aislada. El Pixel mantuvo su sesión 1.0.5 abierta para preservar continuidad; su actualización espera el cierre natural. La compatibilidad entre ambas versiones quedó probada. Las sesiones y workers abiertos pueden conservar la versión previa hasta cerrarse.

## Commits de código publicados

| Repositorio | Commit |
| --- | --- |
| adaptive-english | 3842115 |
| adaptive-exam | 505463c |
| adaptive-hoti0108 | 6a66a8a |
| adaptive-phrasal-verbs | b4c97c3 |
| adaptive-pizarras | 3b613ad |
| adaptive-verbs-catala | 15a1577 |
| b2-multiple-choice-cloze | f4f0935 |
| adrian-hub | eca96f0 |
| adrian-core | b6773df |
| adrian-sync-server | 896486e |

Los seis bloques iniciales constan en REPAIR-2026-10-07.md. El detalle del candidato adicional figura en SYNC-1.0.6-CANDIDATE.md. Este cierre añade commits documentales sin cambiar el código servido.
