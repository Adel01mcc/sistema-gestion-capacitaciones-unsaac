# Arquitectura del Sistema de Gestión de Capacitaciones

Fecha de referencia: **2026-11-12, America/Lima**. Este documento distingue el incremento V1 de los módulos candidatos. No representa una aprobación del cliente ni una revisión humana ya realizada.

## 1. Punto de partida y alcance

La base Git inspeccionada, `cf6e720`, contenía README y documentación, no `src/`, `server/`, dependencias o pruebas ejecutables. Los TXT de coordinación describían otra carpeta y se conservan como antecedentes. El contrato `IMPLEMENTATION_CONTRACT.md` sí existe y se utiliza como guía de interfaz; su presencia no prueba que todas sus rutas estén implementadas.

V1 aborda HU-01, HU-02, HU-03, HU-04 y la dependencia HU-16: autenticación, usuarios, roles y gestión inicial de capacitaciones. El diseño también contempla HU-05 a HU-28; sus tablas, rutas y pantallas pendientes se identifican expresamente. Las fases V2, V3 y V4 son objetivos de evolución, no versiones publicadas.

## 2. Decisión de estructura

Se usa un **monolito modular con tres capas**, suficiente para cuatro estudiantes y un proceso administrativo. Evita despliegues y comunicaciones distribuidas que no aportan valor al primer flujo.

| Capa | Archivos del incremento | Responsabilidad | No debe hacer |
|---|---|---|---|
| Presentación web | `src/`, `index.html` | Formularios, navegación, estados de carga, mensajes y validación para ayudar al usuario | Decidir permisos definitivos ni escribir SQL |
| Entrada HTTP | `server/app.js`, `server/routes/` | Autenticar, verificar permisos, validar solicitudes, invocar casos de uso y devolver códigos HTTP | Confiar en que el navegador ya validó |
| Negocio | `server/services/user-service.js`, `server/services/training-service.js` | Integridad de usuarios, roles y transiciones de capacitación; coordinar transacciones | Depender de componentes React |
| Persistencia | `server/db.js`, `server/migrations/001_initial.sql` | Conexión SQLite, migraciones, transacciones y restricciones SQL | Contener decisiones de interfaz |
| Transversal | `server/security.js`, `server/errors.js`, `server/constants.js` | Sesiones, CSRF, autorización, hashing, errores y catálogos compartidos | Convertirse en un módulo que concentre todos los casos de uso |

Los servicios realizan consultas SQL parametrizadas sobre una conexión recibida por inyección. No se introduce una clase de repositorio por cada tabla sin una necesidad observada. La separación entre rutas y servicios permite probar reglas sin arrancar el servidor de producción. Para PostgreSQL será necesario adaptar SQL, transacciones y acceso asíncrono: esta estructura facilita el cambio, pero no lo vuelve automático.

**Ejemplo:** React envía `POST /api/trainings`; la ruta verifica la sesión y `trainings.manage`; el servicio comprueba fechas, cupo, instructor y estado; una transacción inserta capacitación y auditoría; la ruta responde `201`. Solo después la interfaz muestra confirmación.

## 3. Tecnologías y ejecución

| Elemento | Elección V1 | Motivo y límite |
|---|---|---|
| Interfaz | React + TypeScript + Vite | Componentes y tipos de contratos; Vite sirve el desarrollo y compila recursos |
| API | Node.js 24 + Express 5, JavaScript ESM | Sigue el contrato existente y evita un compilador adicional en la API; el frontend sí usa TypeScript |
| Persistencia | SQLite, `node:sqlite` | Archivo local duradero, sin servicio externo; apropiado para demostración y pruebas aisladas |
| Validación | Zod | Un contrato de entradas comprobado también en el servidor |
| Pruebas | Node Test Runner + Supertest; Playwright + Chrome | API con base aislada y flujos de navegador automatizados; su ejecución se registra por separado |
| Seguridad | `node:crypto`, cookies de sesión y CSRF | Hash de contraseñas con sal y tokens opacos; no se entrega un secreto JWT al navegador |

