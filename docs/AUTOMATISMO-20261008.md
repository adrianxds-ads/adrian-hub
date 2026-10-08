# Automatismo y gráficas comunes — 2026-10-08

Ocho apps de estudio usan HubCharts 1.0.0 y AdrianPerformance 1.1.0. Las gráficas comparten geometría 600×280, escalas, tipografía y bandas AVS; se han sustituido los renderizadores antiguos de resultados y aprendizaje, incluidos los dashboards secundarios y las barras de Pizarras.

Automatismo = aciertos rápidos / respuestas con tiempo válido. Ventana móvil de hasta 60 respuestas; un punto cada 15, incluyendo el último grupo parcial. Umbral: 4 s en quizzes y 10 s en Cambridge/Key Word; en Key Word solo puntúan como acierto automático las respuestas 2/2. HOTI excluye ítems neutrales. Lectura previa excluida donde existe una fase propia. No se infieren tiempos antiguos a partir de la duración de una sesión. Una flashcard revelada sin evaluación conserva su carácter de repaso y no genera aciertos ni automatismos ficticios.

Los tiempos históricos de English/Cloze/Català/Phrasal/Pizarras permiten reconstruir la gráfica. HOTI y Key Word conservan desde esta versión tiempos por respuesta dentro de sus sesiones existentes; Cambridge guarda tiempos por hueco desde su apertura/foco hasta la última respuesta registrada. Los huecos sin tiempo válido aparecen sin evidencia temporal.

Validación: Playwright con rutas locales y almacenamiento aislado, pantallas reales de estadísticas a 390 y 1280 px, cálculos con aciertos rápidos/fallos rápidos/aciertos lentos/tiempos ausentes, lectura de datos persistidos tras recarga, cuatro gráficas comunes, ausencia de desbordamientos y errores JS. Capturas en la carpeta de auditoría. Esta prueba simula móvil; no acredita una sesión física en Pixel ni sincronización entre dispositivos.

Se conservan las claves de almacenamiento y los algoritmos longitudinales; no se alteran las recompensas.
