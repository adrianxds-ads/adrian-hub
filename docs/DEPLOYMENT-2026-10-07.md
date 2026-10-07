# Publicación verificada de Adrián Hub — 7 de octubre de 2026

Estado: **publicado y comprobado**, tras la aprobación del usuario. Sin gasto en APIs externas.

## Versiones activas

| Componente | Versión |
| --- | --- |
| Adrián Hub | 30.1.2 |
| Adrian Sync cliente/guardas servidor | 1.0.5 |
| Cambridge | 1.2.8 |
| Teclado compartido | 4.1.2 |
| Hub Control en Chrome | 0.4.3 |

- Core se publicó y verificó antes de publicar consumidores. Servidor actualizado y comprobado por health.
- Las siete apps y el Hub se publicaron por fast-forward, sin force push.
- Se integraron los cambios de producción posteriores al candidato: corrección de arranque de Sync, centro de actualización y modo de escritura con contexto de Cambridge.
- ACTUALIZAR TODO prepara versiones sin borrar primero las cachés anteriores. Distingue archivos publicados de apps abiertas y cuenta correctamente instalaciones fallidas.
- La extensión se recargó mediante su propio control en Chrome. La página de detalles confirma 0.4.3, habilitada y con el mismo identificador y ruta.
- El trabajo local previo 0.4.2 se conserva en el commit y rama indicados abajo. Los archivos no comprometidos visual-timer.js/css de Cambridge se mantuvieron intactos.
- Los repositorios reales se actualizaron mediante fast-forward. No se tocaron secretos o credenciales.

## Validación

- 67 archivos públicos coinciden exactamente con sus huellas SHA-256 esperadas, incluidos recursos del Hub, siete apps, módulos incluidos y Core compartido.
- Smoke sobre las webs realmente publicadas: Hub 30.1.2, evidencia de versiones, diálogo, Sync 1.0.5 y activación real del service worker.
- Cambridge publicado: 1.2.8, contexto de escritura, foco, letra escrita, anterior/siguiente, campo visible, cierre de teclado y service worker activado.
- Estos navegadores de prueba usaron almacenamiento nuevo y llamadas Sync simuladas; no escribieron progreso en el servidor real.
- La integración pasó pruebas de sincronización, SW, Version Center, consumidores, móvil en tres tamaños y actualización conservando cachés/datos.
- Las pruebas iniciales de los seis bloques constan en REPAIR-2026-10-07.md.

Archivo de progreso del servidor idéntico al snapshot anterior al despliegue: **sí**. Health final: revisión 246, 49 entradas.

Se preservaron snapshots locales del estado antes de reiniciar. La primera comprobación de fuente provocó un rollback automático por diferencias CRLF/LF; se comparó después la fuente canónica, se reinició correctamente y se verificó el estado. Ninguna restauración sobrescribió state.json.

## Aceptación final PC↔Pixel

- PC → servidor HTTPS real → Pixel: pasó.
- Pixel → servidor HTTPS real → PC: pasó.
- Escritura sin conexión, recarga real del PC y entrega al Pixel al reconectar: pasó.
- Los diez valores de progreso protegidos del Pixel permanecieron iguales a su copia previa. La repetición final mantuvo también los valores protegidos del servidor.
- Al recuperar la conexión, una ejecución previa subió pendientes de Catalán y Oca; ambos valores coincidían exactamente con la copia preservada del Pixel y no eran borrados. La comprobación inicial de igualdad estricta del servidor se ajustó para reconocer estas subidas legítimas.
- La clave desechable se retiró de ambos clientes; solo queda su marcador de borrado normal en el servidor. Las copias de preservación permanecen privadas.
- Bloqueo diagnosticado: el Pixel no resolvía el servidor privado antes de abrir Tailscale. Tras abrir la aplicación instalada, indicó Connected, resolvió el servidor y respondió HTTP 200 con Sync 1.0.5. No se modificaron credenciales ni configuración VPN.
- La prueba verifica el transporte y la persistencia de pendientes; no reproduce una sesión de ejercicios ni modifica el progreso para forzar un conflicto.

## Límites reales

- Los progresos agregados divergentes se conservan y se muestran como conflicto pendiente. Su conciliación semántica universal automática sigue abierta.
- La aceptación de transporte PC↔Pixel se completó con Chrome real de Windows (perfil aislado) y el perfil real del Pixel. Se usó una clave desechable, sin modificar respuestas de estudio.
- Una app que ya estaba abierta conserva su sesión y worker anterior hasta terminarla y cerrar sus pestañas. ACTUALIZAR TODO prepara la nueva versión; su activación espera ese cierre.

## Commits de publicación

| Repositorio | Commit publicado |
| --- | --- |
| adaptive-english | ebccce0 |
| adaptive-exam | 8bb8841 |
| adaptive-hoti0108 | 08a88b7 |
| adaptive-phrasal-verbs | 72c4464 |
| adaptive-pizarras | 3b1193f |
| adaptive-verbs-catala | cd32b93 |
| b2-multiple-choice-cloze | 01ab8c8 |
| adrian-hub | 8d15e07 |
| adrian-core | 7257aaa |
| adrian-sync-server | 1f5935e |
| Hub Control local | 47b2db8 |

Trabajo previo de Hub Control: fffb11d en preserved-local-hub-control-0.4.2-20261007.
Los commits separados de los seis bloques figuran en REPAIR-2026-10-07.md. Este cierre se confirma en un commit documental adicional.