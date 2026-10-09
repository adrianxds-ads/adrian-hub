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
