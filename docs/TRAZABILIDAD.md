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
| HU-03 Registrar capacitación | CA-03-1..3; CP-03-V/I/L | `src/Trainings.tsx`. | `/api/trainings`, `server/routes/trainings.js`, `server/services/training-service.js`. | `trainings`, referencias, unicidad de código y restricciones. | API:alta/consulta/errores/cupos; UI:alta y validación horario. Reapertura de base en `tests/persistence.test.js`. |
| HU-04 Modificar capacitación | CA-04-1..3; CP-04-V/I/L | `src/Trainings.tsx`. | `PUT /api/trainings/:id`, servicio de capacitación. | Actualización conservando ID y responsable. | API:edición/transiciones/cierre; UI:edición y detalle persistido. Cupos con inscritos requiere HU-06/19. |
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

Para cada ejecución conservar: fecha Lima, comando, versión del entorno,
base/datos aislados, resultado/errores y criterios cubiertos. Un resultado de
API no demuestra automáticamente que la interfaz fue probada en navegador.
Una compilación no demuestra accesibilidad o facilidad de uso.

La revisión humana, conformidad del cliente, PR e integración se mantienen
**pendientes** hasta disponer de sus registros. No existen claves/URLs de Jira
o PR verificadas en esta matriz. El estado de la DoD no se deduce del número
de tests aprobados.
