# Histórico, colores y medallas — 2026-10-08

HubCharts 1.1.0 elimina el recorte visual a 60 registros. El histórico muestra todas las sesiones conservadas por cada aplicación, con bandas AVS de mayor intensidad, fechas y objetivo cuando está registrado. La vista ampliada permite agrupar por días, filtrar fechas, inspeccionar un punto y comparar dos puntos. Los botones de ampliación antiguos de English/Cloze/Català abren también esta vista.

Las medallas vuelven a estar visibles en portada mientras el detalle estadístico queda plegado. Los cierres de English/Cloze/Català/Phrasal muestran una celebración con el cartel de la medalla, sin depender de la Oca. El oro tiene un resultado dorado destacado. La puntuación, el histórico, las claves de almacenamiento y las recompensas mantienen sus reglas.

Validación con Playwright en almacenamiento aislado y rutas locales: ocho apps, 390 y 1280 px, 120 sesiones completas, 30 días, filtros de tres días, comparación de dos puntos, apertura/cierre con Escape, ausencia de desbordamiento y errores JavaScript. Se verificó una sesión 15/15 mediante finishSession de English: celebración visible, oro incrementado exactamente una vez, insignia dorada en resultados y conservación después de recarga. Prueba adicional de ampliación antigua y cierre de medalla en English/Cloze/Català/Phrasal. Capturas en la carpeta de auditoría.

El cambio recupera la vista completa de los datos existentes; no inventa sesiones ni reconstruye registros que una política antigua de almacenamiento hubiera descartado. Las pruebas de móvil usan viewport simulado, sin acreditar una sesión física en Pixel.
