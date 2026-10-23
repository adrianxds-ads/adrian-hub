# Adrián Hub

Launcher/PWA central para las aplicaciones personales de Adrián.

## Registro
Las aplicaciones visibles se declaran en `apps.json`. El Hub no duplica la lógica de cada proyecto: sólo proporciona un punto de entrada común.

## Diseño
Consume Adrián Core directamente desde GitHub Pages:
- `design/tokens.css`
- `components/base.css`
- `design/adrian-visual-system.js`

Así el Hub sirve como primer consumidor real de la fuente visual central.

También consume `components/adrian-keyboard.js?v=410`. El buscador del Hub es el primer campo activo con el Teclado Adrián v4.1: QWERTY compacto, ES/CA/EN, letras ampliadas, pulsación larga para acentos, `.` y `@` en el panel principal, pantalla `123` y ventana flotante grande de escritura.

## Apps actuales
- ADRI ? TYPE (launcher del tracker local; historial real en el PC)
- Adaptive English
- Cambridge B2
- Català · Verbs
- HOTI0108
- Limpieza 2.2 (acceso privado por Tailscale)
## Recuperación protegida de progreso (2026-10-23)
- En Ajustes → «Recuperar progreso y sincronizar», el navegador solicita consentimiento para acceder al servicio privado existente. Si se concede, se consulta el historial completo de claves de aprendizaje, aunque el cliente crea estar sincronizado.
- Se recuperan claves ausentes o cuando el historial remoto domina de forma comprobable al local. En caso de conflicto o de progreso local superior, se conserva el estado local; se guardan copias de recuperación de los valores reemplazados. La operación no borra claves privadas ni altera ajustes ajenos.
- El módulo de compresión se carga antes que el cliente de sincronización. Impide almacenar en claro las campañas grandes durante la importación. Las copias de recuperación grandes también se comprimen.
- Las pruebas automáticas son aisladas; la recuperación física en el Pixel precisa permiso de Chrome/Red local y comprobación en el navegador habitual. El respaldo privado no está incluido en este repositorio.