Las versiones resueltas y reproducibles se consultan en `package-lock.json`; no se atribuyen a la base inicial. Node 24.16.0 fue encontrado en el entorno y `DatabaseSync(':memory:')` devolvió SQLite 3.53.0. No se comprobó un servicio PostgreSQL ni se usaron cuentas Supabase/Render.

Vite requiere una versión compatible de Node; Express 5 requiere Node 18 o posterior. Véanse [Vite](https://vite.dev/guide/) y [Express](https://expressjs.com/en/guide/migrating-5/). La elección concreta del proyecto es Node 24 para disponer de `node:sqlite`.

## 4. Modelo físico V1

La migración SQL constituye la fuente de verdad. El ER fuente es [er_v1.mmd](diagramas/er_v1.mmd).

| Tabla | Clave y relaciones | Integridad principal |
|---|---|---|
| `schema_migrations` | `version` PK | Cada migración se registra una vez con fecha de aplicación |
| `users` | `id` PK | Nombre, apellido, correo, hash y estado requeridos; correo único sin distinguir mayúsculas; documento opcional único |
| `roles` | `id` PK; `code` único | Seis códigos fijos; no se crean roles arbitrarios en V1 |
| `permissions` | `code` PK | Catálogo de capacidades conocido por el servidor |
| `user_roles` | PK compuesta `user_id,role_id`; dos FK | Impide asignaciones duplicadas y roles inexistentes |
| `role_permissions` | PK compuesta `role_id,permission_code`; dos FK | Un permiso no se repite en un rol |
| `sessions_auth` | `token_hash` PK; `user_id` FK | Almacena hash del token, token CSRF y vencimiento; no la cookie de sesión en texto |
| `trainings` | `id` PK; `instructor_id` FK opcional; `responsible_id` FK | Código único sin distinguir mayúsculas; capacidad de 1 a 10 000; fechas y horas ordenadas; estados y modalidades restringidos |
| `audit_log` | `id` PK; `user_id` FK | Actor, acción, entidad y fecha para operaciones sensibles; no guarda contraseñas ni cookies |

Se activan claves foráneas al abrir la base, modo WAL y un tiempo de espera de escritura de cinco segundos. Cada migración SQL pendiente se aplica en transacción y se registra en `schema_migrations`. El catálogo inicial de roles y permisos se carga únicamente dentro de la migración inicial: abrir la base o añadir otra migración no restaura por error los permisos que el administrador haya personalizado.

Las reglas que atraviesan varias filas, como conservar una cuenta administradora activa, se verifican dentro de transacciones de servicio. Los cambios de roles y los cambios de usuarios deben conservar esas invariantes incluso si se llama a la API sin usar la interfaz. La validación de fechas reales y horas se realiza en el servicio; el SQL añade restricciones de orden y rango para reforzar integridad.

Las fechas de capacitaciones se transportan como `YYYY-MM-DD` y las horas como `HH:mm`; se interpretan como horario diario de planificación de Cusco. La hora final debe ser posterior a la inicial incluso en una capacitación de varios días: horarios nocturnos que crucen medianoche requieren otro diseño. Los timestamps técnicos se guardan como ISO UTC y el panel calcula el día actual con `America/Lima`. Esta convención temporal es provisional: múltiples zonas horarias y horarios por sesión requieren validación antes de ampliar el producto.

## 5. Modelo completo candidato

Fuente: [er_producto_candidato.mmd](diagramas/er_producto_candidato.mmd). **Estas tablas y columnas futuras no se presentan como migradas.**

| Concepto candidato | Representación y relación | Regla pendiente de validar |
|---|---|---|
| Trabajador | Perfil `workers`, vinculado opcionalmente a `users`; FK a sede y área | ¿Todos los trabajadores tendrán cuenta? ¿Qué identificador laboral se utiliza? |
| Sede y área | Catálogos `sites`, `areas`; trabajador asignado a ambos | ¿Área global o dependiente de sede? El modelo propone área global hasta acordarlo |
| Instructor | Usuario con rol `instructor` en V1 | ¿Habrá instructores externos sin acceso? No se duplica persona en otra tabla sin aclararlo |
| Marca proveedora | Catálogo `supplier_brands`; FK opcional desde capacitación | ¿Una capacitación puede involucrar más de una marca? Inicialmente se propone una |
| Campaña | `campaigns`, FK opcional desde capacitación | Periodos y relación con marcas requieren confirmación |
| Sesión | `training_sessions`, FK capacitación | Fecha dentro del periodo; unicidad por capacitación y fecha propuesta por contrato |
| Inscripción | `enrollments`, FK capacitación y usuario participante según el contrato | Unicidad de la pareja, inscripción activa, capacidad y cancelación transaccionales; inscripción sin cuenta pendiente de decidir |
| Asistencia | `attendance`, FK inscripción y sesión | Una marca por sesión e inscripción; ambas pertenecen a la misma capacitación |
| Evaluación | `evaluations`, FK inscripción única | Escala 0–20 y umbral 14 son supuestos del contrato, no reglas confirmadas |
| Certificado | `certificates`, FK inscripción única | Es opcional; emisión y descarga autorizadas; no se exige a toda capacitación |
| Notificación | `notifications`, FK destinatario y capacitación | Aviso dentro de la aplicación; no se da por contratado correo/SMS ni se promete entrega externa |

En la alternativa candidata del contrato, un trabajador puede existir sin cuenta, pero para inscribirse necesita una cuenta de participante. Si Paz Sur requiere inscribir trabajadores sin acceso, la FK deberá apuntar al perfil `workers` y se revisarán API, permisos y migración antes de implementar; no se presentan ambas opciones como resueltas simultáneamente.

Una inscripción cancelada no consume cupo. La nota y la asistencia son resultados de una inscripción, no atributos globales del trabajador. El certificado conserva los datos de emisión para que una edición posterior del nombre o título no cambie retroactivamente el documento. Antes de implementar, se debe acordar rectificación y revocación.

El contrato propone certificado con capacitación finalizada, inscripción activa, al menos una sesión, asistencia completa registrada, asistencia mínima de 80 % y nota mínima de 14. Estas reglas solo describen un candidato; V1 no emite certificados ni calcula esos resultados. La coordinación contiene una discrepancia previa de 70 % frente a 80 %: debe resolverla el cliente.

## 6. Roles y permisos

La autorización se verifica en cada ruta. Ocultar una opción en React mejora la experiencia, pero no protege la API.

| Rol fijo | Permisos iniciales del contrato | Alcance esperado |
|---|---|---|
| Administrador | Todos | Usuarios, roles y operación del producto |
| Coordinador | `trainings.manage`, `trainings.view_all`, `people.manage`, `certificates.manage` | Planificación y gestión académica; no asigna privilegios administrativos |
| Instructor | `teaching.manage` | Solo capacitaciones asignadas; asistencia/evaluación en incrementos futuros |
| Participante | `learning.view` | Solo inscripciones y resultados propios cuando exista el módulo |
| RR. HH. | `history.view`, `trainings.view_all`, `reports.view` | Historial y consultas globales según función |
| Gerencia | `reports.view`, `trainings.view_all` | Seguimiento y reportes; sin edición administrativa |

Los permisos de roles no administrativos se pueden modificar mediante la API de roles. El rol `administrador` se protege para evitar bloquear la administración. **Asignar roles exige `roles.manage`**: conceder solo `users.manage` no permite escalar privilegios. Una cuenta con `users.manage` y sin `roles.manage` solo crea cuentas `participante`, no modifica roles y no edita cuentas que tengan `users.manage` o `roles.manage`. Si el rol participante recibió permisos administrativos, también se bloquea esa alta delegada para impedir escalamiento indirecto.

En V1, `people.manage` habilita únicamente consultas filtradas de usuarios `instructor` o `participante` y el selector de instructores. La respuesta reducida contiene identificador, nombre, estado y especialidad, sin correo, documento, roles o permisos. No habilita altas o edición de instructores/participantes ni un listado administrativo general; esas operaciones del contrato completo permanecen pendientes.

Los códigos `reports.view`, `certificates.manage`, `history.view`, `teaching.manage` y `learning.view` forman parte del diseño y del catálogo; **su presencia no prueba que reportes, certificados, historial, asistencia o resultados estén implementados en V1**. Un participante sin inscripciones todavía no recibe capacitaciones ajenas.

## 7. Autenticación y seguridad

1. La solicitud de login valida credenciales y verifica que el usuario esté activo.
2. La contraseña se compara contra un hash `scrypt` con sal individual. El hash nunca forma parte de la respuesta de usuario.
3. Se genera un token aleatorio opaco. La base guarda su hash y el navegador recibe la cookie `sgc_session`, `HttpOnly`, `SameSite=Lax`, ruta `/api` y duración de ocho horas. En HTTPS se debe activar `Secure`.
4. El login y `GET /api/auth/me` devuelven `csrfToken`. Las mutaciones autenticadas deben enviar `X-CSRF-Token`.
5. Cada solicitud carga permisos actuales desde la base y comprueba expiración y estado activo. Cambiar roles no depende de esperar a que expire un token con permisos antiguos.
6. Logout elimina la sesión e invalida la cookie. Cambiar contraseña o desactivar una cuenta elimina sus sesiones. Los errores no exponen SQL, trazas ni hashes.

Se aplican validación de entradas, mensajes Zod en español, límites de cuerpo y un máximo de diez intentos de login por IP cada quince minutos. El contador incluye credenciales correctas y no se reinicia al acertar; al agotar la ventana se devuelve `429` con `Retry-After`. El limitador en memoria pertenece a una instancia, se pierde al reiniciar y no reemplaza un control compartido en un despliegue con varias instancias. No se afirma una auditoría de seguridad profesional ni preparación de producción.

Referencias: [API crypto de Node](https://nodejs.org/docs/latest-v24.x/api/crypto.html) y [prevención de CSRF, OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 8. Estados de capacitación

V1 permite crear una capacitación `planificada` o `programada`. Se propone y codifica un grafo explícito:

| Origen | Destinos permitidos |
|---|---|
| `planificada` | `programada`, `cancelada` |
| `programada` | `planificada`, `en_curso`, `cancelada` |
| `en_curso` | `finalizada`, `cancelada` |
| `finalizada` | Ninguno; registro inmutable |
| `cancelada` | Ninguno; registro inmutable |

Se puede editar una capacitación abierta conservando su estado. No se permite saltar de planificada a finalizada. La reapertura de una finalizada, las correcciones históricas y los motivos de cancelación quedan pendientes de validar. El grafo es un supuesto técnico documentado, no una regla aprobada por Paz Sur. Véase [estados.mmd](diagramas/estados.mmd).

## 9. Cohesión, acoplamiento y patrones

- **Responsabilidad única:** una ruta traduce HTTP; el servicio decide el caso de uso; la utilidad de base administra conexión y transacciones. El objetivo se comprueba leyendo dependencias, no contando clases.
- **Inversión de dependencias práctica:** `createApp({db})` y los servicios reciben una base. Las pruebas pueden usar SQLite en memoria sin cambiar la configuración de producción.
- **Bajo acoplamiento:** React depende del contrato JSON, no de las tablas ni de la librería SQLite. El servicio no importa React ni Express.
- **Strategy, evaluado y no aplicado:** hoy no existen varias políticas aprobadas de evaluación o certificación. Crear estrategias vacías aumentaría complejidad. Se reconsiderará si distintas marcas requieren reglas realmente diferentes.
- **Adapter, evaluado y no aplicado como patrón adicional:** aún no existe proveedor de correo, repositorio externo de certificados ni PostgreSQL. Una interfaz para varios proveedores tiene sentido al integrar uno real; no se fabricará una integración para justificar el patrón.
- **Estados, sin jerarquía artificial:** un mapa de transiciones y una validación central resuelven el grafo V1. El patrón State con clases solo se evaluará si aparece comportamiento considerable por estado.

No se declara una refactorización histórica de un código inexistente. Las extracciones realizadas durante esta primera construcción se explican como decisiones del incremento; una futura V2 comparará referencias Git reales y ejecutará regresión.

## 10. Catálogo de diagramas fuente

| Fuente | Contenido y estado |
|---|---|
| [arquitectura.mmd](diagramas/arquitectura.mmd) | Arquitectura general; V1 y evolución candidata diferenciadas |
| [casos_uso.mmd](diagramas/casos_uso.mmd) | Actores y capacidades; notación de casos de uso aproximada con flowchart |
| [er_v1.mmd](diagramas/er_v1.mmd) | Modelo físico del incremento |
| [er_producto_candidato.mmd](diagramas/er_producto_candidato.mmd) | Entidades y relaciones del alcance completo propuesto |
| [clases.mmd](diagramas/clases.mmd) | Módulos principales como responsabilidades conceptuales; no afirma clases JS inexistentes |
| [componentes.mmd](diagramas/componentes.mmd) | Dependencias entre interfaz, API, servicios y base |
| [secuencia_registrar_capacitacion.mmd](diagramas/secuencia_registrar_capacitacion.mmd) | Flujo de V1 |
| [secuencia_inscribir_participante.mmd](diagramas/secuencia_inscribir_participante.mmd) | Diseño pendiente de implementación |
| [secuencia_registrar_asistencia.mmd](diagramas/secuencia_registrar_asistencia.mmd) | Diseño pendiente de implementación |
| [estados.mmd](diagramas/estados.mmd) | Transiciones V1, sujetas a validación del cliente |
| [roles_permisos.mmd](diagramas/roles_permisos.mmd) | Roles iniciales y capacidades del contrato |

Las fuentes se pueden abrir con una extensión Mermaid o copiar a un renderizador compatible. Su estructura se revisó, pero **no se ha verificado su renderizado con un motor Mermaid**. El informe LaTeX incluye diagramas nativos simplificados y las fuentes Mermaid; no requiere un servicio externo para compilar. No se presentan imágenes de interfaz generadas como evidencia de ejecución.

## 11. Evolución y riesgos

V2 deberá verificar el incremento real, revisión humana y capacidad del equipo antes de incorporar instructores y participantes. V3 podrá añadir sesiones, asistencia, resultados e historial con invariantes transaccionales. V4 integrará lo priorizado de reportes, marcas, campañas, sedes, certificados y alertas. El orden exacto depende de la validación de requisitos y no equivale a prometer las 28 historias en ocho semanas.

SQLite tiene concurrencia de escritura limitada y su archivo exige copia de respaldo consistente. El despliegue en un disco efímero perdería persistencia. PostgreSQL/Supabase requiere una decisión posterior, credenciales externas no versionadas, migración comprobada y pruebas de equivalencia. Ninguna plataforma fue configurada en este incremento.

Quedan por validar: capacidades administrativas reales, tratamiento de datos personales, perfiles sin cuenta, reglas de cupo y reapertura, campañas y sedes, evaluación y certificados. Los nombres, correos y capacitaciones de la semilla son ficticios. La revisión del equipo y del cliente sigue pendiente hasta que se registre expresamente.
