# AGENTS.md

This repository is the control point for the Adrián Hub ecosystem.

## Mandatory workflow
1. Read `PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/KNOWN_ISSUES.md` and `docs/ACCEPTANCE_TESTS.md` before editing.
2. Inspect the real code and current Git status; never assume a task is already applied.
3. Preserve existing behaviour unless the requested change explicitly replaces it.
4. Prefer small, reversible diffs. Do not rewrite unrelated files.
5. Reproduce a bug before fixing it when practical.
6. After a change, run the relevant acceptance checks and verify the actual UI/state.
7. Never report "fixed", "done" or "deployed" only because code was edited; verify the result.
8. Do not overwrite uncommitted user work.
9. Version every functional release. `versions.json` is the Hub's version registry and changelog source.
10. When an app changes, update its own version and the Hub registry consistently.

## Cross-device rules
- Treat mobile and desktop as distinct test targets.
- Progress, stars, garden/game state and completed sessions must survive reloads and sync as designed.
- Service-worker/cache changes require an explicit stale-version check.

## Safety
- Never commit credentials, API keys, tokens or private URLs intended to remain local.
- Never force-push or delete branches without explicit approval.
- Keep a recoverable Git state before broad refactors.

## Completion report
For each task state: files changed, version changed, tests run, observed result, and any remaining uncertainty.
## Pixel UI sessions
Use the private bridge adb helper for Pixel UI work: it renews the temporary screen lease automatically. Direct ADB scripts must renew through agent/pixel_work_session.py before UI operations and release when done. Never disable the secure lock or change the user's normal timeout to keep a session awake. Device-side expiry is the recovery path if a session disconnects.

## Current Nexo operating preference (2026-10-09)
Adrián has chosen to continue investigation and implementation through ChatGPT/DC without additional paid model API runs. Historical spending caps are ceilings, not current authorization to spend. Do not launch new OpenRouter audit/repair jobs unless Adrián explicitly changes this preference. Local diagnostics, trusted regression and read-only recovery of existing results remain available. Keyboard Speak physical phrase/dictation testing is deferred by user choice and does not block Nexo configuration.

## Núcleo Visual: norma de lectura (2026-10-09)
- Plantilla maestra en `../adrian-core/design/nucleo-visual-profile.css` y explicación `NUCLEO_VISUAL_PROFILE.md`. No crear otra escala arbitraria de tipografías al construir apps nuevas.
- Lectura: Roboto 19 px CSS / interlineado 1,35; secundarios 16 px; interfaz 18 px; títulos 24 px; superficies táctiles desde 52 px. Fondo claro candidato #EAF0F5 y texto #25282C.
- Basado en dos autovaloraciones coincidentes (noche tenue e interior iluminado, no prueba clínica ni luz solar); permitir ajustes posteriores y mantener escalado del sistema Android.
- Cada nueva pantalla de lectura debe adoptar los tokens compartidos y comprobar la visualización en Pixel. Importar la plantilla por sí sola no cambia elementos con tamaños locales fijados.
- Migrar quizzes existentes progresivamente, nunca a ciegas: revisar CSS real, conservar puntuación/temporizadores/teclado/progreso, probar sin desbordamiento, versionar individualmente.

## Núcleo Visual · Hub claro y tarjetas didácticas (2026-10-09)
- Norma visual confirmada por las dos pruebas: fondo gris azulado #EAF0F5, texto #25282C, Roboto y lectura 19px/1,35. El color del fondo es preferencia de lectura, no diagnóstico óptico.
- La carcasa del Hub usa `hub-daylight.css`, importado después de `styles.css`; permite cambiar o revertir el tema sin tocar juegos. Mantener fichas de materias con tintes distintos, nombre y subtítulo de alto contraste, sin recurrir solo al color para identificarlas.
- La identidad cromática de medallas/arcoíris, recompensas, respuestas, estrellas y jardín **no se modifica** con el tema del Hub. No trasladar un tema claro a los quizzes sin auditoría y pruebas independientes de CSS, respuestas, temporizador y progreso.
- Verificar en 360/390/412/1280px, apertura de fichas, búsqueda, actualización y ausencia de scroll horizontal; si se añade CSS importado actualizar la caché y la integridad de release.

## Norma final Núcleo Editorial Luminous v1 (2026-10-09)
La fuente canónica de estilo es `docs/NUCLEO_EDITORIAL_LUMINOUS_V1.md`, con `hub-daylight.css` + `hub-editorial.css` sobre los tokens de `../adrian-core/design/nucleo-visual-profile.css`. El Hub usa el tema luminoso como identidad predeterminada, con Roboto 19px, fondo #EAF0F5, 16 materias diferenciadas y halo suave solo en emblemas/acciones. La ficha informativa en Actualizaciones es de solo lectura. No replicar el tema en quizzes automáticamente: conservar arcoíris, medallas, respuestas y progreso. Cualquier mejora en juegos requiere piloto y pruebas independientes.
