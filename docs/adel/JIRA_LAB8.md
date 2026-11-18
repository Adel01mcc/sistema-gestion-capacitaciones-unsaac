# Actualización de Jira y Laboratorio 8 — Adel

Fecha real de trabajo: **17/11/2026, America/Lima**. Las referencias HU-03/HU-04 son identificadores del repositorio; no se convierten automáticamente en claves Jira. No se modifican Story Points, fechas de Sprint ni historial del Burndown.

Se verificó en el conector que **AD-4 corresponde a HU-04 y está asignada a Adel**, con estado remoto `Listo` ya existente antes de esta actualización. Las subtareas AD-35 a AD-39 aparecían sin asignación y `Por hacer`; ese estado no se cambia para simular cierre. **AD-3 pertenece a Daniela**: el texto de soporte de HU-03 se conserva como material de coordinación y no autoriza atribuirse ni actualizar su tarea.

## Comentario para HU-04 — Modificar capacitación

```text
17/11/2026 — Adel: refactorización de arquitectura y backend de HU-04, con asistencia de Codex.

Base funcional de comparación: eb004641b114d8c71f86af08b05f0f9e073baf73.
Rama: feature/adel-refactor-backend; base de integración observada: main.

Subtareas:
- Separar validación de entradas/filtros y acceso SQL del servicio de capacitaciones.
- Mantener PUT /api/trainings/:id y el contrato JSON consumido por el frontend.
- Conservar responsable original, fecha de creación, autorización, CSRF y atomicidad de edición/auditoría.
- Añadir regresión para campos ausentes, registros inexistentes, código duplicado, matriz de estados, fallo de auditoría y persistencia después de editar y reabrir SQLite.
- Añadir integridad temporal en SQLite mediante migración incremental 002, preservando datos y abortando si hay históricos inválidos.
- Evaluar State: se conserva el mapa de transiciones; las reglas actuales no justifican clases por estado.

Evidencias: docs/adel/REFACTOR_BACKEND.md; tests/trainings.test.js; tests/training-migration.test.js; docs/PRUEBAS.md; docs/latex/capitulos/09_refactorizacion_adel.tex.
Prueba inicial ejecutada: npm.cmd test, 28/28 aprobadas antes del cambio.
Pruebas finales: npm.cmd run check, 68 pruebas aprobadas (incluye 25 subcasos), 0 fallos; TypeScript y Vite compilan con código 0. Prueba focal de migración/persistencia: 8/8. Detalle en docs/PRUEBAS.md.
Commits reales: 63cdbd9 seguridad; 36b2f2d extracción backend; 1440c84 migración temporal y pruebas; 541a3bf regresión API.
Navegador: repetición final npm.cmd run test:ui, 4 aprobadas en 8,7 s, código 0. Primer intento completó casos pero se interrumpió por cierre trabado; ver registro.

Estado: contribución técnica preparada para revisión; no declarar Hecha sin revisión humana e integración comprobada. El estado remoto Listo ya existía y no acredita cierre por esta etapa.
Pendientes: revisión por otro integrante, validación de supuestos de negocio, integración autorizada y aplicación controlada de la migración a la base de trabajo.
```

## Comentario de soporte para HU-03 — Registrar capacitación

```text
17/11/2026 — Soporte backend de Adel para HU-03, dentro de la misma rama.

Se extraen los validadores y el acceso SQL compartidos con HU-04, conservando POST /api/trainings, respuesta 201 y responsable derivado de la sesión. Se comprueban campos obligatorios, calendario, horario diario, cupo, código único e instructor válido. La capacitación y la auditoría se guardan o revierten juntas.

La migración 002 protege también las escrituras directas de fechas/horas inválidas. No cambia de motor de base ni reescribe la migración inicial. Las pruebas usan datos ficticios y bases aisladas.

Evidencias y resultados: docs/adel/REFACTOR_BACKEND.md y docs/PRUEBAS.md. Commits reales: 36b2f2d extracción, 1440c84 migración y 541a3bf regresión. El enlace de PR sólo se añade cuando exista. No cambia el alcance, los puntos ni las fechas del Sprint. Revisión humana e integración pendientes de acreditar.
```

## Registro de subtareas para Laboratorio 8

| HU / tarea técnica | Actividad | Fecha | Estado real | Commit/evidencia |
| --- | --- | --- | --- | --- |
| HU-04 / TT arquitectura | Separación de validación, repositorio y servicio | 17/11/2026 | Preparada para revisión | `36b2f2d`, diff desde `eb00464` |
| HU-03/HU-04 / TT datos | Restricción temporal incremental y reversión | 17/11/2026 | Preparada para revisión; base de trabajo sin migrar por estas pruebas | `1440c84`, migración 002 y prueba aislada |
| HU-04 / TT calidad | Regresión de edición, atomicidad, estados y persistencia | 17/11/2026 | Suite final 68/68 y build correcto; UI final 4/4, código 0 | `541a3bf`, `tests/trainings.test.js`, `docs/PRUEBAS.md` |
| TT diseño | Evaluación State | 17/11/2026 | Decisión documentada; mapa simple conservado | `docs/adel/REFACTOR_BACKEND.md` |
| TT documentación | Antes/después, LaTeX y guion individual | 17/11/2026 | Preparada para revisión | `docs/adel/`, capítulo individual |

La publicación de estos comentarios sólo procede sobre tareas verificadas como responsabilidad de Adel. La existencia de un conector no acredita por sí sola el proyecto correcto, la asignación o que un comentario haya sido enviado. El resumen de entrega debe distinguir comentario preparado y actualización efectivamente publicada.
