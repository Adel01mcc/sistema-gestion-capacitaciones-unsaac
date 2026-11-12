# Criterios de aceptación y diseño de pruebas

Fecha: **2026-11-12, America/Lima**. Los criterios son propuestas verificables,
pendientes de validación de negocio salvo autorización técnica para construir
V1. La presencia de un caso en este documento **no significa que se ejecutó**.
La evidencia y su alcance se registran en [TRAZABILIDAD.md](TRAZABILIDAD.md) y en
el registro de pruebas de la entrega.

Los códigos HTTP concretos de rutas implementadas deben coincidir con la
documentación de API. V1 utiliza 422 para validación de campos, 400 para JSON
mal formado, 401 sin sesión, 403 sin permiso o CSRF inválido, 404 recurso no
disponible, 409 conflicto y 201 creación. Las respuestas no deben revelar datos
fuera del alcance autorizado. Mantener coherencia al incorporar nuevas rutas.

## Criterios por historia

Cada CA se verifica mediante el caso correspondiente: `V` válido, `I` inválido,
`L` límite/alcance. Antes de probar se necesita una base aislada con datos
ficticios, credenciales de prueba y roles diferenciados. Los casos académicos
requieren primero los módulos de inscripciones, sesiones y asistencia.

### HU-01 — Registrar usuarios

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-01-1 | Un administrador autenticado puede registrar nombre, apellidos, correo y contraseña de 12 a 128 caracteres; recibe 201, un identificador y puede consultar el usuario persistido sin su contraseña ni hash. |
| CA-01-2 | Correo normalizado o documento informado duplicado se rechazan con 409, sin insertar otro usuario; entradas inválidas devuelven 422 con mensaje comprensible. |
| CA-01-3 | Una petición sin sesión o permiso suficiente no crea usuarios; users.manage sin roles.manage solo permite crear participantes y no editar cuentas con users.manage o roles.manage. Los campos opcionales vacíos se normalizan y no generan documentos duplicados vacíos. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-01-V | Registrar una persona ficticia y consultar su ID en una nueva petición. |
| CP-01-I | Repetir el correo con mayúsculas y verificar 409 y un único registro. |
| CP-01-L | Enviar sin sesión y luego sin nombres/contraseña suficiente; verificar 401/422 y ausencia de altas. Con users.manage sin roles.manage, crear participante e intentar crear/editar una cuenta privilegiada; comprobar autorización limitada. |

### HU-02 — Asignar roles y permisos

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-02-1 | Una cuenta con roles.manage puede asignar roles válidos existentes a un usuario y la siguiente consulta refleja sus permisos efectivos. |
| CA-02-2 | Un usuario sin roles.manage no puede cambiar roles o permisos, tampoco mediante creación/edición de perfiles con users.manage; un código inexistente se rechaza sin cambios parciales. |
| CA-02-3 | La edición del rol administrador protegido se rechaza; los mecanismos de protección no deben permitir dejar el sistema sin administración activa. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-02-V | Asignar coordinador a un usuario y comprobar permisos efectivos. |
| CP-02-I | Otorgar users.manage sin roles.manage a una cuenta de prueba e intentar asumir administrador por asignación, alta o edición; verificar rechazo sin escalamiento ni cambios parciales. |
| CP-02-L | Intentar editar permisos del rol administrador y comprobar rechazo y permisos intactos. |

### HU-03 — Registrar capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-03-1 | Un usuario con trainings.manage registra datos válidos; recibe 201 y encuentra la capacitación por su identificador/código tras consultar otra vez. |
| CA-03-2 | Se rechazan título vacío, capacidad no entera o fuera de 1 a 10 000, fechas inexistentes, intervalo de fechas invertido, hora final no posterior a inicial o código duplicado; no se guarda un registro parcial. |
| CA-03-3 | Capacidad uno e instructor vacío son admisibles si los demás datos son válidos; el responsable se obtiene de la sesión y no de una identidad arbitraria enviada por cliente. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-03-V | Crear una capacitación ficticia y recuperar su detalle. |
| CP-03-I | Intentar crear con fin anterior al inicio y comprobar 400 sin registro. |
| CP-03-L | Crear con capacidad uno e instructor no asignado; comprobar datos y responsable autenticado. |

