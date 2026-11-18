# Refactorización del backend de capacitaciones — Adel

Fecha de trabajo: **17 de noviembre de 2026, America/Lima**. Responsabilidad indicada por el encargo: Adel Alejandro Merma Ccarhuarupay, arquitectura de software y desarrollo backend. Implementación y revisión técnica asistidas por Codex. La revisión humana y la integración se acreditarán únicamente cuando ocurran.

## 1. Referencia inicial y protección del trabajo existente

La referencia inicial de esta segunda etapa es **`eb004641b114d8c71f86af08b05f0f9e073baf73`**, mensaje `feat: subir sistema funcional de capacitaciones Paz Sur`. Este commit contiene la aplicación funcional, a diferencia de `cf6e720`, que corresponde al diagnóstico documental anterior a V1. `main` y `origin/main` apuntaban a `eb00464` tras `git fetch origin`.

Se creó `feature/adel-refactor-backend` desde `main`. La rama local `feature/v1-base-funcional` apuntaba a `f151ecb`; se conservó. El fetch encontró `origin/feature/brenda-mayhuire` en `845abe2`, con aportes posteriores de Brenda. No se incorporaron esos cambios a esta rama. La base de integración observada es `main`, referencia predeterminada de `origin/HEAD`; su elección no acredita aprobación humana para integrar.

El árbol inicial presentaba cambios locales en `data/paz-sur.sqlite-shm` y `data/paz-sur.sqlite-wal`. Se conservaron sin abrir la base de trabajo ni incorporarlos a los commits de Adel. El repositorio ya rastreaba archivos SQLite; esta etapa no atribuye esa situación a una acción propia ni utiliza esos archivos como evidencia de pruebas. No se hizo stash automático, reset, limpieza ni cambio de identidad Git.

También se comprobó por sus rutas que `.env` ya estaba rastreado. El commit real `63cdbd9` retiró `.env` y los tres archivos SQLite/WAL/SHM sólo del índice mediante `git rm --cached`; se verificó que los archivos locales siguieran presentes. No se leyeron sus contenidos. El historial previo y su copia remota siguen conteniendo esos archivos; esta medida no sanea el historial ni acredita revocación de credenciales. La decisión y sus límites están en ADR-018.

Comprobaciones de referencia:

```powershell
git status
git branch -a
git remote -v
git log --oneline -10
git fetch origin
git show eb00464:server/services/training-service.js
git diff eb00464 -- server tests docs/adel
```

## 2. Archivos examinados y alcance

| Grupo | Fuentes examinadas | Motivo |
| --- | --- | --- |
| Contexto | `AGENTS.md`, `README.md`, `docs/DIAGNOSTICO_INICIAL.md`, `IMPLEMENTATION_CONTRACT.md`, `REQUISITOS.md`, `BACKLOG.md`, `PROCESO_DESARROLLO.md` | Alcance, reglas, historias y definición de terminado |
| Contrato y arquitectura | `docs/API.md`, `ARQUITECTURA.md`, `DECISIONES_TECNICAS.md`, `TRAZABILIDAD.md` | Compatibilidad y supuestos existentes |
| Aplicación | `server/app.js`, `errors.js`, `constants.js`, `security.js`, `db.js`, `migrate.js`, `seed.js` | Errores, autorización, transacciones y persistencia |
| Capacitaciones | `server/routes/trainings.js`, `server/services/training-service.js`, `server/migrations/001_initial.sql`, `src/Trainings.tsx` | Flujo real POST/GET/PUT y consumidor existente |
| Comprobación | `package.json`, `tests/helpers.js`, `api.test.js`, `security.test.js`, `persistence.test.js` | Herramientas existentes y regresión |
| Informe | `docs/latex/main.tex`, `README.md`, `capitulos/09_refactorizacion.tex`, `preparar-overleaf.ps1` | Extender el informe sin sustituir aportes |

El trabajo corresponde principalmente a **HU-04**, con soporte para **HU-03** y tareas técnicas de cohesión, integridad y regresión. No añade inscripciones, asistencia, certificados ni nuevas historias. No modifica relatos, estimaciones ni fechas del Sprint. La arquitectura conserva React/TypeScript/Vite, Express, Zod y SQLite mediante `node:sqlite`, sin dependencias adicionales.

