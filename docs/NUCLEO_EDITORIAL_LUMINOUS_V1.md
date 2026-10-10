# Núcleo Visual · Editorial Luminous v1

**Estado:** identidad visual oficial de la *carcasa* del Hub, 09/10/2026.
**Autoría de diseño:** colaboración Adrián · Núcleo.
**Alcance:** portada, catálogo de apps, buscador, panel informativo, actualizaciones y sus botones. Las aplicaciones independientes NO se rediseñan automáticamente.

## Fuente de verdad y estructura

1. `../adrian-core/design/nucleo-visual-profile.css` contiene los tokens de accesibilidad y tipografía compartidos.
2. `hub-daylight.css` contiene las superficies claras y tintes individuales de las materias.
3. `hub-editorial.css` es la capa estética FINAL de Editorial Luminous v1, cargada **después** de las dos anteriores, con `body.nucleo-readable.hub-daylight.hub-editorial`.
4. `index.html` muestra el perfil en `#nucleoStyleDetails` al final de Actualizaciones. Es informativo, no una preferencia persistente ni un interruptor cosmético.

Esta es la configuración predeterminada del Hub, sin variantes experimentales en paralelo. Para revisar estilos en el futuro, modificar la fuente canónica y los tokens, no crear nuevos hacks `!important` dispersos.

## Valores canónicos de lectura

- Fuente: Roboto, con alternativas locales legibles.
- Fondo principal: gris azulado `#EAF0F5`.
- Texto principal: antracita `#25282C`.
- Texto de lectura: **19 px CSS**, interlineado **1,35**.
- Texto secundario: **16 px**; controles **18 px**; títulos de referencia **24 px**.
- Tamaño táctil mínimo: **52 px** en controles principales.
- Los colores por materia vienen del catálogo de tarjetas de `hub-daylight.css`; la identificación incluye también texto y siglas, nunca depende solo del color.

Estos valores se basan en dos autovaloraciones coincidentes en ambientes de noche tenue e interior artificial iluminado. No son una prescripción oftalmológica ni prueba de optimización definitiva. El sistema sigue permitiendo el escalado del texto y zoom del dispositivo.

## Principios estéticos

- Superficie clara, sobria, con tintes pastel diferenciables por disciplina.
- Sin banda coloreada en el lateral de las tarjetas.
- Contornos finos, sombras de baja opacidad, emblemas de dos tonos y geometría editorial.
- **Resplandor cromático suave** solo en emblemas y acciones primarias; nunca en textos largos ni bloques completos.
- Sin destellos, parpadeos ni animaciones continuas; se respeta `prefers-reduced-motion`.
- Información de versión discreta; botón «i» pequeño ópticamente pero área táctil de 52 px.
- Escala tipográfica y contraste prevalecen sobre las modas visuales.

## Elementos intocables

Las reglas del juego, bancos de preguntas, algoritmos de revisión, corrección, temporizadores, progreso histórico, sincronización, medallas, colores funcionales de acierto/error, arcoíris de recompensas, oros, estrellas, jardín y audio se conservan. El tema se limita al Hub.

## Política de mejora de los juegos

1. Hacer un **piloto independiente en Grammar Quest** con una rama reversible; no implantar el tema completo de golpe.
2. Medir legibilidad, errores de interpretación, tiempo real de respuesta y fatiga, idealmente por sesiones comparables; no inferir eficacia pedagógica solo de la estética.
3. Mantener el contraste de los cuatro colores de respuestas, sus transiciones y el sistema de medallas.
4. Probar 360/390/412/1280 px, Android con teclado, finalizar partidas y confirmar que los datos persisten.
5. Solo después extender los cambios comprobados a los demás quizzes, con versiones y registros individuales.

## Criterios de aceptación de la carcasa

- El estilo se lee desde el Hub: `#nucleoStyleDetails`.
- Los emblemas tienen luz suave, fija y perceptible en fondo claro.
- 16 tarjetas reconocibles por color/nombre/siglas, sin flecos laterales.
- No hay overflow horizontal a 360, 390, 412 ni 1280 px.
- Buscador, Info, Actualizaciones, Nexo Visual y jardín conservan su funcionalidad.
- CSS versionado, registro `versions.json`, `service-worker.js` e integridad de release verificados.
- La publicación solo se da por completada tras comprobar las versiones efectivamente servidas por GitHub Pages.

**Cierre:** la identidad Núcleo Editorial Luminous v1 queda estable. Los retoques futuros deben resolver necesidades observables de accesibilidad y usabilidad, no reiniciar el diseño completo.

## Aplicación a juegos · release conjunta 30.4.41

La plantilla canónica para juegos es `../adrian-core/design/nucleo-game-theme.css`, documentada en `../adrian-core/design/NUCLEO_GAME_THEME_V1.md`. Ocho repositorios externos han recibido copias locales idénticas y sincronizadas con la caché PWA: Grammar Quest, Phrasal Sprint, Classroom B2, Cloze Quiz, Cambridge Lab (incluidos Cambridge Quiz y Keyword Quiz), B2 Transform, Conjuga CAT y Turismo Lab. Versiones revisadas en `versions.json`.

Pruebas sin intervención en datos reales: estilos/contraste de carcasas y ventanas a 360 × 780, 390 × 844, 412 × 915 y 1280 × 800, ausencia de errores JS y overflow, cuatro respuestas cromáticas en una pregunta de Grammar Quest, instalación de cachés en 9 repos y comprobación de integridad/versiones. No se considera demostrada una mejora de aciertos, ni la prueba física de los ocho juegos en Pixel, ni la sincronización real multidispositivo. Mantener intactos los algoritmos y colores de recompensa y corregir los errores observados tras sesiones del usuario con parches específicos.

## Revisión cromática · Editorial Balance v1.1 · 2026-10-10

Tras comparar capturas de la portada a 390 px, se recupera profundidad visual de la identidad anterior sin volver al fondo oscuro: emblemas sólidos, pasteles más definidos, contornos ligeramente más presentes y subtítulos reforzados. Permanece #EAF0F5 y la escala de Núcleo Visual (Roboto, lectura 19 px; secundarios 16 px). Se modifica solo hub-editorial.css, sin alterar la paleta funcional de respuestas, jardín, puntuaciones ni almacenamiento.

La referencia de aceptación es la carcasa y los modales a 360/390/412/1280, más verificación de publicación, caché e integridad. Cualquier ajuste de un quiz requiere diagnóstico separado.