### HU-04 — Modificar capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-04-1 | Un usuario autorizado puede modificar una capacitación editable y la consulta posterior conserva su ID con los nuevos datos. |
| CA-04-2 | Datos inválidos, referencia a instructor no válido o edición sin permiso se rechazan sin alterar el registro anterior. |
| CA-04-3 | Las capacitaciones finalizadas/canceladas no admiten edición según el supuesto S-05; la reducción de cupo nunca podrá quedar por debajo de inscritos activos al existir HU-06. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-04-V | Cambiar título/lugar de una capacitación planificada y volver a leerla. |
| CP-04-I | Enviar intervalo invertido y verificar que los valores previos persisten. |
| CP-04-L | Intentar modificar una capacitación finalizada/cancelada y comprobar rechazo. |

### HU-05 — Asignar instructor

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-05-1 | Un coordinador puede asignar un instructor activo a una capacitación editable y ambos pueden consultar la asignación en su ámbito. |
| CA-05-2 | Un identificador inexistente o una persona sin rol instructor se rechaza sin cambiar la asignación anterior. |
| CA-05-3 | La sustitución conserva el ID de capacitación e inscripciones; si se bloquean conflictos horarios, la regla deberá validarse y probarse antes de afirmar cumplimiento. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-05-V | Asignar instructor ficticio y consultar su nombre/ID en la capacitación. |
| CP-05-I | Asignar un usuario participante como instructor y comprobar rechazo. |
| CP-05-L | Sustituir instructor y comprobar que la capacitación y las inscripciones siguen siendo las mismas. |

### HU-06 — Registrar participantes

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-06-1 | Un coordinador inscribe una persona existente en una capacitación con cupo y obtiene una única inscripción persistida. |
| CA-06-2 | La inscripción duplicada, una persona inválida o una capacitación que no admite inscripciones se rechaza sin cambios parciales. |
| CA-06-3 | Dos peticiones al último cupo producen como máximo una inscripción nueva; el total activo nunca supera capacidad. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-06-V | Inscribir un trabajador ficticio y consultar la lista de participantes. |
| CP-06-I | Repetir la inscripción y comprobar conflicto y total sin variación. |
| CP-06-L | Enviar dos inscripciones al último cupo y comprobar una aceptación y una denegación. |

### HU-07 — Consultar capacitaciones asignadas

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-07-1 | Un instructor autenticado ve las capacitaciones que tiene asignadas con fechas, estado y detalle permitido. |
| CA-07-2 | El detalle de una capacitación no asignada no revela información, aunque se solicite su ID directamente. |
| CA-07-3 | Un instructor sin asignaciones recibe una lista vacía utilizable; filtros/paginación no amplían su alcance. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-07-V | Consultar con dos instructores y comprobar asignaciones separadas. |
| CP-07-I | Solicitar el ID de la capacitación del otro instructor y comprobar 403/404. |
| CP-07-L | Consultar con instructor sin asignaciones y verificar lista vacía y sin error. |

### HU-08 — Registrar asistencia

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-08-1 | Un instructor autorizado registra los estados de asistencia de inscritos activos para una sesión de su capacitación y los recupera sin duplicados. |
| CA-08-2 | Se rechazan estados desconocidos, sesiones ajenas o inscripciones que no pertenecen a la capacitación; un lote inválido no se guarda parcialmente. |
| CA-08-3 | Corregir una marca actualiza la misma combinación sesión/inscripción; una capacitación cerrada impide cambios según S-05. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-08-V | Registrar presente y ausente para una sesión y consultar los resultados. |
| CP-08-I | Enviar un lote con una inscripción ajena y comprobar que ninguna marca cambió. |
| CP-08-L | Corregir ausente a presente, comprobar una sola marca e intentar corregir tras cierre. |

