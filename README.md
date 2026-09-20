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

## Apps actuales
- Adaptive English
- Cambridge B2
- Català · Verbs
- HOTI0108
- Limpieza 2.2 (acceso privado por Tailscale)