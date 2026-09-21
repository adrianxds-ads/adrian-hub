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

También consume `components/adrian-keyboard.js?v=401`. El buscador del Hub es el primer campo activo con el Teclado Adrián v4: QWERTY compacto, ES/CA/EN, mayúsculas, pulsación larga para acentos y pantalla `123`.

## Apps actuales
- Adaptive English
- Cambridge B2
- Català · Verbs
- HOTI0108
- Limpieza 2.2 (acceso privado por Tailscale)