### HU-09 — Registrar evaluaciones

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-09-1 | El instructor autorizado registra nota y observación en una inscripción propia; la consulta devuelve el resultado guardado. |
| CA-09-2 | Una nota fuera del rango acordado o una inscripción ajena se rechaza sin sustituir el resultado anterior. |
| CA-09-3 | Los extremos de la escala acordada son válidos; una evaluación ausente se representa como pendiente y no como cero. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-09-V | Registrar una nota dentro de escala y consultar resultado. |
| CP-09-I | Registrar una nota superior al máximo y comprobar rechazo. |
| CP-09-L | Registrar los extremos acordados y distinguir un participante sin evaluación. |

### HU-10 — Registrar certificado

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-10-1 | En una capacitación que ofrece certificación, un coordinador emite un certificado único para una inscripción elegible y conserva los datos de emisión. |
| CA-10-2 | Se rechaza emitir sin cumplir las reglas validadas de asistencia, nota y estado; una capacitación sin certificado sigue siendo válida. |
| CA-10-3 | Repetir la emisión no crea otro certificado para la misma inscripción; probar exactamente el umbral de elegibilidad y el valor inferior. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-10-V | Emitir para una inscripción elegible y consultar código/datos históricos. |
| CP-10-I | Intentar emitir para una inscripción no elegible y comprobar rechazo. |
| CP-10-L | Repetir emisión y comparar el número de registros; probar valores en el umbral. |

### HU-11 — Consultar capacitaciones inscritas

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-11-1 | Un participante autenticado consulta sus capacitaciones inscritas con fecha, modalidad y estado de inscripción. |
| CA-11-2 | La consulta y el detalle no revelan inscripciones de otro participante mediante cambios de parámetros o ID. |
| CA-11-3 | Sin inscripciones se muestra un estado vacío; la paginación mantiene únicamente resultados propios. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-11-V | Consultar la inscripción de una cuenta participante. |
| CP-11-I | Solicitar inscripción ajena por ID/parámetro y comprobar denegación. |
| CP-11-L | Consultar con una cuenta sin inscripciones y verificar un estado vacío comprensible. |

### HU-12 — Consultar resultados

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-12-1 | Un participante puede consultar asistencia y evaluación propias cuando estén registradas y disponibles según política acordada. |
| CA-12-2 | Un participante no puede consultar resultados de terceros ni modificar resultados mediante una ruta de consulta. |
| CA-12-3 | La falta de evaluación/asistencia se muestra como pendiente; nota cero y asistencia cero conservan significado distinto de datos ausentes. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-12-V | Consultar resultados previamente registrados en una inscripción propia. |
| CP-12-I | Cambiar el ID para consultar resultados ajenos y comprobar denegación. |
| CP-12-L | Comparar resultado pendiente con nota cero y asistencia registrada en cero. |

### HU-13 — Consultar historial de capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-13-1 | RR. HH. autorizado consulta el historial de una persona con capacitación, período, estado y resultados existentes; el participante consulta solo el suyo. |
| CA-13-2 | Un rol sin permiso o un participante que pide otra persona no obtiene el historial ajeno. |
| CA-13-3 | Filtros de fechas incluyen los límites acordados; una persona sin actividades devuelve historial vacío y no cifras inventadas. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-13-V | Consultar historial de un trabajador ficticio con dos capacitaciones. |
| CP-13-I | Pedir historial ajeno desde participante y comprobar rechazo. |
| CP-13-L | Filtrar por fecha exacta de inicio/fin y consultar una persona sin actividades. |

