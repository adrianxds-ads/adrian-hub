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


## Revisión de lectura 1.1 · 10/10/2026
La nueva petición de Adrián amplía la revisión a contadores, tipografía, estadísticas y pantallas internas. Se corrige la mezcla de superficies claras con letras heredadas de temas oscuros, y se redefine cada componente compartido en una única hoja maestra. Textos secundarios de 16 px, controles de 18 px, lectura de 19 px y respuestas de al menos 20 px. Medallas sin conseguir mantienen cifras y nombres legibles; los totales siguen usando los mismos datos.
El índice y los valores se leen en tinta oscura; los colores de rango siguen en bordes, barras y muestras. Se preservan los tonos de respuestas y el significado de acierto/error, con tinta oscura en el acierto verde para contraste. Temporizadores: misma duración/arco/urgencia, número legible. El itinerario de Turismo, tarjetas de llaves, listas de habilidades y módulo común de estadísticas tienen contratos completos de fondo y texto.
La hoja local debe coincidir byte a byte con Core. Pruebas de portada, información, versiones, detalles, estadísticas, juego, corrección, examen y final en contextos aislados a 360/390/412/1280; pruebas de respuestas, guardado, bancos protegidos y caché por separado. No equivale a prueba física de Pixel ni sincronización multidispositivo.

## Revisión cromática · Editorial Balance v1.1 · 2026-10-10

Tras comparar capturas de la portada a 390 px, se recupera profundidad visual de la identidad anterior sin volver al fondo oscuro: emblemas sólidos, pasteles más definidos, contornos ligeramente más presentes y subtítulos reforzados. Permanece #EAF0F5 y la escala de Núcleo Visual (Roboto, lectura 19 px; secundarios 16 px). Se modifica solo hub-editorial.css, sin alterar la paleta funcional de respuestas, jardín, puntuaciones ni almacenamiento.

La referencia de aceptación es la carcasa y los modales a 360/390/412/1280, más verificación de publicación, caché e integridad. Cualquier ajuste de un quiz requiere diagnóstico separado.

## Contabilidad de premios · Hub 30.4.46

Los oros ganados no se descuentan al llegar a un múltiplo de cinco. Se conserva el máximo ganado en el registro compartido para representar las medallas que el historial local aún no muestra. La recuperación de sesiones antiguas ausentes no se presume. El sonido del premio se refuerza con tres notas adicionales en la sesión perfecta que alcanza 5, 10, 15... oros, exclusivamente cuando el sonido de la app está habilitado. Estrella dorada y aviso de desbloqueo; todos los controles de aprendizaje, datos, jardín y Nexo intactos.

## Portada Centro de control — contrato funcional Fase 1 (2026-10-11)

Estado: ESPECIFICACIÓN; no es una modificación de la interfaz publicada. En la nueva portada este acuerdo sustituye el requisito histórico de mostrar buscador, Nexo Visual, panel ChatGPT y centro de versiones expandido. Se conservan sus servicios y datos, salvo que se indique lo contrario.

### Orden de arriba abajo

1. JARDÍN: mover la sección garden-shell antes de la lista de aplicaciones. Mantener una sola instancia githubGarden, misma altura aproximada actual (310 px móvil, 360 px escritorio), árboles, casita/cueva, dinosaurio, crecimiento, tareas, estrellas y sus actuales motores de datos; no duplicar ni reinicializar el progreso.
2. CLIMA EN LA CABECERA DEL JARDÍN: una franja breve Barcelona · hora local · temperatura °C · estado meteorológico · velocidad del viento en km/h; en móvil admite dos líneas, con tipografía al menos 16 px. No mostrar letreros JARDÍN GITHUB / JUEGO VISUAL DEL ECOSISTEMA ni bloquear la interacción con el dinosaurio. Mantener el pequeño contador de crecimiento sin darle protagonismo.
3. BANDA DE ACTIVIDAD: oro acumulado, estrellas y opcionalmente bloques completados según datos existentes; botón único ACTUALIZAR TODO realmente conectado al mecanismo de actualización de aplicaciones. Presentar aviso breve y accesible de progreso, fallo parcial, versión preparada o sin conexión.
4. APPS DIRECTAMENTE: mantener lista, agrupación y orden del catálogo vigente apps.json, accesos, subtítulos, tintes propios e icono de información (i). La apertura inmersiva y regreso al Hub siguen operativos.
5. PIE DISCRETO: número de versión y acceso secundario a detalles técnicos o historial si son necesarios. El Version Center no debe ocupar una sección completa de la portada.

