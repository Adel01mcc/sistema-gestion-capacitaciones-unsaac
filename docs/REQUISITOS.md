# Requisitos del Sistema de Gestión de Capacitaciones

Fecha de elaboración: **2026-11-12, America/Lima**. Fuente: solicitud del usuario
y contrato del repositorio. Cliente de referencia: Paz Sur, Cusco. No se ha
realizado una entrevista con el cliente ni una consulta a Jira en esta sesión.

## Alcance y estados de validación

El problema confirmado por el encargo es organizar capacitaciones, trabajadores,
instructores, inscripciones, asistencia, historial y reportes. Las marcas
proveedoras y campañas comerciales forman parte del contexto. Los certificados
son opcionales: una capacitación puede finalizar sin emitirlos.

Las 28 HU son **alcance candidato**. Sus identificadores son referencias del
encargo y no claves verificadas de Jira. El usuario autoriza implementar V1 con
HU-01, HU-02, HU-03, HU-04 y HU-16 como soporte. Esta autorización técnica no
equivale a validación de las reglas por Paz Sur ni a revisión humana del código.
Las pantallas y rutas de historias posteriores se incorporarán por incrementos.

| Estado documental | Significado |
| --- | --- |
| Candidato | Funcionalidad propuesta, pendiente de conversación y priorización. |
| En construcción V1 | Incluida en el trabajo técnico de esta entrega. |
| Verificado técnicamente | Existe evidencia ejecutada para criterios concretos. |
| Hecho | Cumple también revisión humana e integración según la DoD. |

Consulta [BACKLOG.md](BACKLOG.md) para las tarjetas y
[CRITERIOS_ACEPTACION.md](CRITERIOS_ACEPTACION.md) para criterios y casos. La
[trazabilidad](TRAZABILIDAD.md) distingue diseño, implementación y evidencia.

## Actores y límites de acceso

| Actor candidato | Responsabilidad y alcance |
| --- | --- |
| Administrador | Gestionar usuarios, roles y configuración de permisos; acceso administrativo. |
| Coordinador | Organizar capacitaciones y personas del ámbito permitido. |
| Instructor | Consultar las capacitaciones asignadas y registrar información académica autorizada. |
| Participante | Consultar sus inscripciones, resultados, historial y certificados propios. |
| RR. HH. | Consultar historial y reportes dentro del alcance autorizado. |
| Gerencia | Consultar reportes consolidados autorizados. |

Los seis códigos de rol proceden del contrato. V1 utiliza permisos como
`users.manage`, `roles.manage`, `trainings.manage` y `trainings.view_all`.
La API debe comprobar permisos y alcance en cada operación, aunque la interfaz
oculte acciones. No se permitirá autorregistro público con privilegios.
La edición de permisos no debe debilitar el rol administrador protegido.

**Delegación explícita en V1:** `roles.manage` es obligatorio para asignar o
cambiar roles. `users.manage` permite gestionar perfiles, pero por sí solo
únicamente puede crear cuentas con rol participante, no alterar roles ni editar
cuentas que posean `users.manage` o `roles.manage`. Estos controles impiden que
delegar la gestión de personas permita asumir privilegios administrativos.
Las cuentas con ambos permisos conservan el flujo completo; sigue protegido
el último administrador activo y la configuración del rol administrador.

## Requisitos funcionales

| Grupo | HU | Resultado esperado por el producto |
| --- | --- | --- |
| Identidad y acceso | 01, 02, 16 | Identificar usuarios y controlar operaciones por permisos. |
| Planificación | 03, 04, 05, 15, 19, 27, 28 | Crear, programar, modificar y seguir capacitaciones con cupos y sesiones. |
| Personas y participación | 06, 07, 11, 17, 22 | Gestionar personas y consultar asignaciones e inscripciones. |
| Seguimiento académico | 08, 09, 10, 12, 13, 18 | Registrar asistencia, evaluaciones y certificados opcionales. |
| Consulta y análisis | 14, 23, 24, 25 | Obtener reportes y detectar necesidades de capacitación. |
| Contexto comercial | 20, 21 | Relacionar capacitaciones con proveedores y campañas. |
| Comunicación | 26 | Alertar sobre capacitaciones programadas por un canal validado. |

## Requisitos no funcionales verificables

Los objetivos cuantitativos son **propuestos**; no se presentan como mediciones.

