# Matriz de trazabilidad y estado verificable

Fecha: **2026-11-12, America/Lima**. Los identificadores HU proceden del
encargo, no de claves verificadas de Jira. Esta matriz enlaza requisitos,
criterios, módulos y evidencia sin convertir diseño en implementación.

Cada fila remite a su tarjeta en [BACKLOG.md](BACKLOG.md) y a sus tres criterios
`CA-XX-1..3` y casos diseñados `CP-XX-V/I/L` en
[CRITERIOS_ACEPTACION.md](CRITERIOS_ACEPTACION.md). Los RNF están en
[REQUISITOS.md](REQUISITOS.md).

## Incremento V1 implementado y comprobado localmente

Las rutas y archivos de esta tabla corresponden al árbol real. `npm.cmd run
check` aprobó28 pruebas de API/persistencia y build; `npm.cmd run test:ui`
aprobó4 pruebas de Chrome. Evidencia en [PRUEBAS.md](PRUEBAS.md). Estos resultados
no cierran revisión humana, validación cliente ni integración requeridas por la DoD.

| HU | Criterios/casos | Interfaz real | API / servicio reales | Persistencia | Evidencia y estado |
| --- | --- | --- | --- | --- | --- |
| HU-01 Registrar usuarios | CA-01-1..3; CP-01-V/I/L | `src/Users.tsx`. | `/api/users`, `server/routes/users.js`, `server/services/user-service.js`. | `users`, unicidad de correo/documento y hash. | API: altas/duplicados/campos/límites; UI:alta/edición/duplicado. Probado localmente; revisión humana pendiente. |
| HU-02 Roles y permisos | CA-02-1..3; CP-02-V/I/L | `src/Users.tsx`, autorización de navegación en `src/App.tsx`. | `/api/users/:id/roles`, `/api/roles`, `/api/permissions`; servicio de usuarios y `server/security.js`. | `roles`, `permissions`, `user_roles`, `role_permissions`. | `tests/api.test.js` y `security.test.js`: último administrador, rol protegido, permiso efectivo y escalamiento directo/indirecto. UI de permisos no tiene E2E específico. |
| HU-03 Registrar capacitación | CA-03-1..3; CP-03-V/I/L | `src/Trainings.tsx`, `src/TrainingForm.tsx`, `src/trainingForm.ts`. | `/api/trainings`, `server/routes/trainings.js`, `server/services/training-service.js`. | `trainings`, referencias, unicidad de código y restricciones. | API cubre alta/consulta/errores/cupos. UI cubre horarios invertidos sin enviar, rechazo de código duplicado junto al campo y alta con cupo uno e instructor vacío. Reapertura en `tests/persistence.test.js`. |
| HU-04 Modificar capacitación | CA-04-1..3; CP-04-V/I/L | `TrainingEditor` carga el detalle por ID. `trainingForm.ts` concentra los estados editables y `TrainingForm` conserva el borrador ante errores. | `GET /api/trainings/:id` para la precarga y `PUT /api/trainings/:id` para guardar con las validaciones vigentes. | Actualización del mismo ID y responsable. La asignación cambia por sustitución o retiro explícito. | Regresiones de precarga, edición, transiciones, cierres, instructor inactivo y recuperación de errores en `tests/ui.spec.ts`. Rechazos de PUT sin cambios persistidos en `tests/api.test.js`. Resultados en `docs/PRUEBAS.md`. Cupos con inscritos requiere HU-06/19. |
| HU-16 Iniciar sesión | CA-16-1..3; CP-16-V/I/L | `src/App.tsx`, `src/api.ts`. | `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, seguridad de sesión. | `sessions_auth`, hashes y expiración. | API:login/logout/CSRF/inactividad/revocación/límite; UI:login incorrecto/correcto/logout y cookie HttpOnly. |

Los casos CP son especificaciones; no hay equivalencia automática de una fila
CP con un test. El registro de pruebas detalla cobertura, resultados y límites.
No se afirma cobertura completa de accesibilidad, concurrencia o de las28 HU.

## Historias posteriores y apoyos parciales

Las rutas siguientes proceden del contrato o son **diseño candidato**.
No deben mostrarse como funciones disponibles si no están implementadas.

| HU | Criterios/casos | Módulo/relación de diseño | Evidencia necesaria | Estado de alcance |
| --- | --- | --- | --- | --- |
| HU-05 Asignar instructor | CA-05-1..3; CP-05-V/I/L | Capacitación + perfil instructor; `instructor_id`. | Asignación válida, identidad/rol inválido y sustitución. | Candidato V2; un campo opcional en V1 no cierra la historia. |
| HU-06 Registrar participantes | CA-06-1..3; CP-06-V/I/L | Inscripciones; `/trainings/:id/enrollments`. | Persistencia, duplicado, permisos y carrera por último cupo. | Candidato V2. |
| HU-07 Consultar asignadas | CA-07-1..3; CP-07-V/I/L | Consulta de capacitaciones con alcance de instructor. | Lista/detalle propios y denegación de datos ajenos. | Candidato V2; el soporte de alcance en API V1 no prueba todo el flujo. |
| HU-08 Asistencia | CA-08-1..3; CP-08-V/I/L | Sesiones, inscripciones y `attendance`; `/sessions/:id/attendance`. | Lote válido, lote inválido atómico y corrección. | Candidato V3. |
| HU-09 Evaluaciones | CA-09-1..3; CP-09-V/I/L | `evaluations`; `/enrollments/:id/evaluation`. | Nota válida, fuera de rango y extremos acordados. | Candidato V3. |
| HU-10 Certificado | CA-10-1..3; CP-10-V/I/L | `certificates`; `/enrollments/:id/certificate`. | Elegibilidad, denegación y emisión única. | Candidato V4; opcional para el producto. |
| HU-11 Inscripciones propias | CA-11-1..3; CP-11-V/I/L | Consulta con alcance de participante y `enrollments`. | Datos propios, intento ajeno y lista vacía. | Candidato V2. |
| HU-12 Resultados | CA-12-1..3; CP-12-V/I/L | Consulta de evaluación/asistencia propias. | Resultado, aislamiento y pendiente distinto de cero. | Candidato V3. |
| HU-13 Historial | CA-13-1..3; CP-13-V/I/L | `/history`, inscripciones y resultados. | Consolidación correcta, alcance y filtro límite. | Candidato V3. |
| HU-14 Reportes | CA-14-1..3; CP-14-V/I/L | `/reports`, `/reports/export.csv`. | Cálculo conocido, permisos y denominador vacío. | Candidato V4; requiere división. |
| HU-15 Estado | CA-15-1..3; CP-15-V/I/L | Campo `status`, filtro y modelo de transiciones. | Estado persistido, filtro inválido y transición. | Consulta básica prevista V1; historia no cerrada por ello. |
| HU-17 Instructores | CA-17-1..3; CP-17-V/I/L | Identidad común + rol/especialidad; `/instructors`. | Perfil, prevención de escalamiento e inactividad. | Candidato V2. |
| HU-18 Descargar certificado | CA-18-1..3; CP-18-V/I/L | `/certificates/:id/download`, documento PDF. | Archivo real, propiedad y legibilidad. | Candidato V4. |
| HU-19 Cupos | CA-19-1..3; CP-19-V/I/L | Capacidad y conteo de inscripciones activas. | Reducción inválida y transacción frente a concurrencia. | Candidato V2; validación del campo en V1 es apoyo parcial. |
| HU-20 Marcas | CA-20-1..3; CP-20-V/I/L | Catálogo de marca y relación opcional con capacitación. | Alta, duplicado e historia sin borrado. | Candidato V4; sin rutas comprometidas. |
| HU-21 Campañas | CA-21-1..3; CP-21-V/I/L | Campaña con período y relación opcional. | Asociación, intervalo inválido y límite temporal. | Candidato V4. |
| HU-22 Sede/área | CA-22-1..3; CP-22-V/I/L | Catálogos y pertenencia del trabajador. | Referencias, alcance y traslado según política. | Candidato V4; requiere división. |
| HU-23 Pendientes | CA-23-1..3; CP-23-V/I/L | Necesidad/población y cumplimiento por período. | Definición aprobada, conjunto conocido y vencimiento límite. | Candidato V4; incertidumbre de negocio. |
| HU-24 Por marca | CA-24-1..3; CP-24-V/I/L | Filtro sobre relación HU-20. | Resultado exacto, ID inválido y conjunto vacío. | Candidato V4. |
| HU-25 Por sede | CA-25-1..3; CP-25-V/I/L | Filtro sobre relación sede/capacitación validada. | Semántica de sede, alcance y virtual/multisede. | Candidato V4. |
| HU-26 Alertas | CA-26-1..3; CP-26-V/I/L | Notificación por canal aprobado. | Entrega real aislada, cancelación e idempotencia. | Candidato V4; canal/infraestructura no aprobados. |
| HU-27 Reprogramación | CA-27-1..3; CP-27-V/I/L | Cambios de fecha con sesiones y avisos. | Conservación de vínculos, rechazo y sesiones fuera de intervalo. | Candidato V4; editar fechas en V1 no cubre efectos futuros. |
| HU-28 Sesiones | CA-28-1..3; CP-28-V/I/L | `training_sessions`; `/trainings/:id/sessions`. | Sesión persistida, fuera de intervalo y duplicado/límites. | Candidato V3. |

## Tareas técnicas transversales

| Tarea | Relación | Evidencia requerida |
| --- | --- | --- |
| Diagnóstico inicial | Todas las HU | Inventario, ramas y tecnologías reales en `DIAGNOSTICO_INICIAL.md`. |
| Migraciones y semilla | HU-01,03,16 y futuras | Arranque reproducible y datos ficticios; no credenciales reales. |
| Arquitectura y diagramas | Todas | Fuentes del modelo, diferenciando entidades actuales de candidatas. |
| Comprobaciones automáticas | V1 y regresión | Comando, salida, fecha y alcance; no inferir pruebas por tener scripts. |
| Informe LaTeX | Todas | Capítulos/bitácora con código y resultados reales; compilación solo si fue ejecutada. |
| CI | Todas | Workflow configurado y resultado remoto cuando exista; no equiparar prueba local a CI remota. |

## Registro de evidencia y cierre

Actualización de ejecución conjunta (17/11/2026, RNF-06/07/10; soporte HU-01/02/03/04/16): `package.json` añade `local` para compilar y servir web/API juntas. `vite.config.ts` alinea HOST/PORT con el backend; siete casos en `tests/dev-config.test.js` usan sólo archivos ficticios. `.env.example` queda sin contraseña. Antes de abrir la base local se creó respaldo consistente; no se sembraron cuentas ni cambiaron contraseñas. La comprobación de disponibilidad observó web, `/api/health` y dos recursos compilados con 200 en `http://127.0.0.1:3001`. La suite completa y build aprobaron 75 pruebas. Detalles de ejecución en `PRUEBAS.md`; esta operación local no constituye integración de ramas ni cierre de la DoD.

