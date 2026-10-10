# Nexo Visual · Hub 30.4.40 (2026-10-09)

## Alcance real
- Botón «HABLAR CON NEXO» junto al buscador del Hub. En Android abre `https://chatgpt.com/` mediante un Intent de Chrome limitado al paquete instalado `com.openai.chatgpt`; navegador alternativo si no resuelve. Escritorio usa web.
- El Pixel 10 confirma que `com.openai.chatgpt.ChatGptDeeplinkActivity` acepta enlaces https BROWSABLE de chatgpt.com.
- Tasker `net.dinglisch.android.taskerm` ya contiene una tarea real `NexoVisual` (importada, guardada y probada en Pixel 10). El enlace correcto es `tasker://assistantactions?task=NexoVisual`, sin perfil Secondary App ni AutoInput.
- **No existe una API pública documentada para comenzar a compartir pantalla desde el Hub.** La modalidad Live carece de pantalla. En voz Avanzada el usuario debe pulsar «Compartir pantalla» y aceptar la autorización de Android.
- «HABLAR CON NEXO» abre ChatGPT, no garantiza entrar automáticamente en una llamada: «Iniciar con Voz» funciona en nuevas conversaciones vacías en versiones compatibles y depende de preferencias previas.
- No se guarda voz, pantalla ni credenciales en el Hub. No se cambia ni lee ningún estado de juego.

## Tasker (configuración real en Pixel 10)
1. Se ha creado `NexoVisual.tsk.xml` (tarea Tasker Launch App) en el repositorio y copiado a `/sdcard/Tasker/tasks/` y `/sdcard/Download/`.
2. Importada desde Tasker → pulsación larga en TAREAS → Importar Tarea, y guardada/aplicada.
3. Prueba física por ADB: Tasker en primer plano → invocación `tasker://assistantactions?task=NexoVisual` → foco final `com.openai.chatgpt.MainActivity`. PASS.
4. Desde el Hub, desplegar «Tasker · tarea NexoVisual» y pulsar «LANZAR NEXO VISUAL CON TASKER». El navegador/PWA puede mostrar aviso de apertura en Tasker.
5. En ChatGPT, habilitar «Iniciar con Voz» para conversaciones nuevas/vacías; para pantalla, Voz avanzada → ⋯ → Compartir pantalla → autorizar Android → volver al Hub.

## Invariantes
- Reutilizar `apps.json`, `versions.json` y la carcasa actual: no duplicar apps, ni ampliar el registro como si fuese un quiz.
- No llamar a modelos de pago ni solicitar permisos de accesibilidad automáticos.
- No automatizar el clic de consentimiento de Android.
- En futuros lanzamientos, revisar API oficial antes de afirmar voz o captura con un único toque.

## Aceptación pendiente / evidencia
- Confirmado por ADB de solo lectura en Pixel 10: ambos paquetes instalados y resolutores Android disponibles.
- Pendiente: pulsación humana desde el Hub instalado, inicio de Voz avanzada, retorno al Hub con pantalla visible en una misma sesión. Hasta entonces es una **integración de lanzamiento**, no una prueba física integral de voz y pantalla.

## Smoke UI local (2026-10-09)
- Chrome headless, servidor HTTP local, anchuras 360/390/412/1280: PASS.
- Botón visible de altura 54 px; 16 apps del registro presentes; sin scroll horizontal; sin excepciones JS.
- Android simulado: enlace `intent:` y sección Tasker visible. Escritorio: `https://chatgpt.com/` y Tasker oculto.
- Registros y etiquetas indican Hub 30.4.38. El intento de interacción real con pantalla/voz continúa pendiente.

## Prueba física desde la PWA · 2026-10-09
- Pixel 10 con el Hub servido en v30.4.40: el panel «Tasker · tarea NexoVisual» aparece con la URL correcta.
- Desde el propio Hub se pulsó «LANZAR NEXO VISUAL CON TASKER»; foco Android pasó por `ActivityAssistantActions` de Tasker y terminó en `com.openai.chatgpt.MainActivity`. PASS.
- Ajustes de ChatGPT → Voz inspeccionados sin cambiar preferencias: modelo actual `Live`, «Conversaciones de fondo» activadas; la opción «Iniciar con Voz» no apareció en la pantalla de ajustes de esta versión/cuenta. Por ello el inicio automático de Voz **no se ha verificado ni configurado**.
- La actividad interna `com.openai.voice.assistant.AssistantActivity` rechazó un intento externo (`SecurityException: not exported`); no se elevan permisos ni se sortean restricciones.
- La activación de modo Avanzado, conversación por voz y captura de pantalla **no se han probado**; queda la intervención voluntaria del usuario para compartir pantalla mediante los controles oficiales. No se debe describir esta fase como completada.