### HU-14 — Consultar reportes consolidados

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-14-1 | Un usuario con reports.view obtiene agregados y filtros que concuerdan con los registros de prueba y una definición de métricas documentada. |
| CA-14-2 | Un usuario sin permiso no obtiene reporte ni exportación; parámetros inválidos se rechazan con mensaje claro. |
| CA-14-3 | Un conjunto vacío no produce división por cero; denominadores, redondeo y tratamiento de cancelaciones coinciden en pantalla y exportación. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-14-V | Construir un conjunto pequeño conocido y comparar cada total con cálculo manual. |
| CP-14-I | Solicitar reporte/exportación sin permiso y comprobar 403. |
| CP-14-L | Consultar un período vacío y comprobar ceros o no disponible conforme a la definición. |

### HU-15 — Consultar estado de las capacitaciones

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-15-1 | La consulta autorizada muestra un estado reconocido y permite filtrar capacitaciones por ese estado. |
| CA-15-2 | Un filtro de estado desconocido se rechaza; no se interpreta silenciosamente como acceso a todos los registros. |
| CA-15-3 | Después de una transición válida se muestra el estado persistido; la consulta no cambia estado por el mero paso del tiempo salvo política explícita. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-15-V | Filtrar programadas y comprobar que cada fila tiene ese estado. |
| CP-15-I | Enviar un estado desconocido y verificar error claro. |
| CP-15-L | Cambiar por una transición válida y consultar otra vez sin alteraciones implícitas. |

### HU-16 — Iniciar sesión

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-16-1 | Credenciales válidas de cuenta activa crean una sesión; /auth/me devuelve identidad y token CSRF, y el cierre invalida la sesión. |
| CA-16-2 | Credenciales incorrectas o cuenta inactiva se rechazan sin revelar si el correo existe; las rutas protegidas sin sesión devuelven 401. |
| CA-16-3 | Una mutación autenticada sin token CSRF válido se rechaza; una sesión caducada o cerrada no permite seguir accediendo. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-16-V | Iniciar sesión con cuenta ficticia, consultar identidad y cerrar sesión. |
| CP-16-I | Usar contraseña incorrecta y repetir con cuenta inactiva; comprobar error genérico. |
| CP-16-L | Guardar cookie, cerrar sesión e intentar reutilizarla; probar mutación sin CSRF. |

### HU-17 — Gestionar instructores

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-17-1 | Un coordinador autorizado crea/actualiza un perfil de instructor con especialidad y estado, disponible para asignación si está activo. |
| CA-17-2 | Datos inválidos o intentos de otorgar roles administrativos desde la gestión de instructores se rechazan. |
| CA-17-3 | Desactivar un instructor no borra su participación histórica; la política de nuevas asignaciones a inactivos es coherente. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-17-V | Registrar instructor ficticio y actualizar su especialidad. |
| CP-17-I | Intentar asignarle administrador mediante este flujo y comprobar rechazo. |
| CP-17-L | Desactivar un instructor con historia y comprobar que la historia permanece y no admite nueva asignación. |

### HU-18 — Descargar certificado

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-18-1 | El titular o usuario autorizado descarga un PDF legible correspondiente a un certificado emitido y vigente. |
| CA-18-2 | Un certificado ajeno, inexistente o anulado no se entrega a un participante sin autorización. |
| CA-18-3 | Descargar varias veces no crea nuevas emisiones; caracteres españoles y nombres largos no corrompen el documento. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-18-V | Descargar un certificado propio y comprobar MIME/PDF y datos del titular. |
| CP-18-I | Solicitar el certificado de otra persona y comprobar denegación. |
| CP-18-L | Descargar dos veces con nombre largo y tildes, comprobar misma emisión y legibilidad. |

