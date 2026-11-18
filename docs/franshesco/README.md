# Refactorización de Franshesco

Fecha de ejecución: 18/11/2026, America/Lima. Implementación asistida por Codex.
Rama: `dev/franshesco`. Entrega identificada por el mensaje de commit
**Punto final fran 1**, con publicación autorizada por el usuario. Verificación
técnica local aprobada; revisión humana, Pull Request y validación del cliente pendientes.
Véase [ENTREGA.md](ENTREGA.md) para alcance, comprobaciones y referencias.

## Punto de partida y conservación

**Punto Inicio Fran** es la etiqueta anotada local `punto-inicio-fran`, que apunta
al commit `98f8d5a`. Git no acepta espacios en el identificador de una etiqueta;
su mensaje conserva exactamente el nombre solicitado. Esta referencia se conserva
junto con la rama de entrega; no se fusiona automáticamente con main.
Esta referencia ya incorpora los aportes de Brenda y Adel que estaban en la rama.
No se integró automáticamente la rama pendiente de Daniela.

La modificación local inicial de `.env.example` sólo añadía una contraseña.
Se restauró ese campo vacío conforme al contrato de configuración; `.env` y la
base de trabajo no se leyeron ni modificaron durante esta refactorización.
La etiqueta conserva código versionado, no secretos ni una copia de la base.
La copia aislada del código inicial está en `.verification/franshesco/inicio/`.

```bash
git show --no-patch punto-inicio-fran
git diff punto-inicio-fran -- server src tests docs
git status --short
```

El diff sólo incluye archivos rastreados: revisar también los archivos nuevos de
`git status`. No cambiar de versión sobre este árbol con cambios pendientes.
Los siete archivos anteriores de `antes/server/` proceden de `git show`, sin
reconstrucción manual. El script de verificación comprueba esa procedencia.

## Análisis inicial

| Hallazgo real en la referencia | Consecuencia y propuesta |
|---|---|
| `user-service.js` contiene Zod, reglas, SQL, hashing y transacciones | Separar validación, políticas, servicios y repositorios |
| `routes/auth.js` valida, consulta credenciales, limita intentos y crea sesiones | Dejar HTTP/cookies en la ruta y extraer el caso de uso de autenticación |
| La comprobación de permisos precede al `await` de scrypt | Volver a comprobar actor/objetivo dentro de la transacción, después de la espera |
| `updateRole` confía en la autorización de la ruta | Comprobar también autorización dentro del servicio |
| Listar usuarios consulta IDs y después hidrata cada persona | Consultar perfiles, roles y permisos por lote |
| El manejador deduce duplicados buscando texto en cualquier error | Traducir códigos SQLite y reservar los detalles de campos a errores controlados |
| No hay eventos ni avisos | Añadir Observer con un consumidor útil: bandeja interna |

La aplicación inicial ya tenía sesiones HttpOnly, CSRF, hashes scrypt, SQL
parametrizado, roles, último administrador protegido y transacciones con auditoría.
Se conservaron; no se presentan como invenciones de esta entrega. Antes: 75
pruebas backend, TypeScript/build y cuatro escenarios de navegador correctos.

## Arquitectura y cambios

Se conserva el monolito modular React/Express/SQLite. No se agregan dependencias.

| Responsabilidad | Ubicación actual |
|---|---|
| Contratos de entrada | `server/validation/{user,auth,notification}-validation.js` |
| Reglas de autorización de usuarios | `server/authorization/user-policy.js` |
| Casos de uso | `server/services/user-management.js`, `role-service.js`, `auth-service.js` |
| Consultas y escrituras | `server/repositories/{user,role,auth,audit,event,notification}-repository.js` |
| Criptografía y límite de intentos | `server/auth/credentials.js`, `login-limiter.js` |
| Restauración de sesión | `server/auth/session-middleware.js` |
| Conexión de implementaciones | `server/composition.js` |
| Observer y entrega durable | `server/events/observer.js`, `server/services/training-events.js` |
| Consumidor de avisos y composición | `server/notifications/` |
| Consulta y marcado propios | `server/services/notification-service.js`, `server/routes/notifications.js` |
| Bandeja mínima de demostración | `src/Notifications.tsx` |

**SRP:** cada módulo agrupa una responsabilidad concreta. **DIP:** los casos de
uso reciben repositorios, transacción, reloj, hashing y auditoría; no importan
SQLite ni Express. `composition.js` conecta esos puertos con adaptadores reales.
Las pruebas sustituyen colaboradores con objetos en memoria. No se crean
interfaces vacías ni se promete cambiar de motor sin adaptar SQL/transacciones.

`user-service.js` y `security.js` conservan fachadas de compatibilidad para la
semilla y consumidores anteriores. Las rutas HTTP de usuarios/roles y la forma
de sus respuestas permanecen compatibles con los formularios de Brenda.
No se cambia a username, autorregistro ni envío de credenciales por WhatsApp.