## AutoInput · preparación segura (2026-10-10)
- Autorizado expresamente por el usuario instalar AutoInput y habilitar accesibilidad. Google Play confirmó instalada `com.joaomgcd.autoinput` v3.0.12; Android confirmó servicio `com.joaomgcd.autoinput/.service.ServiceAccessibilityV2` habilitado. Las tres entradas de accesibilidad existentes permanecen en la lista.
- Tasker reconoce `AutoInput Action` y `Actions v2` en los complementos. Se clonó la tarea probada como `NexoVisualAuto` para experimentar sin editar `NexoVisual` ni el botón publicado del Hub.
- AutoInput solicitó dos permisos nuevos durante el asistente: excluir de Doze (optimización de batería) y mostrarse sobre otras apps (superposición). Ambos fueron **rechazados/no concedidos** a falta de aprobación independiente. No hubo compra ni activación de periodo de prueba de pago.
- El editor manual se exploró sin guardar un objetivo de interfaz validado. `NexoVisualAuto` NO debe considerarse apta para iniciar Voz avanzada o compartir pantalla. No se activó ni autorizó ninguna captura. Modo Live y botón oficial del asistente no se alteraron.
- Siguiente paso: autorización específica para permitir superposición temporal, configurar acciones de AutoInput por etiquetas visibles con límites de tiempo y comprobar la ruta en un entorno de prueba. Exigir confirmación de Android para compartir pantalla; nunca automatizarla.

## AutoInput · superposición autorizada (2026-10-10)
- El usuario autorizó expresamente continuar con la integración y habilitar el permiso de superposición de AutoInput. Android confirmó `SYSTEM_ALERT_WINDOW: allow`, así como `com.joaomgcd.autoinput/.service.ServiceAccessibilityV2` habilitado y los servicios de accesibilidad previos presentes.
- La tarea estable `NexoVisual` no se cambió. `NexoVisualAuto` sigue siendo una copia **experimental**; el editor de AutoInput se exploró, pero no se ha validado una cadena completa de entrada en Voz avanzada y «Compartir pantalla».
- La prueba de captura de pantalla de Android no fue iniciada ni consentida. **No afirmar que Tasker comparte la pantalla automáticamente.** La autorización de proyección de pantalla, cuando corresponda, se acepta únicamente desde la interfaz de Android por el usuario.
- Próximo paso técnico: confirmar el UI específico de Voz avanzada, identificar controles estables de ChatGPT, probar una tarea con timeout y fallos seguros, antes de enlazarla desde el Hub. No tocar el lanzador estable ni el progreso de los juegos.

## Tercer paso real · pruebas en Pixel 10 (2026-10-10)
- ChatGPT → Configuración → Voz: **Avanzado** ya seleccionado antes de comenzar; no se modificó el modo.
- En una conversación de Voz avanzada abierta se comprobó físicamente la ruta de esta versión de Android: botón **+** (accesibilidad: «Archivo adjunto») → **«Compartir pantalla»**. El botón ⋯ de la esquina superior derecha abría **salida de audio** («Altavoz», «Teléfono»), no compartir pantalla, en esta interfaz concreta.
- Al seleccionar «Compartir pantalla» apareció el cuadro de Android **«¿Compartir tu pantalla con ChatGPT?»** con «Compartir una aplicación», «Cancelar» y «Siguiente». Se canceló la petición; **no hubo captura/transmisión autorizada**.
- En Tasker se preparó y guardó la copia aislada `NexoVisualAuto` con cuatro acciones: abrir ChatGPT; AutoInput clic por texto «Iniciar una» (prefijo, no equivalencia exacta verificada); AutoInput clic «Archivo adjunto»; AutoInput clic «Compartir pantalla». Solo la ruta manual hasta el consentimiento se verificó satisfactoriamente.
- Prueba del enlace `tasker://assistantactions?task=NexoVisualAuto` desde inicio normal: abrió ChatGPT y el menú de adjuntos **sin entrar en una sesión de Voz ni abrir consentimiento de pantalla**. Resultado **NO APTO para sustituir `NexoVisual`**. No modificar enlace del Hub ni afirmar automatización completa sin una prueba física satisfactoria.
- Trabajo siguiente si se retoma: usar el selector visual de AutoInput para capturar el control «Iniciar una conversación de voz» completo (el prefijo «Iniciar una» no está verificado como coincidencia suficiente), añadir guardia de estado de Voz activa y revalidar ruta completa con tiempos de espera seguros. Mantener confirmación Android en manos del usuario.