### HU-19 — Gestionar cupos de capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-19-1 | Un coordinador fija capacidad entera positiva y consulta cupos disponibles como capacidad menos inscritos activos. |
| CA-19-2 | Se rechaza reducir capacidad por debajo del número de inscritos activos; la capacidad anterior permanece. |
| CA-19-3 | Con capacidad igual a inscritos hay cero cupos; una cancelación libera uno conforme a política y nunca hay disponibilidad negativa. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-19-V | Cambiar de 10 a 12 con 8 inscritos y comprobar 4 disponibles. |
| CP-19-I | Con 8 inscritos intentar capacidad 7 y comprobar rechazo sin cambios. |
| CP-19-L | Fijar capacidad 8, rechazar nueva inscripción y cancelar una para comprobar liberación. |

### HU-20 — Registrar marcas proveedoras

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-20-1 | Un coordinador crea una marca y la puede asociar a una capacitación; consulta la marca persistida. |
| CA-20-2 | Los datos vacíos o duplicados según normalización acordada se rechazan; identificadores inexistentes no se asocian. |
| CA-20-3 | Una capacitación interna puede no tener marca; desactivar una marca no borra asociaciones históricas. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-20-V | Registrar marca ficticia y asociarla a una capacitación. |
| CP-20-I | Crear duplicado normalizado y comprobar un único registro. |
| CP-20-L | Crear capacitación sin marca y desactivar una marca ya asociada conservando el historial. |

### HU-21 — Gestionar campañas comerciales

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-21-1 | Un coordinador crea una campaña con nombre y período válido y la asocia a una capacitación. |
| CA-21-2 | Fechas inválidas o relaciones inexistentes se rechazan sin cambios parciales. |
| CA-21-3 | Una capacitación sin campaña sigue siendo válida; se prueba un período de un día y la política validada de superposición. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-21-V | Crear campaña ficticia y asociar capacitación. |
| CP-21-I | Crear campaña con fin anterior al inicio y comprobar rechazo. |
| CP-21-L | Registrar campaña de un día y capacitación sin campaña; verificar reglas acordadas. |

### HU-22 — Gestionar trabajadores por sede y área

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-22-1 | RR. HH. autorizado crea/selecciona sede y área y asigna un trabajador conforme a la pertenencia validada. |
| CA-22-2 | Sede/área inexistente o una operación fuera del alcance del usuario se rechaza sin asignación parcial. |
| CA-22-3 | Un traslado no reescribe la historia si se acuerda conservarla; las sedes/áreas usadas no se eliminan rompiendo referencias. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-22-V | Asignar trabajador ficticio a una sede y un área y consultar su ficha. |
| CP-22-I | Enviar un área inexistente y comprobar rechazo e integridad. |
| CP-22-L | Trasladar un trabajador y comprobar la regla histórica acordada y referencias antiguas. |

### HU-23 — Consultar trabajadores pendientes de capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-23-1 | Una consulta autorizada devuelve exactamente las personas elegibles que no cumplen el requisito de capacitación definido para el período. |
| CA-23-2 | No se calcula «pendiente» sin una definición aprobada de población y cumplimiento; los usuarios sin permiso no reciben datos personales. |
| CA-23-3 | Una persona justo en el límite de vigencia/período se clasifica según regla explícita; las excepciones se identifican de forma verificable. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-23-V | Usar tres personas con cumplimiento, pendiente y exención y comparar resultado esperado. |
| CP-23-I | Consultar sin permiso y comprobar denegación; rechazar regla/período inválidos. |
| CP-23-L | Probar fecha exacta de vencimiento y equivalencia de capacitación según política aprobada. |

### HU-24 — Consultar capacitaciones por marca proveedora

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-24-1 | Un usuario autorizado filtra por una marca existente y obtiene solo capacitaciones relacionadas dentro de su alcance. |
| CA-24-2 | Una marca inexistente o identificador inválido tiene respuesta definida y no devuelve todas las capacitaciones sin advertencia. |
| CA-24-3 | Una marca sin capacitaciones devuelve cero resultados; el filtro sin marca conserva las actividades internas autorizadas. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-24-V | Consultar por marca con dos actividades y comparar los IDs. |
| CP-24-I | Consultar ID inválido y comprobar respuesta documentada sin ampliación de alcance. |
| CP-24-L | Consultar marca sin actividades y luego el filtro de capacitaciones sin marca. |

