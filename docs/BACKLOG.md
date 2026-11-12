# Product Backlog candidato

Fecha: **2026-11-12, America/Lima**. Todas las prioridades y puntos siguientes
son una **propuesta nueva**. No proceden de una consulta a Jira, no reemplazan
estimaciones históricas y no certifican aprobación del cliente. Los puntos
miden complejidad relativa; no son horas ni una capacidad comprometida.

El Sprint 1 histórico conserva HU-01, HU-02, HU-03 y HU-04. Se añade HU-16
como dependencia técnica de V1; es una propuesta de planificación, no una
reescritura de ese Sprint. Véase [SPRINT_1.md](SPRINT_1.md).

## Convenciones de las tarjetas

- **Tarjeta:** relato de usuario y descripción del resultado.
- **Conversación:** preguntas pendientes de validar con las personas indicadas.
- **Confirmación:** criterios `CA-XX-*` y casos `CP-XX-*` en
  [CRITERIOS_ACEPTACION.md](CRITERIOS_ACEPTACION.md#criterios-por-historia).
- **INVEST:** beneficio explícito, dependencias visibles y reglas negociables.
  Las historias de 8 puntos deben dividirse antes de comprometerlas. Cada
  entrega debe conservar valor comprobable, sin crear duplicados de identidad
  o de consultas existentes. Las tarjetas no equivalen a tareas terminadas.
- **Prioridad:** Must = núcleo candidato, Should = importante, Could = posterior.
  La prioridad del producto no obliga a incluir toda historia Must en V1.
- **RNF:** referencias definidas en [REQUISITOS.md](REQUISITOS.md).

## Vista de priorización

| HU | Nombre | Prioridad | SP propuestos | Situación |
| --- | --- | --- | ---: | --- |
| HU-01 | Registrar usuarios | Must | 5 | V1: en construcción |
| HU-02 | Asignar roles y permisos | Must | 5 | V1: en construcción |
| HU-03 | Registrar capacitación | Must | 5 | V1: en construcción |
| HU-04 | Modificar capacitación | Must | 3 | V1: en construcción |
| HU-05 | Asignar instructor | Should | 3 | Candidato V2 |
| HU-06 | Registrar participantes | Must | 5 | Candidato V2 |
| HU-07 | Consultar capacitaciones asignadas | Should | 3 | Candidato V2 |
| HU-08 | Registrar asistencia | Must | 5 | Candidato V3 |
| HU-09 | Registrar evaluaciones | Should | 3 | Candidato V3 |
| HU-10 | Registrar certificado | Could | 5 | Candidato V4 |
| HU-11 | Consultar capacitaciones inscritas | Must | 3 | Candidato V2 |
| HU-12 | Consultar resultados | Should | 3 | Candidato V3 |
| HU-13 | Consultar historial de capacitación | Should | 5 | Candidato V3 |
| HU-14 | Consultar reportes consolidados | Should | 8 | Candidato V4; dividir |
| HU-15 | Consultar estado de las capacitaciones | Must | 2 | Candidato; soporte básico en V1 |
| HU-16 | Iniciar sesión | Must | 5 | V1: en construcción |
| HU-17 | Gestionar instructores | Should | 5 | Candidato V2 |
| HU-18 | Descargar certificado | Could | 3 | Candidato V4 |
| HU-19 | Gestionar cupos de capacitación | Must | 3 | Candidato V2; campo inicial V1 |
| HU-20 | Registrar marcas proveedoras | Should | 3 | Candidato V4 |
| HU-21 | Gestionar campañas comerciales | Could | 3 | Candidato V4 |
| HU-22 | Gestionar trabajadores por sede y área | Should | 8 | Candidato V4; dividir |
| HU-23 | Consultar trabajadores pendientes de capacitación | Should | 8 | Candidato V4; refinar |
| HU-24 | Consultar capacitaciones por marca proveedora | Could | 3 | Candidato V4 |
| HU-25 | Consultar capacitaciones por sede | Should | 3 | Candidato V4 |
| HU-26 | Recibir alertas de capacitaciones programadas | Could | 8 | Candidato V4; dividir |
| HU-27 | Reprogramar capacitaciones pendientes | Should | 5 | Candidato V4 |
| HU-28 | Registrar sesiones de capacitación | Must | 5 | Candidato V3 |

## Tarjetas detalladas

### HU-01 — Registrar usuarios

**Tarjeta:** Como administrador, quiero registrar usuarios con sus datos y un acceso protegido para identificar a las personas que utilizarán el sistema.

**Descripción:** Alta de identidad, validación de campos, correo/documento únicos y persistencia. No equivale a inscripción en una capacitación. Una cuenta con users.manage sin roles.manage solo puede crear participantes y no editar cuentas con permisos users.manage o roles.manage.

**Prioridad y tamaño:** Must, 5 SP propuestos. Incluye formulario, validación de identidad, hashing y rechazos de duplicados.

**Dependencias:** HU-16.

**RNF relevantes:** RNF-01,02,03,04,07.

**Conversación pendiente:** ¿Qué documentos admite la empresa? ¿El correo es obligatorio para todos? ¿Quién entrega la contraseña inicial?

**Confirmación:** criterios CA-01-1 a CA-01-3; casos CP-01-V,
CP-01-I y CP-01-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** V1: en construcción. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-02 — Asignar roles y permisos

**Tarjeta:** Como administrador, quiero asignar roles a usuarios y gestionar sus permisos para controlar las operaciones disponibles para cada persona.

**Descripción:** Asignar uno o varios de los seis roles fijos requiere roles.manage; editar nombre y permisos de roles permitidos requiere el mismo permiso. users.manage por sí solo no permite alterar roles. El rol administrador y el último administrador activo permanecen protegidos.

**Prioridad y tamaño:** Must, 5 SP propuestos. Involucra relaciones usuario/rol, permisos efectivos y prevención de escalamiento.

**Dependencias:** HU-01, HU-16.

**RNF relevantes:** RNF-01,02,03,04.

**Conversación pendiente:** ¿Se permiten roles simultáneos? ¿Qué operaciones realiza RR. HH.? ¿Quién autoriza cambios de privilegios?

**Confirmación:** criterios CA-02-1 a CA-02-3; casos CP-02-V,
CP-02-I y CP-02-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** V1: en construcción. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-03 — Registrar capacitación

**Tarjeta:** Como coordinador, quiero registrar una capacitación con sus datos de planificación para organizar una actividad que luego pueda programarse.

**Descripción:** Crear título, código, descripción, fechas, horas, modalidad, lugar y cupo; el responsable se identifica desde la sesión.

**Prioridad y tamaño:** Must, 5 SP propuestos. Entrega vertical con formulario, servicio, persistencia y validación temporal.

**Dependencias:** HU-02, HU-16.

**RNF relevantes:** RNF-01,03,05,07.

**Conversación pendiente:** ¿Cómo se genera el código? ¿Qué datos son obligatorios en una capacitación virtual? ¿Puede abarcar varios días?

**Confirmación:** criterios CA-03-1 a CA-03-3; casos CP-03-V,
CP-03-I y CP-03-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** V1: en construcción. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-04 — Modificar capacitación

**Tarjeta:** Como coordinador, quiero actualizar los datos de una capacitación editable para mantener su planificación vigente.

**Descripción:** Editar datos permitidos y comprobar restricciones de estado y capacidad sin crear otra capacitación.

**Prioridad y tamaño:** Must, 3 SP propuestos. Reutiliza el alta y agrega reglas de actualización y estados bloqueados.

**Dependencias:** HU-03.

**RNF relevantes:** RNF-01,03,08.

**Conversación pendiente:** ¿Se pueden corregir registros finalizados? ¿Cómo se comunica una modificación? ¿Hace falta conservar cada versión?

**Confirmación:** criterios CA-04-1 a CA-04-3; casos CP-04-V,
CP-04-I y CP-04-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** V1: en construcción. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-05 — Asignar instructor

**Tarjeta:** Como coordinador, quiero asignar un instructor a una capacitación para definir quién será responsable de impartirla.

**Descripción:** Elegir un instructor activo y consultar la asignación. Definir sustitución y posibles conflictos de horario.

**Prioridad y tamaño:** Should, 3 SP propuestos. Relación simple con controles de rol y disponibilidad por confirmar.

**Dependencias:** HU-03, HU-17.

**RNF relevantes:** RNF-01,03,04.

**Conversación pendiente:** ¿Se permite más de un instructor? ¿Un instructor externo necesita cuenta? ¿Se bloquean horarios superpuestos?

**Confirmación:** criterios CA-05-1 a CA-05-3; casos CP-05-V,
CP-05-I y CP-05-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-06 — Registrar participantes

**Tarjeta:** Como coordinador, quiero inscribir trabajadores en una capacitación para organizar su participación sin superar los cupos.

**Descripción:** Seleccionar personas existentes, crear inscripción y consultar inscritos. Cancelar según regla acordada; no duplicar identidades.

**Prioridad y tamaño:** Must, 5 SP propuestos. Incluye unicidad, transacción de cupos y manejo de intentos simultáneos.

**Dependencias:** HU-01, HU-03, HU-19.

**RNF relevantes:** RNF-01,03,04,10.

**Conversación pendiente:** ¿La inscripción es individual o masiva? ¿Puede reinscribirse una persona cancelada? ¿Existe lista de espera?

**Confirmación:** criterios CA-06-1 a CA-06-3; casos CP-06-V,
CP-06-I y CP-06-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-07 — Consultar capacitaciones asignadas

**Tarjeta:** Como instructor, quiero consultar mis capacitaciones asignadas para preparar las actividades que debo impartir.

**Descripción:** Listar y abrir capacitaciones asignadas al instructor autenticado, con fechas y estado.

**Prioridad y tamaño:** Should, 3 SP propuestos. Consulta con filtros y verificación de propiedad en lista y detalle.

**Dependencias:** HU-05, HU-16.

**RNF relevantes:** RNF-01,04,05,09.

**Conversación pendiente:** ¿Qué datos de los participantes necesita ver el instructor? ¿Debe consultar también actividades pasadas?

**Confirmación:** criterios CA-07-1 a CA-07-3; casos CP-07-V,
CP-07-I y CP-07-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-08 — Registrar asistencia

**Tarjeta:** Como instructor, quiero registrar asistencia por sesión e inscripción para mantener evidencia verificable de la participación.

**Descripción:** Marcar presente, ausente o tardanza para inscritos de una sesión; permitir corrección autorizada y evitar duplicados.

**Prioridad y tamaño:** Must, 5 SP propuestos. Registro por lote, reglas de pertenencia y actualización atómica.

**Dependencias:** HU-06, HU-28, HU-07.

**RNF relevantes:** RNF-01,03,04,08.

**Conversación pendiente:** ¿Quién puede corregir asistencia y hasta cuándo? ¿Cómo cuenta la tardanza? ¿Se necesita registrar hora de entrada?

**Confirmación:** criterios CA-08-1 a CA-08-3; casos CP-08-V,
CP-08-I y CP-08-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V3. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-09 — Registrar evaluaciones

**Tarjeta:** Como instructor, quiero registrar notas y observaciones de mis participantes para informar el resultado del aprendizaje.

**Descripción:** Registrar una evaluación por inscripción dentro de una escala acordada; controlar alcance y edición.

**Prioridad y tamaño:** Should, 3 SP propuestos. Un valor por inscripción con validación de rango y permisos.

**Dependencias:** HU-06, HU-07.

**RNF relevantes:** RNF-01,03,04.

**Conversación pendiente:** ¿Todas las capacitaciones tienen evaluación? ¿Cuál es la escala y nota aprobatoria? ¿Se permite recuperación?

**Confirmación:** criterios CA-09-1 a CA-09-3; casos CP-09-V,
CP-09-I y CP-09-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V3. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-10 — Registrar certificado

**Tarjeta:** Como coordinador, quiero emitir un certificado opcional a una persona elegible para acreditar su participación cuando corresponda.

**Descripción:** Comprobar elegibilidad y registrar emisión única con datos históricos. No exigir certificado para cerrar todas las capacitaciones.

**Prioridad y tamaño:** Could, 5 SP propuestos. Implica condiciones de elegibilidad, snapshot de datos y unicidad.

**Dependencias:** HU-08, HU-09, HU-15.

**RNF relevantes:** RNF-01,03,04,08.

**Conversación pendiente:** ¿Quién certifica? ¿Qué capacitaciones lo ofrecen? ¿Cómo se anula o corrige un certificado?

**Confirmación:** criterios CA-10-1 a CA-10-3; casos CP-10-V,
CP-10-I y CP-10-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-11 — Consultar capacitaciones inscritas

**Tarjeta:** Como participante, quiero consultar mis inscripciones para conocer las capacitaciones en las que debo participar.

**Descripción:** Mostrar capacitaciones propias con fecha, modalidad y estado de inscripción; sin acceso a inscripciones ajenas.

**Prioridad y tamaño:** Must, 3 SP propuestos. Consulta reutilizable con alcance por identidad autenticada.

**Dependencias:** HU-06, HU-16.

**RNF relevantes:** RNF-01,04,05,09.

**Conversación pendiente:** ¿Se muestran inscripciones canceladas? ¿El trabajador puede solicitar inscripción o solo consultar?

**Confirmación:** criterios CA-11-1 a CA-11-3; casos CP-11-V,
CP-11-I y CP-11-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-12 — Consultar resultados

**Tarjeta:** Como participante, quiero consultar mis resultados de capacitación para conocer mi desempeño y asistencia.

**Descripción:** Mostrar notas, observaciones y asistencia propias; distinguir resultado pendiente de nota cero.

**Prioridad y tamaño:** Should, 3 SP propuestos. Presenta datos existentes y diferencia ausencia de evaluación.

**Dependencias:** HU-08, HU-09, HU-11.

**RNF relevantes:** RNF-01,04,05.

**Conversación pendiente:** ¿Cuándo se publican los resultados? ¿Las observaciones son visibles al participante? ¿Existe reclamación?

**Confirmación:** criterios CA-12-1 a CA-12-3; casos CP-12-V,
CP-12-I y CP-12-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V3. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-13 — Consultar historial de capacitación

**Tarjeta:** Como responsable de RR. HH., quiero consultar el historial de un trabajador autorizado para seguir las actividades en las que ha participado.

**Descripción:** Reunir inscripciones, estados, asistencia y resultados por persona y período. El participante consulta únicamente su historial.

**Prioridad y tamaño:** Should, 5 SP propuestos. Consolidación con dos alcances y filtros, sin duplicar información académica.

**Dependencias:** HU-06, HU-08, HU-09.

**RNF relevantes:** RNF-01,04,09.

**Conversación pendiente:** ¿Cuánto tiempo se conserva el historial? ¿Incluye actividades externas? ¿Quién puede verlo por sede?

**Confirmación:** criterios CA-13-1 a CA-13-3; casos CP-13-V,
CP-13-I y CP-13-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V3. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-14 — Consultar reportes consolidados

**Tarjeta:** Como gerencia, quiero consultar reportes agregados de capacitación para evaluar cobertura y resultados del programa.

**Descripción:** Calcular totales y métricas filtrables; separar vista consolidada, detalle autorizado y exportación.

**Prioridad y tamaño:** Should, 8 SP propuestos. Agrupa varias métricas y exportación; dividir en consulta básica y exportación antes del Sprint.

**Dependencias:** HU-06, HU-08, HU-09, HU-15.

**RNF relevantes:** RNF-01,03,04,09.

**Conversación pendiente:** ¿Cuál es el denominador de asistencia y cobertura? ¿Qué períodos y formatos necesita gerencia?

**Confirmación:** criterios CA-14-1 a CA-14-3; casos CP-14-V,
CP-14-I y CP-14-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4; dividir. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-15 — Consultar estado de las capacitaciones

**Tarjeta:** Como coordinador, quiero consultar el estado vigente de las capacitaciones para identificar lo planificado, en curso y concluido.

**Descripción:** Listar y filtrar estados, mostrarlos en detalle y definir las transiciones autorizadas. Una etiqueta no demuestra ejecución de una actividad.

**Prioridad y tamaño:** Must, 2 SP propuestos. Presentación y filtro pequeños; aprobación de transiciones pendiente.

**Dependencias:** HU-03, HU-04.

**RNF relevantes:** RNF-01,03,05.

**Conversación pendiente:** ¿Quién inicia y finaliza una capacitación? ¿Se puede reabrir? ¿Una cancelación requiere motivo?

**Confirmación:** criterios CA-15-1 a CA-15-3; casos CP-15-V,
CP-15-I y CP-15-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato; soporte básico en V1. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-16 — Iniciar sesión

**Tarjeta:** Como usuario registrado, quiero iniciar y cerrar una sesión segura para acceder a las funciones que tengo autorizadas.

**Descripción:** Validar credenciales de una cuenta activa, crear sesión protegida, consultar identidad y cerrar sesión.

**Prioridad y tamaño:** Must, 5 SP propuestos. Autenticación, cookie, expiración, CSRF y casos negativos.

**Dependencias:** Ninguna funcional; infraestructura de usuarios/roles.

**RNF relevantes:** RNF-01,02,04,07.

**Conversación pendiente:** ¿Qué duración tendrá la sesión? ¿Se requiere recuperación de contraseña o SSO? ¿Quién desactiva cuentas?

**Confirmación:** criterios CA-16-1 a CA-16-3; casos CP-16-V,
CP-16-I y CP-16-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** V1: en construcción. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-17 — Gestionar instructores

**Tarjeta:** Como coordinador, quiero registrar y actualizar perfiles de instructores para disponer de personas que puedan impartir capacitaciones.

**Descripción:** Administrar especialidad y estado del instructor sobre la identidad común; no habilitar privilegios administrativos.

**Prioridad y tamaño:** Should, 5 SP propuestos. Perfil y operaciones con permisos limitados, evitando duplicar personas.

**Dependencias:** HU-01, HU-02.

**RNF relevantes:** RNF-01,03,04.

**Conversación pendiente:** ¿Qué datos se requieren de un instructor externo? ¿Se necesita vincularlo con una marca?

**Confirmación:** criterios CA-17-1 a CA-17-3; casos CP-17-V,
CP-17-I y CP-17-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-18 — Descargar certificado

**Tarjeta:** Como participante, quiero descargar un certificado emitido a mi nombre para conservar la acreditación de una capacitación.

**Descripción:** Entregar un PDF de certificado existente y vigente, verificando que el solicitante sea titular o tenga autorización.

**Prioridad y tamaño:** Could, 3 SP propuestos. Generación/entrega de documento con control de propiedad y estado.

**Dependencias:** HU-10, HU-16.

**RNF relevantes:** RNF-01,04,05.

**Conversación pendiente:** ¿Qué formato institucional tendrá? ¿Requiere firma o mecanismo de verificación pública?

**Confirmación:** criterios CA-18-1 a CA-18-3; casos CP-18-V,
CP-18-I y CP-18-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-19 — Gestionar cupos de capacitación

**Tarjeta:** Como coordinador, quiero definir y modificar cupos de una capacitación para evitar inscripciones por encima de la capacidad.

**Descripción:** Validar capacidad positiva, impedir reducir por debajo de inscritos activos y aplicar cupo de forma transaccional.

**Prioridad y tamaño:** Must, 3 SP propuestos. Invariante de capacidad compartido por actualización e inscripción.

**Dependencias:** HU-03; HU-06 para verificación integral.

**RNF relevantes:** RNF-01,03,10.

**Conversación pendiente:** ¿Cero significa sin cupos o ilimitado? ¿Hay sobrecupos autorizados? ¿Cómo se trata una cancelación?

**Confirmación:** criterios CA-19-1 a CA-19-3; casos CP-19-V,
CP-19-I y CP-19-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V2; campo inicial V1. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-20 — Registrar marcas proveedoras

**Tarjeta:** Como coordinador, quiero registrar marcas proveedoras para relacionar actividades con el proveedor correspondiente.

**Descripción:** Mantener un catálogo de marcas, prevenir duplicados acordados y asociar capacitaciones sin exigir marca en las internas.

**Prioridad y tamaño:** Should, 3 SP propuestos. Catálogo y relación opcional con validaciones básicas.

**Dependencias:** HU-02, HU-03.

**RNF relevantes:** RNF-01,03,05.

**Conversación pendiente:** ¿Una capacitación puede tener varias marcas? ¿Se distingue marca de razón social del proveedor?

**Confirmación:** criterios CA-20-1 a CA-20-3; casos CP-20-V,
CP-20-I y CP-20-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-21 — Gestionar campañas comerciales

**Tarjeta:** Como coordinador, quiero gestionar campañas comerciales para organizar las capacitaciones según necesidades de temporada.

**Descripción:** Crear campañas con nombre y período, asociar actividades y mantener las capacitaciones sin campaña.

**Prioridad y tamaño:** Could, 3 SP propuestos. Catálogo temporal y relación opcional; no incluye planificación automática.

**Dependencias:** HU-02, HU-03.

**RNF relevantes:** RNF-01,03,05.

**Conversación pendiente:** ¿Las campañas pueden superponerse? ¿Una capacitación puede apoyar varias campañas?

**Confirmación:** criterios CA-21-1 a CA-21-3; casos CP-21-V,
CP-21-I y CP-21-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-22 — Gestionar trabajadores por sede y área

**Tarjeta:** Como responsable de RR. HH., quiero organizar trabajadores por sede y área para consultar la distribución de capacitación de la empresa.

**Descripción:** Mantener catálogos organizativos y asignaciones de trabajadores. Dividir catálogos, asignación y cambios históricos.

**Prioridad y tamaño:** Should, 8 SP propuestos. Combina dos catálogos y pertenencia temporal; dividir antes del Sprint.

**Dependencias:** HU-01, HU-02.

**RNF relevantes:** RNF-01,03,04,08.

**Conversación pendiente:** ¿Cuáles son las sedes y áreas reales? ¿Una persona puede pertenecer a varias? ¿Se conserva historial de traslados?

**Confirmación:** criterios CA-22-1 a CA-22-3; casos CP-22-V,
CP-22-I y CP-22-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4; dividir. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-23 — Consultar trabajadores pendientes de capacitación

**Tarjeta:** Como responsable de RR. HH., quiero identificar trabajadores pendientes de una capacitación requerida para planificar acciones para cerrar brechas.

**Descripción:** Comparar población elegible con capacitación requerida y período; definir qué cuenta como cumplimiento antes de implementar.

**Prioridad y tamaño:** Should, 8 SP propuestos. Alta incertidumbre en población, equivalencias y período; requiere refinamiento.

**Dependencias:** HU-13, HU-22 y regla de obligatoriedad validada.

**RNF relevantes:** RNF-01,03,04,09.

**Conversación pendiente:** ¿Qué capacitación es obligatoria para quién? ¿Basta inscripción, asistencia o aprobación? ¿Cuándo vence?

**Confirmación:** criterios CA-23-1 a CA-23-3; casos CP-23-V,
CP-23-I y CP-23-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4; refinar. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-24 — Consultar capacitaciones por marca proveedora

**Tarjeta:** Como coordinador, quiero filtrar capacitaciones por marca proveedora para conocer las actividades relacionadas con cada proveedor.

**Descripción:** Añadir filtro por identificador de marca al listado autorizado y distinguir capacitaciones sin marca.

**Prioridad y tamaño:** Could, 3 SP propuestos. Filtro pequeño reutilizando paginación y alcance de consulta.

**Dependencias:** HU-20, HU-03.

**RNF relevantes:** RNF-01,04,05,09.

**Conversación pendiente:** ¿Se requiere filtro múltiple o histórico por nombre anterior de la marca?

**Confirmación:** criterios CA-24-1 a CA-24-3; casos CP-24-V,
CP-24-I y CP-24-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-25 — Consultar capacitaciones por sede

**Tarjeta:** Como responsable de RR. HH., quiero consultar capacitaciones por sede para seguir la cobertura de capacitación local.

**Descripción:** Filtrar por la sede definida para la capacitación; no inferirla ambiguamente de los participantes actuales.

**Prioridad y tamaño:** Should, 3 SP propuestos. Consulta simple una vez resuelta la semántica de sede.

**Dependencias:** HU-22, HU-03 y relación sede/capacitación validada.

**RNF relevantes:** RNF-01,04,05,09.

**Conversación pendiente:** ¿Sede es el lugar de ejecución o la sede de los trabajadores? ¿Qué ocurre con actividades virtuales compartidas?

**Confirmación:** criterios CA-25-1 a CA-25-3; casos CP-25-V,
CP-25-I y CP-25-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-26 — Recibir alertas de capacitaciones programadas

**Tarjeta:** Como participante, quiero recibir alertas de mis capacitaciones programadas para recordar cuándo debo participar.

**Descripción:** Crear recordatorios por un canal aprobado, respetar cambios/cancelaciones, evitar duplicados y registrar estado de entrega.

**Prioridad y tamaño:** Could, 8 SP propuestos. Incluye programación, entrega, idempotencia y privacidad; dividir por canal.

**Dependencias:** HU-06, HU-11, HU-27 y canal validado.

**RNF relevantes:** RNF-01,04,07,10.

**Conversación pendiente:** ¿Qué canal y anticipación se requieren? ¿Se pueden desactivar alertas? ¿Cómo se reintenta una entrega fallida?

**Confirmación:** criterios CA-26-1 a CA-26-3; casos CP-26-V,
CP-26-I y CP-26-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4; dividir. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-27 — Reprogramar capacitaciones pendientes

**Tarjeta:** Como coordinador, quiero reprogramar una capacitación pendiente para ajustar su realización sin perder inscripciones.

**Descripción:** Cambiar fechas en estados permitidos conservando relaciones; registrar motivo y efectos sobre sesiones y avisos según regla aprobada.

**Prioridad y tamaño:** Should, 5 SP propuestos. Operación coordinada con varias relaciones y validación temporal.

**Dependencias:** HU-04, HU-15; HU-28/26 para sus efectos.

**RNF relevantes:** RNF-01,03,08.

**Conversación pendiente:** ¿Qué estados son pendientes? ¿Se trasladan sesiones automáticamente? ¿Se requiere confirmación del instructor?

**Confirmación:** criterios CA-27-1 a CA-27-3; casos CP-27-V,
CP-27-I y CP-27-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V4. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

### HU-28 — Registrar sesiones de capacitación

**Tarjeta:** Como coordinador, quiero registrar las sesiones de una capacitación para organizar el control de asistencia por encuentro.

**Descripción:** Crear sesiones con fecha y título dentro del intervalo de capacitación; evitar duplicados según granularidad acordada.

**Prioridad y tamaño:** Must, 5 SP propuestos. Base del registro de asistencia, validación de intervalo y restricciones de edición.

**Dependencias:** HU-03, HU-04.

**RNF relevantes:** RNF-01,03,05.

**Conversación pendiente:** ¿Puede haber dos sesiones el mismo día? ¿Se necesitan horas y lugares por sesión? ¿Se elimina una sesión con asistencia?

**Confirmación:** criterios CA-28-1 a CA-28-3; casos CP-28-V,
CP-28-I y CP-28-L en [criterios y pruebas](CRITERIOS_ACEPTACION.md).
El caso válido prueba valor, el inválido rechazo y el límite una frontera o
alcance de autorización. No se consideran ejecutados por estar escritos.

**Situación:** Candidato V3. Ver evidencia en [TRAZABILIDAD.md](TRAZABILIDAD.md).

## Refinamiento y próxima iteración

Antes de V2, revisar el incremento V1 con una persona del equipo y validar
HU-05/06/17/19 con Paz Sur. Extraer tareas por capa solo después de fijar el
resultado vertical. Resolver la dependencia circular de planificación entre
HU-06 y HU-19 mediante una entrega conjunta pequeña: invariante de cupo más
inscripción individual. HU-19 no depende de que ya exista una UI de inscripción
para definir la regla, pero su aceptación integral sí requiere intentos reales.

Para HU-14 proponer 14a resumen y filtros / 14b exportación autorizada; HU-22,
22a catálogos / 22b asignaciones / 22c cambios históricos; HU-23, 23a definición
y población / 23b consulta; HU-26, 26a aviso interno / 26b entrega por canal
externo si se autoriza. Son divisiones propuestas, no nuevas claves Jira.