## AutoInput comprado · prueba de Voz y bloqueo seguro (2026-10-10)
- Usuario comunicó haber comprado AutoInput; no se hicieron compras ni pagos desde el agente. En la prueba posterior AutoInput ejecutó acciones, aunque también se observaron errores de tiempo de espera.
- `NexoVisualAuto` en ChatGPT con conversación vacía: la acción `AutoInput Action` (texto parcial `Iniciar una`) **sí consiguió abrir Voz avanzada**. Se verificó por elementos de accesibilidad «ChatGPT», «Voz», «Finalizar». No hace falta cambiar permanentemente el modelo de Voz; ya estaba seleccionado Avanzado.
- Siguiente acción `Archivo adjunto` logró abrir el menú +; se observó la opción «Compartir pantalla» en captura visual. Ese menú emergente no se reflejaba correctamente en la jerarquía de texto de accesibilidad, por lo que la última acción por texto agotó tiempo de espera.
- Se probó sustituir la cuarta acción por `AutoInput Action` de tipo `Point` en `431,2159`, posición comprobada cuando el menú está visible en vertical. La prueba desde el selector de chats **falló**: la transición a Voz no había terminado, y se abrió la biblioteca de archivos del chat normal. Se cerró sin seleccionar ni enviar ningún archivo. El Pixel pasó después a orientación horizontal (`2251×1080` frente a vertical `1080×2424`); esta coordenada no es válida en horizontal.
- **Medida final de seguridad:** se **deshabilitó la cuarta acción** de `NexoVisualAuto` y se pulsó «Guardar y aplicar» en Tasker; la tarea original `NexoVisual` y la URL del Hub permanecen intactas. La tarea experimental no debe anunciarse ni enlazarse aún como acceso de pantalla compartida de un toque.
- Para completarlo: insertar una espera/verificación explícita de encabezado «Voz» después de arrancar Voz, comprobar orientación de pantalla con Tasker «Test Display / Orientation», y solo entonces habilitar el toque final condicionado a la disposición correcta. Mantener siempre intacto el diálogo de consentimiento de Android.


## Ajustes de seguridad y tarea separada (2026-10-10)
- Respaldo externo exportado de `NexoVisualAuto` (antes de intervenir) en Windows `C:\Users\adria\AppData\Local\Temp\NexoVisualAuto-20261010-baseline.tsk.xml`. Esta tarea previa mantiene su toque final deshabilitado.
- Nueva tarea aislada **`NexoVisualAutoSafe`**, importada y guardada en Tasker (Android), sin alterar el lanzador estable `NexoVisual` ni el Hub.
- Orden validado en editor: iniciar ChatGPT → esperar 1 s → AutoInput «Iniciar una» → esperar 2 s → AutoInput UI Query configurado para texto «Finalizar» en `com.openai.chatgpt` → AutoInput «Archivo adjunto» → Test Display/Orientación (`%nexo_orient`) → esperar 1 s → acción de punto `431,2159`, **deshabilitada**, con condición `%nexo_orient ~ portrait`.
- Verificado que los nueve pasos están en el editor y que la condición de orientación se visualiza correctamente. Tras guardar, Tasker dejó de mostrar «Guardar y aplicar».
- Una ejecución durante un chat no vacío (respuesta de ChatGPT generándose) no pudo entrar en voz: el botón «Iniciar una conversación de voz» no estaba disponible. AutoInput agotó el tiempo de espera. No es una prueba positiva de automatización.
- **Estado: PARCIAL Y SEGURO.** No se activó «Compartir pantalla», ni se inició la captura, ni se automatizó la autorización de Android. No enlazar `NexoVisualAutoSafe` al Hub hasta verificar la cadena completa desde un chat vacío, validar el control de Voz y, solo entonces, habilitar el último toque tras confirmar el menú real; conservar aprobación Android manual.


