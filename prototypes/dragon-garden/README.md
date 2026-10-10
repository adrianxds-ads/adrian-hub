# Dragoncillo del jardín — prototipo aislado 0.1.0

Estado: laboratorio interactivo independiente, **no sustituye la mascota de producción**. Fecha 2026-10-11. Referencia artística aprobada: docs/NUCLEO_EDITORIAL_LUMINOUS_V1.md.

## Acceso
GitHub Pages: https://adrianxds-ads.github.io/adrian-hub/prototypes/dragon-garden/
En local: servir la raíz del repositorio por HTTP y abrir la ruta /prototypes/dragon-garden/.

## Qué funciona
- Dragoncillo SVG vectorial por capas (ojos, boca, cola, patas, alas), con parpadeo, respiración, conversación, paseo, sueño, aleteo y vuelo de prueba.
- Vista previa del huevo y etapas 1–4. Los tamaños y el vuelo se pueden previsualizar; no representan el progreso real del usuario.
- Bosque ilustrado de muestra, cueva y silueta de Barcelona; escenas de día, noche, viento y lluvia, todas simuladas y etiquetadas.
- Controles táctiles adecuados; accesibilidad con etiquetas y prefers-reduced-motion.

## Garantía de preservación
La página no usa localStorage, IndexedDB, sincronización ni service workers; no importa dependencias del jardín del Hub. No consulta ni modifica CottageGarden, github-garden, medallas, árboles o sesiones. Los árboles del fondo son una ilustración ficticia: la integración final deberá montar el dragón sobre el bosque existente, sin reemplazar ni sus datos ni sus nodos.

## Contrato de maduración
Los umbrales de producción siguen: huevo <5, recién nacido 5–24, explorador 25–99, aprendiz 100–299, guardián 300+. El prototipo NO lee estos números: simula con el selector. Vuelo ocasional y acabado 2.5D más rico pendientes.

## Pruebas
Ejecutar python tests/test_dragon_prototype.py (Chrome + Playwright en Windows): 360/390/412/1280, interacciones, etapas, escenas, ausencia de desbordamiento o errores JS, sin nuevas escrituras en local/sessionStorage y movimiento reducido. Las capturas temporales se quedan fuera del control de versiones.

No equivale a prueba física del Pixel ni a integración en el Hub. Confirmar por separado.

## Siguiente paso
Revisar en Pixel, mejorar la fidelidad a la lámina artística aprobada e integrar la versión final por capas en garden-life.js, respetando el bosque, casita/cueva y progreso. La portada pública no se modifica en esta entrega.
