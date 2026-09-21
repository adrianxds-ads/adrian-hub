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
- Adaptive English
- Cambridge B2
- Català · Verbs
- HOTI0108
- Limpieza 2.2 (acceso privado por Tailscale)