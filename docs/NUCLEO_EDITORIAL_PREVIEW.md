# Núcleo Editorial · Propuesta visual comparativa

Fecha: 2026-10-09 · Estado: **preview aislada, no publicada en Hub principal**.

## Objetivo
Conservar la legibilidad ganada con el Hub claro y los tintes distintos por materia, recuperando la sobriedad de la primera identidad. Evitar el patrón genérico «raya de color + tarjeta repetida».

## Cambios experimentales
- La franja vertical desaparece; cada ficha conserva una superficie pastel propia.
- Contornos de 1px, geometría de 20px y sombras leves, sin ornamentos gratuitos.
- Emblemas de siglas bicolor con esquinas asimétricas y bajo contraste de superficie, pero tinta oscura.
- Versions sin cápsula; el botón de información conserva superficie táctil de 52px con círculo visible más discreto.
- Cabeceras con tratamiento editorial (mayúsculas y jerarquía reducidas).
- Roboto 19px cuerpo, secundarios 16px: **sin alterar Núcleo Visual v1**.
- Se conserva Nexo Visual, el jardín, medallas, oros, búsquedas, navegación y la lógica de los quizzes.

## Alcance técnico
Archivo `hub-editorial.css` importado **después** de `hub-daylight.css` cuando `body` tenga `hub-editorial`. Basta quitar clase + import para volver al diseño 30.4.38.

**No difundir a producción hasta recibir valoración visual del usuario.** Cuando se acepte: rebasar desde el `main` reciente, versionar la nueva release, incluir CSS en `service-worker.js`, ejecutar `release-build.py --hub-only`, las pruebas del Hub y comprobación pública de GitHub Pages. Proteger trabajos paralelos.

## Verificación previa
Tests locales Playwright en 360×780, 390×844, 412×915 y 1280×800: 16 fichas, 16 colores distintos, letra 19px, versiones 16px, sin banda izquierda ni overflow, búsqueda/Info/garden/estrellas/Nexo y ausencia de errores JS. Comparación visual capturada en `docs/previews/nucleo-editorial-390.jpg`.