La consulta de usuarios pasa de **302 a 4 SELECT** para una página de 100 dentro
de 404 cuentas ficticias (cuatro iniciales y 400 adicionales), medidos en ambas
versiones. Se excluye el middleware de autenticación. Una página vacía requiere
dos SELECT. Es una mejora estructural comprobada, no un benchmark ni una prueba
de 400 conexiones simultáneas. Los manifiestos de captura registran la medición.

## Permisos y errores

- Las rutas rechazan falta de sesión (401) y falta de permiso (403). Varios
  argumentos de `requirePermission` significan cualquiera de ellos, OR.
- `users.manage` permite gestionar perfiles; `roles.manage` autoriza asignaciones
  y permisos. Se conserva la restricción de altas delegadas al rol participante
  sin privilegios administrativos indirectos y la protección de cuentas sensibles.
- Altas/ediciones verifican autorización nuevamente dentro de la transacción,
  después del hashing. Login vuelve a comprobar que la cuenta siga activa y que
  su hash no haya cambiado mientras se verificaban las credenciales.
- El último administrador activo y el rol administrador protegido se conservan.
  La sesión usa los permisos actuales en cada solicitud. Cambio de contraseña
  o desactivación revocan sesiones, como en la referencia.
- Se mantienen 422 para validaciones, 404 para inexistentes/no disponibles y
  409 para conflictos. Códigos SQLite de duplicado/FK/CHECK/bloqueo se traducen
  sin buscar cadenas; un fallo inesperado mantiene 500 genérico y no expone campos
  adjuntos arbitrariamente. El límite de login mantiene 429 y `Retry-After`.

## Observer: problema, implementación y alcance

El servicio de Adel conserva validación, repositorio, estados, alcance y auditoría.
Su ampliación recibe un puerto `events`; no importa notificaciones ni proveedores.
La composición de la aplicación conecta ese puerto al publicador y al observador.
Las llamadas directas históricas sin ese puerto y la semilla no producen avisos;
las rutas de la aplicación siempre lo conectan.

1. Crear en `programada` o pasar a ese estado registra `training.scheduled`.
2. Modificar realmente otro dato/estado registra `training.updated`, incluso en
   una capacitación planificada. Crear sólo planificada no avisa. Un PUT idéntico
   no genera otro evento. Se conservan los bloqueos terminales de Adel.
3. Capacitación, auditoría y evento pendiente se guardan en **una transacción**.
   Si falla cualquiera, se revierten todos.
4. Tras el commit, Observer publica a los suscriptores. El consumidor crea avisos
   internos y marca el evento procesado en otra transacción.
5. Un fallo del observador revierte avisos parciales, deja pendiente el evento y
   conserva la capacitación confirmada. No se responde un 500 engañoso después
   de haber guardado. Reintentar no duplica `(event_id,user_id)`.
6. Los eventos pendientes sobreviven a reinicios. Un gestor puede usar
   **Avisos → Reintentar avisos pendientes**, que procesa como máximo 50 por llamada.
   No hay worker, cron, correo, WebSocket ni WhatsApp automáticos.

Observer desacopla quién comunica el cambio de quién crea el aviso. El registro
durable de eventos (outbox) resuelve la ventana entre guardar y avisar; no es el
patrón Observer en sí. Los observadores actuales son síncronos y transaccionales.
Un futuro canal externo exige una entrega y sus reintentos propios: no se debe
enviar una llamada externa dentro de esta transacción ni afirmar entrega universal
exactamente una vez. No hay política automática de retención de eventos/avisos.

**Supuesto pendiente de validación:** destinatarios activos con
`trainings.manage` o `trainings.view_all`, y el instructor asignado si tiene
`teaching.manage`. No se difunde a todos los participantes porque V1 no gestiona
inscripciones. Al leer/marcar se comprueba propietario y alcance actual, evitando
acceso de un instructor reasignado o un gestor con permiso revocado.
La bandeja se actualiza al abrirla o con **Actualizar avisos**, sin tiempo real.
No se notifican retroactivamente las capacitaciones de la semilla.

## Migración y uso local

`003_notifications.sql` añade `training_events`, `notifications`, índices y
unicidad evento/destinatario. Conserva 001/002 y las filas existentes. La prueba
de migración confirma perfiles, roles personalizados, capacitaciones, claves
foráneas y recuperación de pendientes tras reabrir una base ficticia.

Antes de aplicar migraciones sobre datos importantes, detener escritores y hacer
un respaldo consistente de SQLite. No copiar sólo el `.sqlite` mientras hay WAL
activo. Esta entrega no ejecutó migraciones ni semilla sobre la base de trabajo.

