# API REST V1 — contrato ejecutable

Base local: `http://127.0.0.1:3001/api`. Desarrollo web: proxy desde `127.0.0.1:5173/api`. Se conserva el idioma de campos y rutas de `IMPLEMENTATION_CONTRACT.md`; ese documento cubre también módulos futuros. Esta página describe **únicamente lo disponible**.

## Formato y seguridad

Enviar `Content-Type: application/json` en POST/PUT/PATCH/DELETE, incluido logout con `{}`. Objetos: `{ "data": ... }`. Listas paginadas: `{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }`. Errores: `{ "error": { "message": "...", "fields": { "campo": "detalle opcional" } } }`.

La cookie `sgc_session` es HttpOnly, SameSite=Lax, Path=/api y dura ocho horas. Sólo su hash se guarda en la base. En producción es Secure y requiere HTTPS. Después de login o `GET /auth/me`, conservar `data.csrfToken` en memoria y enviar `X-CSRF-Token` en cada mutación autenticada. No guardar claves ni tokens en código o localStorage. Cambiar contraseña o desactivar cuenta revoca sus sesiones; permisos se recargan en cada petición.

Login limita diez intentos por IP en una ventana de quince minutos, incluidos correctos. Se devuelve 429 y Retry-After al excederla. El límite está en memoria de un proceso: un despliegue distribuido requiere otro almacenamiento. No se configura trust proxy de forma implícita.

| HTTP | Ruta | Autorización | Resultado |
|---|---|---|---|
| GET | `/health` | Pública | 200, conexión SQLite comprobada |
| POST | `/auth/login` | Pública; JSON | 200, usuario + CSRF + cookie |
| GET | `/auth/me` | Sesión activa | 200, usuario + CSRF |
| POST | `/auth/logout` | Sesión + CSRF | 200, cierra sesión y cookie |
| GET | `/config` | Sesión | Estados/modalidades y umbrales candidatos |
| GET | `/dashboard` | Sesión | Resumen filtrado por alcance y cinco próximas actividades |
| GET | `/users` | users.manage | Listado, filtros y paginación |
| GET | `/users?role=instructor` | people.manage o users.manage | Selector; people.manage recibe únicamente ID, nombres, activo y especialidad |
| GET | `/instructors` | people.manage o users.manage | Alias GET del selector; no módulo CRUD completo |
| GET | `/users/:id` | users.manage | Perfil sin hash |
| POST | `/users` | users.manage + CSRF | 201, crea perfil y roles |
| PUT | `/users/:id` | users.manage + CSRF | 200, edita perfil; contraseña opcional |
| PUT | `/users/:id/roles` | roles.manage + CSRF | 200, asigna roles |
| GET | `/roles`, `/permissions` | users.manage o roles.manage | Catálogos |
| PUT | `/roles/:id` | roles.manage + CSRF | 200, edita nombre y permisos salvo administrador |
| GET | `/trainings` | Sesión; alcance en servidor | Listado/filtros/paginación |
| GET | `/trainings/:id` | Sesión; alcance en servidor | Detalle; 404 si no corresponde a su cuenta |
| POST | `/trainings` | trainings.manage + CSRF | 201, registra capacitación |
| PUT | `/trainings/:id` | trainings.manage + CSRF | 200, actualiza capacitación |

Asignar roles requiere `roles.manage`. Una cuenta con `users.manage` delegado pero sin `roles.manage` sólo puede crear participantes sin permisos administrativos y no puede editar cuentas con permisos `users.manage` o `roles.manage`. Si el rol participante recibió alguno de esos permisos, también se rechaza el alta delegada. La cuenta administrativa inicial tiene ambos permisos. El catálogo tiene seis roles fijos; no hay POST/DELETE de roles. Se protege el último administrador activo y los permisos del rol administrador.

Alcance: trainings.manage/trainings.view_all ven todo; teaching.manage ve sólo el instructor asignado. Participantes no tienen inscripciones en V1 y obtienen lista vacía. Permisos de reportes/certificados son capacidades de diseño sin endpoints en esta entrega; no habilitan botones simulados.