## 3. Problemas comprobados y cambios

| Problema inicial verificable | Cambio de segunda etapa | Principio y beneficio |
| --- | --- | --- |
| `training-service.js` reúne esquemas Zod, construcción de consultas, SQL de escritura, permisos de alcance, transiciones y transacción | Validadores en `server/validation/training-validation.js`; SQL en `server/repositories/training-repository.js`; servicio coordina el caso de uso | Responsabilidad única y cohesión: revisar una entrada o una consulta no obliga a recorrer toda la operación |
| El esquema SQL compara fechas y horas como texto; un INSERT directo puede guardar `2027-02-30` o `25:00` | Migración incremental `002_training_dates.sql` con validación de calendario y formato diario en INSERT/UPDATE | Integridad en persistencia: la protección temporal también alcanza escritores que no pasan por Zod |
| Las pruebas iniciales cubren flujos principales pero no todos los pares de estados, fallo de auditoría ni reapertura después de editar | Regresión focal en `tests/trainings.test.js` y pruebas de migración | Verificación del contrato y atomicidad ante errores reales |

Las rutas originales ya separaban HTTP del caso de uso y ya comprobaban `trainings.manage`. No se presenta esa separación como una mejora nueva ni se inventa un controlador monolítico anterior. La parametrización SQL, la cookie HttpOnly, CSRF y la transacción con auditoría también existían y se conservaron.

La extracción es una refactorización estructural; la nueva restricción SQL es una mejora de integridad. Se distinguen porque la segunda cambia qué escrituras directas acepta SQLite. No se aplica una migración a la base local del usuario durante las comprobaciones.

## 4. Evidencia real del antes y después

### Validación

Antes, obtenido de `git show eb00464:server/services/training-service.js`:

```js
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use una fecha YYYY-MM-DD.').refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.');
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use una hora HH:mm.');
```

Después: [validador de capacitaciones](../../server/validation/training-validation.js). Conserva los límites y reglas de calendario existentes; la mejora es su ubicación y reutilización en alta, edición y filtros. El servicio continúa validando antes de escribir. Las pruebas comprueban rechazo de campos ausentes, días inexistentes, formato horario y períodos invertidos.

```js
export const parseTrainingInput = input => validate(trainingSchema, input);
export const parseTrainingQuery = query => validate(querySchema, query);
```

El servicio llama a `parseTrainingInput` y `parseTrainingQuery`; el validador no importa Express, SQLite ni el repositorio.

### Persistencia y transacción

Antes, en el mismo servicio original:

```js
db.prepare('UPDATE trainings SET code=?,title=?,description=?,start_date=?,end_date=?,start_time=?,end_time=?,modality=?,location=?,capacity=?,status=?,instructor_id=?,updated_at=? WHERE id=?').run(value.code, value.title, value.description, value.start_date, value.end_date, value.start_time, value.end_time, value.modality, value.location, value.capacity, value.status, value.instructor_id, now(), id);
audit(db, user.id, 'update', 'training', id);
return getTraining(db, id, user);
```

Después: [repositorio SQL](../../server/repositories/training-repository.js) y [servicio del caso de uso](../../server/services/training-service.js). El repositorio ejecuta la escritura parametrizada; el servicio conserva la transacción que reúne modificación, auditoría y consulta del resultado. La separación no traslada COMMIT al repositorio ni permite que una auditoría fallida deje una edición parcial.

La prueba de fallo de auditoría fuerza un error mediante un trigger en una base ficticia aislada; exige 500 genérico y verifica que tanto la fila como la auditoría conserven su estado anterior. La prueba de persistencia edita por HTTP y recupera el cambio después de cerrar y reabrir SQLite y la aplicación.

Fragmento actual de `updateTraining`, dentro de `transaction`:

```js
saveTraining(db, id, value, now());
audit(db, user.id, 'update', 'training', id);
return getTraining(db, id, user);
```

`findTraining`, `searchTrainings`, `insertTraining`, `saveTraining` y `readTrainingDashboard` contienen las consultas SQL. `isActiveInstructor` comprueba la condición requerida con una consulta acotada, en lugar de hidratar todo el perfil, roles y permisos. El servicio conserva `accessFilter` como política de alcance; los fragmentos SQL que recibe el repositorio proceden de esa función, no del texto del cliente.