```bash
npm run db:migrate
npm run dev
```

No hace falta ejecutar nuevamente `db:seed` si ya hay usuarios. Entrar con la
cuenta existente, crear una capacitación programada, abrir Avisos, editarla y
actualizar avisos. Marcar un aviso como leído y recargar para confirmar persistencia.
Cambiar `.env` sigue sin cambiar la contraseña de cuentas existentes.

La reversión del código debe conservar la base respaldada. Quitar el código de
la funcionalidad no requiere borrar las nuevas tablas; una migración descendente
que las elimine perdería avisos y no se incluye ni ejecuta automáticamente.

## Pruebas y evidencias

Después: **95/95 pruebas backend**, TypeScript y Vite correctos; **5/5 casos de
Chrome** (los cuatro existentes y el nuevo flujo de avisos con móvil).
Casos propios en `tests/franshesco-{users,auth,events}.test.js`:
inyección de dependencias sin SQLite/Express, altas simultáneas, rollback de alta,
revocación durante hashing, autorización dentro del servicio, consulta por lotes,
hash malformado, ventana de intentos, errores genéricos, suscripción/desuscripción,
programación/modificación, PUT idéntico, rollback de evento, fallo de observador,
reintento idempotente, propiedad/CSRF, reasignación y migración/reinicio.

```bash
npm run check
npm run test:ui
node scripts/verify-franshesco.mjs
```

Las pruebas de UI se ejecutaron en copias aisladas para conservar las capturas
históricas de los compañeros. Al ejecutar la suite original en la raíz, sus casos
antiguos actualizan `docs/evidencias/v1-*.png`; no confundirlas con las evidencias
individuales nuevas. El build aislado sin `.env` produjo JS de 266,99 kB; en la
raíz, el entorno local development produjo 508,76 kB y advertencia de tamaño,
sin fallo. No se modificó la configuración privada para corregir esa advertencia.

La carpeta final `docs/latex/imagenes/franshesco/` contiene únicamente 23 láminas:
las 14 `comparacion_visual_*` conservadas intactas y nueve `comparacion_codigo_*`
con el antes y el después en la misma imagen. El [índice completo](../latex/imagenes/franshesco/README.md)
enlaza registro, autenticación, permisos, Repository, inyección, eventos, Observer,
outbox y errores, con versiones y explicaciones del diseño aplicado.

Los originales individuales anteriores se apartaron a
`docs/franshesco/evidencias/archivo_png/` para conservar procedencia y hashes.
Las capturas de aplicación son reales; los fragmentos de código son literales,
con numeración y referencia Git, no capturas inventadas de VS Code.
Los rótulos «sin commit» describen el momento de captura previo al cierre final,
no el estado de publicación de la entrega. Los hashes vinculan las imágenes con
los archivos efectivamente entregados.

Para regenerar con dependencias y builds preparados:

```bash
node scripts/capture-franshesco.mjs --phase antes --root .verification/franshesco/inicio
node scripts/capture-franshesco.mjs --phase despues --root .
node scripts/compare-franshesco-code.mjs
```

No usar una versión histórica con el `.env` o la base actual para obtener capturas.
El script siempre crea una base en memoria y contraseñas efímeras que no registra.

## Entrega y exposición

Capítulo integrado: `docs/latex/capitulos/09_refactorizacion_franshesco.tex`.
Documento individual compilable: `docs/latex/franshesco.tex`.
PDF individual: `output/pdf/refactorizacion-franshesco.pdf`, 14 páginas; compilado
con pdfLaTeX y revisado visualmente, sin avisos de desbordamiento en su registro final.
El `main.tex` grupal supera también una compilación de comprobación en modo draft;
no se reemplazó el PDF grupal histórico. La sección propia de la presentación se
actualizó, pero no se afirma una nueva compilación de Beamer.
Guion: `GUION_PROFESOR.md`. Seguimiento local: `SPRINT.md`.
El cierre autorizado utiliza el mensaje `Punto final fran 1` y publica la rama
propia junto con la referencia inicial. No acredita revisión humana, reuniones,
cambios en Jira, aprobación de PR ni integración en main. La prueba de publicación
se obtiene del historial Git y de la referencia remota, sin inventar hashes.

## Evidencias ampliadas

La selección final conserva sin cambios las 14 comparaciones visuales y reemplaza
las imágenes individuales por nueve comparaciones de código. Cada una incluye
ambos fragmentos, situación inicial, cambio y comprobación. Los originales quedan
fuera de la carpeta final como respaldo de procedencia. Regenerar código con
`node scripts/compare-franshesco-code.mjs`; verificar hashes y fragmentos con
`node scripts/verify-franshesco.mjs`. No es necesario regenerar las comparaciones
visuales conservadas. Esta reorganización no modifica el código del producto.