Actualización de publicación, 17/11/2026: push de `feature/adel-refactor-backend` confirmado, [PR #2 abierto como borrador hacia main](https://github.com/Adel01mcc/sistema-gestion-capacitaciones-unsaac/pull/2), documentación inicial en `2441af0`. Se publicó evidencia en AD-4 mediante el comentario `10039`; no se cambiaron estados ni datos del Sprint. [Entrega de los quince resultados](adel/ENTREGA.md). La revisión humana y la integración real continúan pendientes.

Para cada ejecución conservar: fecha Lima, comando, versión del entorno,
base/datos aislados, resultado/errores y criterios cubiertos. Un resultado de
API no demuestra automáticamente que la interfaz fue probada en navegador.
Una compilación no demuestra accesibilidad o facilidad de uso.

La revisión humana, conformidad del cliente, PR e integración se mantienen
**pendientes** hasta disponer de sus registros. No existen claves/URLs de Jira
o PR verificadas en esta matriz. El estado de la DoD no se deduce del número
de tests aprobados.

## Segunda etapa de Adel — 17 de noviembre de 2026

Este registro añade evidencia posterior sin reescribir las historias, sus puntos ni las fechas del Sprint. Referencia funcional previa: `eb004641b114d8c71f86af08b05f0f9e073baf73`. Rama creada desde `main`: `feature/adel-refactor-backend`. La rama remota de Brenda, observada en `845abe2` tras fetch, conserva sus aportes separados.

| HU / tarea | Cambio concreto | Fuentes reales | Evidencia ejecutada | Estado de aceptación |
| --- | --- | --- | --- | --- |
| HU-03, soporte backend | Extraer entradas/filtros y SQL; conservar POST, responsable desde sesión y alta/auditoría atómicas | `server/validation/training-validation.js`, `server/repositories/training-repository.js`, `server/services/training-service.js` | Campos obligatorios, calendario/horario, duplicados, respuesta 201 y rollback por fallo de auditoría en `tests/trainings.test.js`; suite final 68/68 | Verificado técnicamente para casos registrados; no declara la HU Hecha |
| HU-04, contribución principal | Separar coordinación de persistencia; conservar PUT y detalle, ID, responsable y creación | Mismos módulos; rutas existentes `server/routes/trainings.js` | Inexistentes y IDs inválidos; 25 pares de estados; duplicado sin efectos; edición por otro gestor conserva responsable; persistencia al reabrir SQLite/API | Revisión humana e integración pendientes de acreditar |
| HU-03/HU-04, TT integridad | Rechazar calendario/horario inválidos también por SQL directo | `server/migrations/002_training_dates.sql` | `tests/training-migration.test.js` y `tests/persistence.test.js`: focal 8/8, preservación/FK/personalizaciones, históricos inválidos, reversión y reaplicación | Migración comprobada sólo en bases aisladas; base de trabajo no utilizada |
| TT diseño relacionado con HU-04 | Evaluar State y conservar mapa por simplicidad de las reglas | `server/constants.js`, `updateTraining`; ADR-017 | Matriz de 25 pares con expectativas explícitas en `tests/trainings.test.js` | Decisión técnica; supuestos del cliente pendientes |
| TT seguridad | Dejar de rastrear `.env` y SQLite/WAL/SHM, conservando archivos locales | Commit real `63cdbd9`; `.gitignore` existente | Verificación de presencia local y de retiro del índice sin leer contenidos | Ejecutado; historia anterior no saneada ni reescrita |
| TT informe y exposición | Antes/después, explicación individual, Jira/Lab8 y capítulo LaTeX | `docs/adel/`, `docs/latex/capitulos/09_refactorizacion_adel.tex`, bitácora | Fuentes reales y comparación Git; compilador no disponible en entorno consultado | Fuentes preparadas para Overleaf; PDF anterior no actualizado |

**Registro de pruebas:** `npm.cmd test` antes del cambio, 28/28; nuevos casos focales antes de la extracción, 35/35; `npm.cmd run check` final, 68/68 (43 pruebas de primer nivel y 25 subcasos), TypeScript/Vite con código 0. La revisión técnica independiente asistida por IA no encontró bloqueos y ejecutó 48 pruebas focales de capacitaciones y seguridad; no equivale a revisión humana. Véase [registro actualizado](PRUEBAS.md#segunda-etapa-de-adel--17-de-noviembre-de-2026).

El primer runner UI completó cuatro casos pero quedó trabado al cerrar y se interrumpió con código 1. La repetición de `npm.cmd run test:ui` con permisos ampliados terminó: **4 aprobadas en 8,7 s, código 0**. Las capturas de prueba se conservaron en `.verification/adel-ui/`; las dos capturas históricas versionadas se restauraron exactamente desde `eb00464`.

Commits reales: `63cdbd9` (seguridad), `36b2f2d` (extracción del backend), `1440c84` (migración temporal y sus pruebas), `541a3bf` (regresión API). El preparador Overleaf se ejecutó con código 0; no equivale a compilación del PDF.

La consulta autorizada de Jira verificó **AD-4, HU-04, asignada a Adel**, con estado `Listo` ya existente. Las subtareas AD-35 a AD-39 estaban sin asignación y `Por hacer`; AD-3 corresponde a Daniela y no se atribuye a Adel. La preparación de `docs/adel/JIRA_LAB8.md` no acredita por sí misma que se haya publicado un comentario. El estado de publicación se registrará cuando exista la respuesta real del conector; no se cambian estados, puntos ni fechas para simular el trabajo.

No se considera que una historia haya cumplido la DoD por aprobar pruebas. La revisión humana, la validación de supuestos y la integración real siguen requiriendo evidencia propia. Las referencias de esta sección actualizan el estado observado el 17/11 y no alteran retrospectivamente el registro del 12/11.