| ID | Requisito y criterio de verificación |
| --- | --- |
| RNF-01 Seguridad de acceso | Las rutas protegidas rechazan una sesión ausente con 401 y permisos insuficientes con 403; verificar por pruebas de API y acceso directo a objetos ajenos. |
| RNF-02 Credenciales y sesión | V1 acepta contraseñas de 12 a 128 caracteres y las guarda mediante hashing adaptativo con sal, sin devolver hashes; cookie HttpOnly y CSRF en mutaciones autenticadas. HTTPS y cookie Secure para despliegue. Probar login, logout y rechazo de token ausente. |
| RNF-03 Integridad | Validar en servidor y base; correo normalizado único, referencias válidas, capacidad positiva y fechas coherentes. Una operación fallida no deja cambios parciales. |
| RNF-04 Privacidad | No enviar datos personales ajenos ni secretos en respuestas o registros. Datos de demostración ficticios y base de pruebas aislada. Revisar respuestas con varios roles. |
| RNF-05 Usabilidad y acceso | Interfaz en español, etiquetas asociadas a campos, foco visible, mensajes comprensibles y estados de carga. Comprobar teclado y presentación a 360 px y escritorio. La revisión visual debe registrarse cuando se ejecute. |
| RNF-06 Mantenibilidad | Separar presentación, rutas, negocio y persistencia; no duplicar reglas críticas en componentes. Typecheck del frontend y pruebas pertinentes sin errores. |
| RNF-07 Reproducibilidad | Un clon con Node compatible, variables documentadas, migración y semilla puede iniciar la app con comandos del README. Mantener lockfile y `.env.example` sin secretos. |
| RNF-08 Trazabilidad | Relacionar cada HU con criterios, archivos y evidencia real. Documentar cambios importantes en Markdown y LaTeX; no inventar resultados. |
| RNF-09 Rendimiento básico | Objetivo inicial: listar una página de 20 registros con filtros en menos de 1 s en una máquina de referencia y conjunto de 1 000 registros ficticios. Falta acordar máquina y ejecutar medición; paginar y limitar tamaños desde V1. |
| RNF-10 Operación y recuperación | Persistir datos entre reinicios. Documentar copia y restauración de SQLite con servidor detenido; probar restauración antes de uso real. Migraciones versionadas, no destructivas por defecto. |

## Reglas y supuestos pendientes de validación

| ID | Regla o incertidumbre | Tratamiento |
| --- | --- | --- |
| S-01 | Los seis roles y permisos del contrato representan la organización real. | Supuesto técnico para V1; validar con cliente. |
| S-02 | Correo único; documento opcional, único cuando está informado. | Aplicar en V1 y probar duplicados; confirmar tipo de documento y obligatoriedad. |
| S-03 | Una capacitación tiene código único, título, intervalo de fechas/horas, modalidad, lugar y capacidad entera de 1 a 10 000. | Límite técnico V1, no regla confirmada de Paz Sur. Fecha final no anterior a inicial y hora final posterior a inicial; confirmar el modelo de horarios y si virtual requiere enlace. |
| S-04 | Estados: planificada, programada, en curso, finalizada y cancelada. | Usar códigos del contrato; transiciones propuestas en arquitectura. Confirmar reapertura y cancelación. |
| S-05 | No se modifica información académica de capacitaciones finalizadas/canceladas. | Restricción propuesta; definir procedimiento de corrección con auditoría. |
| S-06 | Un instructor por capacitación y varias sesiones. | Modelo inicial; confirmar si habrá instructores múltiples o sesiones el mismo día. |
| S-07 | Una inscripción activa por trabajador y capacitación, sin sobrepasar cupo. | Requiere transacciones y prueba de concurrencia al implementar HU-06/19. |
| S-08 | Presente/tardanza cuentan para asistencia; umbral 80 %, nota aprobatoria 14/20. | Valores del contrato, no confirmados por Paz Sur. No aplicarlos como política real sin validar. |
| S-09 | Certificación opcional con asistencia y nota suficientes. | No bloquear capacitación, historial o asistencia por ausencia de certificado. |
| S-10 | Sede y área describen al trabajador; la capacitación puede requerir sede propia. | Definir pertenencia histórica y cambios de sede antes de HU-22/25. |
| S-11 | «Pendiente de capacitación» tiene una definición inequívoca. | Falta definir población, período, obligatoriedad y equivalencias; HU-23 no se implementa sin conversación. |
| S-12 | Alertas por aplicación, correo u otro canal. | Canal, consentimiento, anticipación y reintentos pendientes; sin envío externo en V1. |
| S-13 | SQLite permite la demostración local de V1. | Mantener contrato existente; evaluar PostgreSQL/Supabase para colaboración y despliegue, con migración explícita. |

## Dependencias, solapamientos y división de historias

- HU-01 crea identidad; HU-06 registra la participación en una capacitación y
  HU-17 administra el perfil de instructor. No crear tres personas duplicadas.
- HU-07 corresponde al instructor; HU-11 al participante. Comparten consulta,
  pero tienen alcance y aceptación diferentes.
- HU-04 edita datos generales; HU-19 protege cupos y HU-27 añade la
  reprogramación explícita y sus efectos. No declarar estas últimas terminadas
  por la mera presencia de un campo editable.
- HU-10 registra/emite un certificado; HU-18 autoriza su descarga. La segunda
  depende de la primera y debe probar que no descarga documentos de terceros.
- HU-14, HU-22, HU-23 y HU-26 son grandes o inciertas. Dividir sus entregas
  antes de comprometer un Sprint; conservar el identificador padre.
- HU-24/25 son filtros de consulta sobre las relaciones definidas por HU-20/22;
  no deben reproducir el motor de listado de capacitaciones.

## Aplicación de 3 C e INVEST

Cada tarjeta en el backlog contiene la **Tarjeta**, preguntas de
**Conversación** y vínculo a la **Confirmación** verificable. Las conversaciones
son preguntas pendientes, no actas de entrevistas realizadas.

INVEST se aplica reduciendo cada historia a un resultado de usuario y
explicitando dependencias: independencia significa reducir acoplamiento, no
negar que login o un catálogo sean prerrequisitos. Se negocian las reglas,
se conserva el beneficio, se proponen puntos sin sustituir Jira, se dividen las
historias grandes y se escriben criterios comprobables. La DoD común está en
[PROCESO_DESARROLLO.md](PROCESO_DESARROLLO.md); no sustituye los criterios
específicos de cada HU.
