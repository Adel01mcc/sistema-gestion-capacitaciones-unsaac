# Sistema de Gestión de Capacitaciones · Paz Sur

Proyecto académico de Ingeniería de Software I, UNSAAC. Primer incremento funcional para inicio de sesión, usuarios, roles y registro/edición de capacitaciones. Las reglas son supuestos documentados pendientes de validación con Paz Sur. Los datos de semilla son ficticios.

**Estado:** V1 implementada para revisión. No constituye el producto completo de 28 historias ni una versión publicada. Se preservaron los documentos y ramas de integrantes. [Diagnóstico inicial](docs/DIAGNOSTICO_INICIAL.md).

## Ejecutar en Windows / PowerShell

Requiere Node **24.16 o posterior de la rama 24** y npm. SQLite está incluido en Node: no requiere Docker, PostgreSQL ni una cuenta externa. Las versiones exactas se encuentran en `package-lock.json`.

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Abre `.env` y define `SEED_ADMIN_PASSWORD` con una contraseña local de entre 12 y 128 caracteres. No existe contraseña predeterminada. Conserva `SEED_ADMIN_EMAIL=admin@demo.test` o cámbialo por un correo ficticio. `.env`, bases de datos y cachés están excluidos de Git.

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Abre **http://127.0.0.1:5173**. La API escucha por defecto en **http://127.0.0.1:3001/api**. El proxy Vite toma `PORT` y `HOST` de la configuración local para conservar la conexión con la API. Mantén el mismo hostname durante la sesión.

La semilla crea cuatro cuentas: el administrador indicado en `.env`, `coordinacion@demo.test`, `instructor@demo.test` y `participante@demo.test`. Todas reciben la contraseña de demostración definida localmente. Repetir la semilla conserva cuentas y contraseñas existentes; cambiar `.env` no cambia sus contraseñas. También se crean dos capacitaciones ficticias.

En Linux/macOS usa `npm` y `cp .env.example .env` en lugar de `npm.cmd` y `Copy-Item`.

## Comprobar y demostrar

Para ejecutar **interfaz, API y SQLite juntas**, con dependencias y cuenta local ya preparadas:

```powershell
npm.cmd run local
```

Este comando compila el frontend y arranca Express, que sirve la web y `/api` desde **http://127.0.0.1:3001** (o el puerto configurado). No necesitas iniciar Vite aparte. Conserva la terminal abierta; `Ctrl+C` detiene el servidor. Las migraciones pendientes se aplican al abrir la base. El comando conserva las cuentas y datos existentes, sin cambiar sus contraseñas ni repetir la semilla. Para la primera instalación sigue los pasos de configuración y semilla anteriores.

```powershell
npm.cmd test
npm.cmd run build
# Después del build, servir interfaz y API desde un solo proceso:
npm.cmd start
```

El modo compilado se abre en **http://127.0.0.1:3001**. Mantén `NODE_ENV=development` para HTTP local. En producción, la cookie Secure requiere HTTPS y alojamiento configurado; este incremento no se ha desplegado.

1. Entra como administrador; consulta panel, usuarios y permisos.
2. Registra una persona ficticia. Repite el correo y comprueba el rechazo sin duplicar datos.
3. Crea una capacitación; edita título, cupo y estado. Prueba cupo cero y fechas invertidas.
4. Reinicia el proceso y consulta el mismo registro: permanece en `data/paz-sur.sqlite`.
5. Entra como coordinador: puede gestionar capacitaciones, pero no usuarios ni roles. El instructor sólo ve actividades asignadas; el participante todavía no tiene inscripciones en V1.

Consulta [PRUEBAS.md](docs/PRUEBAS.md) para resultados realmente ejecutados, limitaciones y revisión manual pendiente. Las pruebas usan bases aisladas y no alteran `DATABASE_PATH`.

## Organización para aprender

| Carpeta | Responsabilidad |
|---|---|
| `src/` | Interfaz React/TypeScript: formularios, sesión y peticiones HTTP |
| `server/routes/` | Rutas Express, autorización y respuestas JSON |
| `server/services/` | Reglas de negocio y transacciones; usuarios conserva su acceso SQL |
| `server/validation/`, `server/repositories/` | Entradas Zod y SQL parametrizado de capacitaciones separados (HU-03/HU-04) |
| `server/db.js`, `server/migrations/` | Conexión SQLite, integridad y migraciones versionadas |
| `server/security.js` | Hash scrypt, sesiones opacas y protección CSRF |
| `tests/` | Integración de API, seguridad y persistencia |
| `docs/` | Requisitos, backlog, diagramas, decisiones, proceso y evidencia |
| `docs/latex/` | Informe universitario y bitácora continua |

Por ejemplo, guardar una capacitación envía JSON desde `src/Trainings.tsx` a `POST /api/trainings`; la ruta comprueba permisos y llama a `training-service.js`, que valida fechas/cupo y guarda capacitación y auditoría en una misma transacción. El formulario muestra éxito después de la respuesta real del servidor.

La [segunda etapa de Adel](docs/adel/REFACTOR_BACKEND.md), del 17/11/2026, separa validadores y repositorio de capacitaciones, refuerza las fechas/horas mediante la migración incremental 002 y conserva el contrato HTTP. Las migraciones se aplican al abrir el backend o con `npm.cmd run db:migrate`; antes de abrir una base existente, consulta el [procedimiento de respaldo y reversión](docs/adel/REFACTOR_BACKEND.md). Si encuentra datos temporales inválidos, 002 aborta sin corregir ni borrar filas. Las pruebas de esta etapa no migraron la base de trabajo.

`.env` y los archivos SQLite ya estaban rastreados en el commit inicial de esta etapa pese al `.gitignore`. Se retiraron del seguimiento conservando los archivos locales. Siguen presentes en el historial anterior; esta acción no elimina ni verifica los secretos que pudiera contener ese historial.

## Documentación

- [Endpoints V1](docs/API.md) · [Arquitectura](docs/ARQUITECTURA.md) · [Decisiones](docs/DECISIONES_TECNICAS.md).
- [Requisitos](docs/REQUISITOS.md) · [28 historias](docs/BACKLOG.md) · [Aceptación](docs/CRITERIOS_ACEPTACION.md) · [Trazabilidad](docs/TRAZABILIDAD.md).
- [Proceso propuesto](docs/PROCESO_DESARROLLO.md) · [Sprint 1](docs/SPRINT_1.md) · [Continuación](docs/ESTADO_SESION.md).
- [Informe LaTeX](docs/latex/main.tex); comandos de compilación y resultados en `docs/PRUEBAS.md`.

V2 propone participantes e instructores; V3, sesiones/asistencia/historial/evaluación; V4, integración y estabilización de prioridades acordadas. Certificados son opcionales y aún no están implementados. El registro inicial de V1 no acreditaba tags, PR, revisión humana ni despliegue. Para los commits y la publicación de la segunda etapa, consulta [la entrega de Adel](docs/adel/REFACTOR_BACKEND.md). Un PR no implica revisión humana ni integración. La ejecución remota del workflow CI debe verificarse por separado.
