# Refactorizar backend de capacitaciones y reforzar integridad temporal (HU-03/HU-04)

`training-service.js` concentra validación, consultas SQL y coordinación de las operaciones de capacitaciones. Se separan validadores y persistencia para facilitar el mantenimiento de HU-04 y el registro de HU-03, conservando las rutas y respuestas del frontend. Además, la migración incremental 002 evita que una escritura SQL directa guarde fechas inexistentes u horas fuera del formato admitido por la API.

Base: `main`. Rama: `feature/adel-refactor-backend`. Referencia funcional previa: `eb004641b114d8c71f86af08b05f0f9e073baf73`.

## Cambios

- Validadores Zod en `server/validation/training-validation.js`; SQL parametrizado en `server/repositories/training-repository.js`; coordinación transaccional y reglas de negocio en `server/services/training-service.js`.
- Migración `002_training_dates.sql` con controles de calendario/horarios, preservación de datos y rechazo de históricos inválidos sin corrección silenciosa.
- Pruebas de contrato, obligatoriedad, edición, duplicados, estados, rollback de auditoría, persistencia y migración en bases aisladas.
- Evidencia antes/después, decisiones, trazabilidad, instrucciones de migración/reversión y contribución LaTeX de Adel.

Se aplica responsabilidad única y cohesión sin dependencias nuevas. Se evaluó State y se conserva el mapa de transiciones existente: el comportamiento actual no justifica una jerarquía de clases por estado.

## Compatibilidad y límites

POST/GET/PUT `/api/trainings` mantienen campos, formato JSON y códigos HTTP. PUT conserva responsable y `created_at`; las mutaciones mantienen permisos, CSRF y auditoría atómica. No se requiere modificar `src/Trainings.tsx`. La restricción nueva afecta escrituras SQL directas inválidas; la API ya rechazaba esas fechas y horas.

No se aplica la migración a la base de trabajo durante las pruebas. Si existen datos históricos inválidos, 002 aborta y requiere resolverlos explícitamente. La revisión humana, la validación de las reglas con Paz Sur y la integración real siguen pendientes hasta acreditarse. La rama de Brenda conserva sus aportes separados.

## Validación y evidencia

- Antes del cambio: `npm.cmd test`, 17/11/2026, 28 pruebas aprobadas y 0 fallos.
- Después: `npm.cmd run check`, 17/11/2026, 68 pruebas aprobadas (incluye 25 subcasos de estados), 0 fallos; TypeScript y Vite compilan con código 0. La advertencia de tamaño del paquete no bloquea el build; las fuentes frontend y las dependencias no cambiaron en esta etapa.
- Focal migración/persistencia: 8/8 aprobadas; revisión técnica independiente asistida por IA sin hallazgos bloqueantes y focal capacitaciones/seguridad 48/48.
- UI: repetición final `npm.cmd run test:ui`, 4 aprobadas en 8,7 s y código 0. El primer intento completó casos pero se interrumpió por cierre trabado; ambos constan en el registro.
- LaTeX: no se encontró compilador; fuentes listas para Overleaf. `main.pdf` es previo a esta etapa y no se presenta como actualizado. Registro completo en `docs/PRUEBAS.md`.
- Comparación: `git diff eb00464 -- server tests` y `docs/adel/REFACTOR_BACKEND.md`.
- Informe: `docs/latex/capitulos/09_refactorizacion_adel.tex`.

Implementación asistida por Codex; no se acredita revisión por otro integrante humano mediante esta descripción.

Commits de código/pruebas: `36b2f2d`, `1440c84`, `541a3bf`. El commit `63cdbd9` retira sólo del índice `.env` y las bases SQLite/WAL/SHM que ya estaban rastreadas, conservando archivos locales. El historial anterior sigue conteniéndolos; no se reescribió ni se presenta como saneado. Evidencias exportadas en `docs/adel/antes/`, `ANTES_DESPUES.diff` y `EVIDENCIAS_SHA256.txt`.