### Restricción temporal de SQLite

Antes, `git show eb00464:server/migrations/001_initial.sql`:

```sql
start_date TEXT NOT NULL,
end_date TEXT NOT NULL CHECK (end_date >= start_date),
start_time TEXT NOT NULL,
end_time TEXT NOT NULL CHECK (end_time > start_time),
```

Esas comparaciones no prueban la existencia del día ni que la hora sea `HH:mm`. Después: [migración 002](../../server/migrations/002_training_dates.sql). No se reescribe `001_initial.sql`, no se reconstruye la tabla ni se cambian identificadores o referencias. La migración precomprueba las filas existentes y se revierte completa si encuentra datos inválidos. La corrección de esos datos exige una decisión explícita; no se normalizan silenciosamente.

Para comparar todo el cambio conservando la referencia real:

Se conservan copias del antes en `docs/adel/antes/training-service.eb00464.js` y `001_initial.eb00464.sql`, junto con `docs/adel/ANTES_DESPUES.diff` y el manifiesto `docs/adel/EVIDENCIAS_SHA256.txt`. Los originales siguen siendo los objetos Git y los archivos de producto; las copias son material de evidencia.

```powershell
git diff eb00464 -- server/services/training-service.js
git diff eb00464 -- server/validation server/repositories server/migrations tests
git log --oneline eb00464..feature/adel-refactor-backend
```

## 5. API y compatibilidad

Se mantienen `POST /api/trainings`, `GET /api/trainings`, `GET /api/trainings/:id`, `PUT /api/trainings/:id` y `GET /api/dashboard`. No se necesita adaptar el formulario existente de Daniela. POST continúa devolviendo 201; PUT y GET, 200. El detalle conserva `{data}`, `sessions: []`, `enrollments: []`, `instructor_name`, `enrolled_count` y `available_seats`; la lista conserva `{data,meta}`.

PUT recibe el formulario completo conforme al contrato existente; no se lo transforma en PATCH. El responsable original y `created_at` se conservan aunque el cliente envíe otro `responsible_id`. Los cambios exitosos quedan auditados. Los errores mantienen `{error:{message,fields?}}`: 422 para campos inválidos, 404 para registro ausente o fuera de alcance, 409 para código duplicado, transición prohibida o estado terminal; los errores inesperados reciben 500 genérico.

La autorización y CSRF siguen ejecutándose en servidor. El instructor consulta sus asignaciones y el participante obtiene lista vacía mientras no existan inscripciones en V1. Los campos reservados no acreditan módulos futuros terminados.

## 6. Evaluación del patrón State

1. **Problema original:** decidir si una edición conserva o cambia el estado y bloquear modificaciones de registros terminales. La primera versión ya lo resolvía mediante `TRANSITIONS` y dos guardas.
2. **Necesidad:** hay cinco estados y un grafo pequeño; no existen comportamientos extensos o algoritmos diferentes por estado. Una jerarquía State añadiría clases, delegación y archivos sin resolver otra necesidad.
3. **Alternativa elegida:** conservar el mapa en `server/constants.js` y comprobarlo en `updateTraining`. Alta sólo admite `planificada` o `programada`.
4. **Funciones afectadas:** `createTraining`, `updateTraining`; la constante `TRANSITIONS` no se sustituye por clases.
5. **Ventajas y límites:** lectura directa, pocos puntos de cambio y matriz exhaustiva de pruebas. Si aparecieran reglas diferentes complejas para inscripción, cierre o certificación, habría que reevaluar cohesión y duplicación. Esas reglas futuras no se implementan ahora.
6. **Ejemplo:** `planificada → programada → en_curso → finalizada` es válido; `planificada → finalizada` devuelve 409. En `finalizada` y `cancelada` también se rechaza una edición que mantenga el mismo estado.

| Estado actual | Estados de destino admitidos al editar |
| --- | --- |
| `planificada` | `planificada`, `programada`, `cancelada` |
| `programada` | `programada`, `planificada`, `en_curso`, `cancelada` |
| `en_curso` | `en_curso`, `finalizada`, `cancelada` |
| `finalizada` | Ninguno |
| `cancelada` | Ninguno |