### Elementos que se retiran solo de la portada

- Cabecera hero con Todas tus apps, emblema y frase de introducción. Recolocar los nodos hubStarCounter, hubStarCount y hubGoldCount en la nueva banda; conservar su lógica y claves.
- Buscador search y contador count; refactorizar render para no depender de su existencia y retirar el listener de búsqueda evitando errores null. Seguir mostrando todas las apps y sus grupos.
- Lanzador superior Nexo Visual y panel inferior ChatGPT del Hub. No borrar configuraciones, desactivar agentes, modificar enlaces de otras aplicaciones ni eliminar datos.
- Panel expandido de versiones y controles redundantes. Conservar la lógica de verifyAllVersions, updateAllVersions, integridad, estado del SW y errores. Trasladar updateAllVersionsBtn a la banda. Diagnóstico accesible solo bajo detalles discretos; jamás simular un botón de actualización.

### Contrato meteorológico

- Fuente: Open-Meteo con latitud 41.3874, longitud 2.1686 y huso Europe/Madrid.
- Solicitar datos actuales: temperature_2m, weather_code, cloud_cover, is_day, wind_speed_10m y wind_direction_10m; unidades de viento km/h. Dirección cardinal opcional si se conoce; no inventar valores cuando falte.
- El tiempo visual procede exclusivamente del código WMO actual. No usar rain ni precipitation acumulados del período anterior para declarar que está lloviendo. Respetar la corrección meteorológica ya publicada y su prueba de regresión.
- Hora de portada calculada mediante Intl.DateTimeFormat con timeZone Europe/Madrid, refrescada cada minuto, independientemente de la zona del dispositivo.
- Lectura meteorológica actualizada aproximadamente cada 15 min cuando la portada esté visible; usar caché real durante un máximo de 30 min y avisar de datos antiguos. Si no hay dato válido, representar guiones, sin simular lluvia o viento. Incluir hora de la lectura en descripción accesible.
- Contraste suficiente del texto sobre el cielo variable, sin tapar casita/dinosaurio, sin microtipografía y respetando prefers-reduced-motion.

### Límites de esta fase

FASE 2: mostrar por tarjeta tres medallas y estrella, ganadas o apagadas; actualizar una aplicación individualmente y mostrar estado pendiente solo cuando la auditoría confirme caché desactualizada. No confundir sin red/estado desconocido con pendiente. El oro permanece acumulado después de recibir estrellas.

FASE 3: skyline de Barcelona, arte 2.5D, proporciones huevo-árbol-dinosaurio/cueva, iluminación y diálogos ampliados. No alterar los gráficos del jardín más allá de su encaje en la nueva portada durante Fase 1.

### Pruebas y aceptación antes de publicar

- Navegador a 360, 390, 412 y 1280 px: sin desbordamiento, jardín arriba, franja de Barcelona visible, actualizaciones accesibles, todas las aplicaciones y fichas i funcionales.
- Sin errores JS después de retirar búsqueda, hero, Nexo y panel ChatGPT; navegación inmersiva y retorno conservados.
- Actualizar todo conserva sesiones, almacenamiento, recompensas y cachés seguras; avisos de éxito/preparado, parcial y fallo honestos.
- Datos meteorológicos simulados: despejado con lluvia residual NO representa lluvia; códigos WMO de lluvia, nieve y tormenta producen cada efecto. Viento, temperatura, fecha y hora correctos; estado sin conexión claro.
- Sin duplicar progreso, estrellas, árbol o dinosaurio; jardín de tareas coherente con el Hub, sin tocar datos reales de sesiones.
- Registrar versión y caché de release y verificar sitio público y Pixel real de forma independiente antes de declarar terminado.

Siguiente paso: implementar de forma reversible sobre el último main verificado, dejando intactos los cambios locales no relacionados.