## NexoVisualAutoSafeV2: primera prueba positiva (2026-10-10)
- La tarea `NexoVisualAutoSafeV2` se ha importado en Tasker: editor verificado con diez acciones. Su cadena incluye abrir ChatGPT, esperar tres segundos, AutoInput `Navegar hacia arriba`, esperar un segundo, AutoInput `Iniciar una conversación de voz`, esperar dos segundos, UI Query `Finalizar`, AutoInput `Archivo adjunto`, esperar un segundo y toque por punto `431,2159` **deshabilitado**.
- Prueba física desde el botón Play de Tasker: ChatGPT abrió Voz avanzada; jerarquía Android confirmó los controles `Desactivar micrófono` y `Finalizar`. PASS para entrada a interfaz de voz.
- Posteriormente captura real de Pixel 10 mostró abierto el menú `+` de voz avanzada, con `Cámara`, `Fotos`, `Archivos`, `Vídeo en directo` y `Compartir pantalla`. PASS hasta menú de compartir pantalla.
- Durante el arranque apareció brevemente el mensaje `Too many requests`: apertura de interfaz y menú verificada, pero no funcionamiento conversacional de audio ni conectividad de voz.
- No hubo activación del último toque, cuadro de consentimiento ni proyección de pantalla. Conservado `NexoVisual` estable y enlace del Hub; ninguna captura autorizada. El siguiente paso es, únicamente si se desea, habilitar toque final tras guardias verificadas de voz, estado real del menú y orientación; aceptación de Android siempre manual.


## V3 · automatización del menú y acceso Hub (2026-10-10)
- Se importó `NexoVisualAutoSafeV3` de forma independiente. Conserva lanzamiento, apertura de Voz avanzada y apertura de menú, con guardia `%aitext() ~ *Finalizar*` antes de activar adjuntos y guardias `%nexo_orient ~ portrait` y `%aitext() ~ *Finalizar*` antes del punto `431,2159`.
- Prueba física desde el Play de Tasker: apareció en Android el diálogo `¿Compartir tu pantalla con ChatGPT?`, con `Cancelar` y `Siguiente`. **PASS hasta petición de permiso.** Se pulsó **Cancelar**; no se compartió pantalla, ni se automatizó autorización.
- Hub 30.4.42 añade un acceso Android visible a `tasker://assistantactions?task=NexoVisualAutoSafeV3`. Conserva el botón `HABLAR CON NEXO` y el enlace de la tarea estable `NexoVisual` como alternativas. El nuevo botón es específico del Pixel con Tasker instalado.
- Pendiente de comprobar desde Hub publicado/PWA que el enlace entra en V3 y muestra permiso sin necesidad de abrir Tasker. El permiso final siempre se acepta manualmente por el usuario.

- Prueba real del acceso publicado desde el Hub v30.4.42 en Pixel 10: el boton nuevo aparecio en Android y su pulsacion llevo al selector del sistema 'Elige la aplicacion que quieres compartir' (opciones como Hub, Chrome y Gmail). PASS de enlace Hub a UI de permiso Android. No se eligio ninguna aplicacion ni se autorizo la captura desde el agente.


## Cierre de la automatización experimental · 2026-10-10
- El usuario ha vuelto a configurar Gemini como asistente principal de Pixel. Se conserva ese ajuste: el Hub solo abre la aplicación ChatGPT.
- Captura de Tasker: `NexoVisualAutoSafeV3` falló en su acción 3 (`AutoInput Action`) por timeout, error code 2. Una pasada previa hasta el diálogo de compartir pantalla no demuestra fiabilidad. Se ha retirado del Hub el acceso automático V3 y el panel Tasker; las tareas preexistentes del teléfono no se han borrado ni modificado.
- Según la documentación de ChatGPT Voz, el vídeo en directo se inicia en modo Avanzado desde la propia aplicación. No hay un deeplink oficial documentado para abrir directamente la cámara desde el Hub. El botón estable «HABLAR CON NEXO» sigue abriendo ChatGPT; instrucciones: Voz avanzada → + → Vídeo en directo.
- Estado: cierre funcional de alcance reducido. No se altera Gemini, no se activa cámara ni pantalla en segundo plano, ni se solicitan permisos adicionales.