El grafo, el horario diario con fin posterior al inicio y el bloqueo terminal son **supuestos existentes pendientes de validación por Paz Sur**. No se da por aprobada la reapertura, el motivo de cancelación ni una transición automática por reloj.

## 7. Ejecución y migración

Requisitos y preparación local en [README](../../README.md). Tras configurar credenciales ficticias localmente, `npm.cmd run dev` inicia interfaz y API. Las comprobaciones no necesitan cargar `.env`:

```powershell
npm.cmd test
npm.cmd run build
node --test --test-concurrency=1 tests/trainings.test.js tests/training-migration.test.js
```

La migración normal se ejecuta con `npm.cmd run db:migrate` sobre la base configurada; ese comando **no se ejecutó contra la base de trabajo en esta etapa**. Antes de aplicarlo a datos propios: detener los escritores y efectuar una copia SQLite consistente con la herramienta de respaldo, o copiar conjuntamente el estado necesario con la base cerrada. No copiar únicamente el archivo principal mientras existan escritores/WAL activos. Al arrancar, `createDatabase` aplica migraciones faltantes en transacciones y registra su versión sólo al completarlas.

Las pruebas de migración crean una base 001 ficticia, conservan IDs, usuarios, roles y auditoría, aplican 002, rechazan escrituras temporales inválidas y reabren la base. El preflight utiliza una tabla temporal `training_dates_preflight` con restricción `training_dates_valid`; se elimina al completar la comprobación. Un histórico inválido aborta 002 sin borrar filas ni registrar esa versión.

**Reversión de esquema:** con la aplicación detenida, respaldo consistente y conexión al archivo correcto, ejecutar la siguiente transacción. Este procedimiento se comprobó sobre una base ficticia aislada, no sobre la base de trabajo:

```sql
BEGIN IMMEDIATE;
DROP TRIGGER trainings_validate_dates_insert;
DROP TRIGGER trainings_validate_dates_update;
DELETE FROM schema_migrations WHERE version='002_training_dates.sql';
COMMIT;
```

Si falla una sentencia antes de COMMIT, ejecutar `ROLLBACK` en esa misma conexión. La reversión conserva las filas y restaura la protección temporal anterior, más débil. Reabrir el backend actual vuelve a aplicar 002 porque su archivo sigue presente; para mantener una reversión operativa debe utilizarse el código anterior y después planificar la reaplicación. No borrar registros para eludir el preflight. Las pruebas verifican reversión, rollback de una reversión fallida y reaplicación sin pérdida de datos.

## 8. Pruebas, trazabilidad y estado real

| Historia/tarea | Evidencia | Situación |
| --- | --- | --- |
| HU-03: registro y validación | `tests/api.test.js`, `tests/trainings.test.js` | Implementación y regresión; resultado final en `docs/PRUEBAS.md` |
| HU-04: edición, inexistentes, duplicados y persistencia | `tests/trainings.test.js`, `tests/persistence.test.js` | Implementación y regresión; resultado final en `docs/PRUEBAS.md` |
| TT: integridad temporal SQLite | `002_training_dates.sql`, `tests/training-migration.test.js` | Migración incremental; aplicación a base de trabajo pendiente |
| TT: cohesión | Validación, repositorio y servicio separados | Revisión técnica asistida por IA |
| TT: State | Grafo existente y matriz de transiciones | Evaluado; no implementado como patrón de clases |

La comprobación inicial del **17/11/2026** fue `npm.cmd test`: **28 pruebas aprobadas, 0 fallos**, antes de la refactorización. La comprobación final `npm.cmd run check` aprobó **68 pruebas, 0 fallos**, e incluyó TypeScript y compilación Vite con código de salida 0. El total incluye los 25 subcasos de la matriz de estados. El build emitió una advertencia de tamaño del paquete de 504,11 kB y terminó correctamente. Las fuentes frontend y las dependencias no cambiaron en esta etapa; no se ejecutó un build anterior para comparar la advertencia.