### HU-25 — Consultar capacitaciones por sede

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-25-1 | Un usuario autorizado filtra capacitaciones por la sede definida por la regla de negocio validada. |
| CA-25-2 | Una sede inexistente o fuera del alcance del usuario no permite obtener datos de otra sede. |
| CA-25-3 | Una capacitación virtual o multisede se trata según regla documentada; no se deduce sede de la pertenencia actual de un trabajador trasladado. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-25-V | Consultar por sede con conjunto conocido y comparar IDs. |
| CP-25-I | Solicitar una sede no autorizada y comprobar denegación. |
| CP-25-L | Probar actividad virtual/multisede y traslado posterior de un trabajador. |

### HU-26 — Recibir alertas de capacitaciones programadas

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-26-1 | El participante recibe por el canal aprobado un aviso que corresponde a su capacitación programada y la anticipación acordada. |
| CA-26-2 | No se envían avisos a personas ajenas ni sobre actividades canceladas; un error de entrega no se registra como éxito. |
| CA-26-3 | Reintentos no producen avisos duplicados; una reprogramación invalida o actualiza el recordatorio anterior. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-26-V | Programar un aviso ficticio en entorno aislado y comprobar destinatario/fecha y estado real. |
| CP-26-I | Cancelar antes de la entrega y comprobar que no se entrega. |
| CP-26-L | Simular reintento y reprogramación; comprobar idempotencia y fecha vigente. |

### HU-27 — Reprogramar capacitaciones pendientes

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-27-1 | Un coordinador cambia fechas de una capacitación en estado permitido, conserva su ID e inscripciones y registra el motivo acordado. |
| CA-27-2 | Se rechaza intervalo inválido, estado no reprogramable o conflicto definido sin actualizar parcialmente sesiones/avisos. |
| CA-27-3 | Las sesiones fuera del nuevo intervalo se resuelven explícitamente según política; no desaparecen asistencias existentes sin validación. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-27-V | Reprogramar una capacitación pendiente y consultar nuevas fechas y mismas inscripciones. |
| CP-27-I | Intentar reprogramar una finalizada y verificar datos intactos. |
| CP-27-L | Acortar el intervalo con sesiones fuera de rango y comprobar la respuesta acordada. |

### HU-28 — Registrar sesiones de capacitación

| ID | Criterio de aceptación específico |
| --- | --- |
| CA-28-1 | Un coordinador crea una sesión con fecha y título dentro del intervalo de una capacitación editable. |
| CA-28-2 | Se rechazan fechas fuera del intervalo, capacitación inexistente o datos inválidos sin crear sesión. |
| CA-28-3 | Las fechas exactas de inicio/fin son admisibles; el duplicado se trata según granularidad acordada y una sesión con asistencia no se elimina silenciosamente. |

| Caso diseñado | Acción y comprobación esperada |
| --- | --- |
| CP-28-V | Crear sesión en una capacitación y consultar su detalle. |
| CP-28-I | Crear sesión fuera del intervalo y comprobar rechazo. |
| CP-28-L | Crear sesiones en fechas límite y repetir la combinación considerada única. |

## Alcance de la confirmación

La aceptación del usuario de negocio, la revisión por otro integrante y la
integración no se deducen de pruebas automáticas aprobadas. Un test parcial
sobre un criterio no prueba todas sus cláusulas. Si una regla cambia después
de conversación, actualizar la tarjeta, los criterios, la API, las pruebas y
la trazabilidad en el mismo cambio; conservar las estimaciones originales de
Jira y registrar una propuesta nueva por separado.

La Definition of Done general incluye seguridad, pruebas, documentación,
revisión e integración. Estos criterios describen el comportamiento concreto
de cada historia, por ejemplo impedir un segundo registro con el mismo correo.