## Ejemplos sin secretos

Inicio de sesión: usar las credenciales ficticias definidas localmente, no una contraseña de este documento:

```http
POST /api/auth/login
Content-Type: application/json

{"email":"admin@demo.test","password":"<contraseña local definida en .env>"}
```

La respuesta es `{data:{user:{id,first_name,last_name,email,document,active,department,specialty,roles,permissions,...},csrfToken:"<token de esta sesión>"}}`. Nunca incluye `password_hash`. En los siguientes ejemplos los valores entre `<...>` deben sustituirse por los obtenidos en la propia sesión.

```http
POST /api/users
Content-Type: application/json
Cookie: sgc_session=<cookie recibida>
X-CSRF-Token: <csrfToken recibido>

{"first_name":"Persona","last_name":"Ficticia","email":"persona@demo.test","document":null,"active":true,"department":"Área ficticia","specialty":"","password":"<contraseña ficticia de 12 a 128 caracteres>","roles":["participante"]}
```

Devuelve 201 con el usuario persistido. El correo se normaliza a minúsculas; correo y documento opcional son únicos. Nombres/apellidos 1–80 caracteres; área/especialidad hasta120; documento hasta20 sin asumir DNI. Roles al menos uno, sin repetidos. `PUT /users/:id` recibe el perfil completo; omitir password para conservarla y omitir roles si sólo se edita perfil. No se eliminan identidades: active=false conserva referencias.

```http
POST /api/trainings
Content-Type: application/json
Cookie: sgc_session=<cookie recibida>
X-CSRF-Token: <csrfToken recibido>

{"code":"FICT-001","title":"Actividad ficticia","description":"Ejemplo académico","start_date":"2027-01-20","end_date":"2027-01-20","start_time":"09:00","end_time":"11:00","modality":"presencial","location":"Sala ficticia","capacity":20,"status":"planificada","instructor_id":null}
```

Devuelve 201 con ID, campos guardados, responsable tomado de la sesión, marcas temporales, instructor_name, enrolled_count=0 y available_seats=capacity. `sessions` y `enrollments` vacíos son campos reservados, no evidencia de módulos implementados. El PUT usa la misma forma y mantiene al responsable original. El cliente no puede suplantar el responsable enviando otro ID.

Código único sin distinguir mayúsculas (1–30), título3–160, descripción hasta4000, lugar1–240, capacidad entera1–10000. Fecha final igual/posterior a inicial; fechas reales YYYY-MM-DD. Horario diario HH:mm con fin posterior a inicio, incluso para actividades de varios días. Instructor opcional, activo y con rol instructor. Estos límites son supuestos por validar.

Alta sólo planificada/programada. Transiciones: planificada→programada/cancelada; programada→planificada/en_curso/cancelada; en_curso→finalizada/cancelada. Finalizada/cancelada no admiten ediciones. El estado no se calcula automáticamente por reloj.

## Filtros y errores

Usuarios: `search`, `role`, `page`, `pageSize`. Capacitaciones: `search`, `status`, `from`, `to`, `page`, `pageSize`; fechas filtran la fecha de inicio inclusivamente. Filtros vacíos se omiten. Búsqueda literal (se escapan comodines LIKE); consultas SQL parametrizadas. Paginación: page1–100000, pageSize1–100, predeterminados1/20.

| Código | Significado |
|---|---|
| 400 | JSON malformado |
| 401 | Falta sesión/expiró o credenciales inválidas |
| 403 | Falta permiso o CSRF inválido |
| 404 | Registro/ruta ausente o detalle fuera del alcance |
| 409 | Duplicado, transición inválida, cierre o administrador protegido |
| 413 | JSON supera64KiB |
| 415 | Mutación sin application/json |
| 422 | Forma/campos/rango inválidos |
| 429 | Exceso de intentos de login |
| 500 | Error interno con mensaje genérico; detalle sólo servidor |

No se implementan todavía /enrollments, /sessions, /history, /reports ni /certificates. Consultar su diseño en los diagramas y backlog sin confundirlos con rutas disponibles.