| Comprobación ejecutada el 17/11/2026 | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| `npm.cmd test` antes de modificar | Regresión inicial sin fallos | 28 pruebas aprobadas; 0 fallos | Aprobada |
| `node --test --test-concurrency=1 tests/training-migration.test.js tests/persistence.test.js` | Conservar datos, proteger fechas/horas y permitir reversión/reaplicación | 8 pruebas aprobadas; código 0 | Aprobada; ejecución focal del agente técnico |
| `npm.cmd run check` después de modificar | Suite completa y compilación sin errores | 68 pruebas aprobadas; TypeScript/Vite correctos; código 0 | Aprobada |
| Revisión técnica independiente asistida por IA | Detectar regresiones o incompatibilidades | Sin hallazgos bloqueantes; ejecución focal de capacitaciones y seguridad 48/48 | Registrada; no revisión humana |
| `npm.cmd run test:ui`, primer intento y repetición | Completar escenarios existentes y acreditar cierre del runner | Primero: cuatro casos correctos, cierre trabado e interrupción con código 1. Repetición con permisos ampliados: 4 aprobadas en 8,7 s, código 0 | Repetición final aprobada |
| `powershell -NoProfile -File .\docs\latex\preparar-overleaf.ps1` | Preparar fuentes autónomas y copias reales | Código 0 | Preparación aprobada; no compilación PDF |
| Compilación LaTeX de esta etapa | Generar PDF actualizado si existe compilador | No se encontró compilador en PATH ni en las ubicaciones MiKTeX consultadas; fuentes preparadas para Overleaf | No ejecutada; PDF anterior sin actualizar |

El detalle y las limitaciones están en [PRUEBAS.md](../PRUEBAS.md). Estas comprobaciones técnicas no acreditan aceptación humana ni una ejecución remota de CI.

La DoD de `docs/PROCESO_DESARROLLO.md` requiere también revisión por otro integrante humano e integración real comprobada. Por ello esta contribución se presenta para revisión, no como historias «Hechas». No se atribuyen reuniones, tiempos de respuesta, despliegues ni validación del cliente.

## 9. Autoría, informe y material de entrega

El diagnóstico y el informe existentes describen V1 como construcción asistida por Codex. La referencia `eb00464` permite conservar el código recibido, pero Git no demuestra quién tecleó manualmente cada línea ni una revisión humana. Los cambios de esta segunda etapa se realizan también con asistencia de Codex, bajo la responsabilidad académica indicada por Adel; no se atribuyen aportes ajenos.

La sección nueva del informe está en `docs/latex/capitulos/09_refactorizacion_adel.tex`. No se encontró compilador LaTeX en el entorno consultado; no se generó un PDF actualizado de esta etapa. `docs/latex/main.pdf` ya existía en `eb00464` y corresponde al informe anterior. La alternativa Overleaf está en `docs/latex/README.md`: ejecutar el preparador de fuentes, subir `docs/latex/` y seleccionar `main.tex` con XeLaTeX.

- [Guion individual de 2–3 minutos](GUION_EXPOSICION.md).
- [Texto para Jira y Laboratorio 8](JIRA_LAB8.md).
- [Descripción del Pull Request](PULL_REQUEST.md).

Commits reales creados en esta rama:

| Commit | Cambio |
| --- | --- |
| `63cdbd9` | `chore(security): excluir entorno y bases locales del seguimiento` |
| `36b2f2d` | `refactor(backend): separar validacion y persistencia de capacitaciones` |
| `1440c84` | `refactor(data): proteger fechas y horarios mediante migracion incremental` |
| `541a3bf` | `test(capacitaciones): cubrir edicion estados y atomicidad` |

El commit documental inicial es `2441af0`. El push fue confirmado y se creó el [PR #2 en borrador hacia main](https://github.com/Adel01mcc/sistema-gestion-capacitaciones-unsaac/pull/2). Se publicó evidencia en [AD-4](https://unsaac-team-vkzuhjfb.atlassian.net/browse/AD-4), comentario `10039`, sin cambiar estados, fechas ni estimaciones. El [resumen de entrega](ENTREGA.md) reúne los quince resultados solicitados. Permanecen pendientes la revisión humana, la integración autorizada, la validación de supuestos y la aplicación controlada de la migración a cualquier base de trabajo.
