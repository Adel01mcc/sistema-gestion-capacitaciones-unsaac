# Traspaso verificable — 12 de noviembre de 2026

## Resultado y límites

Se implementó un primer incremento local para **HU-01, HU-02, HU-03, HU-04 y HU-16**: usuarios, roles/permisos, creación/edición/consulta de capacitaciones e inicio/cierre de sesión. Incluye interfaz en español, API Express real, SQLite en archivo, migración, semilla ficticia, validaciones, autorización, scrypt, cookie HttpOnly, CSRF y auditoría transaccional.

No se cierra la DoD completa: faltan revisión humana del equipo, validación del cliente e integración autorizada. No se implementó el producto completo ni se crearon V2–V4, tags, commits, PR, push, merge o despliegues. El workflow CI está preparado, no ejecutado en GitHub.

## Decisiones y organización

Modelo propuesto: iterativo, incremental y adaptativo; Scrum con Sprints de dos semanas, Kanban para flujo/WIP/bloqueos, pruebas y refactorización de XP donde aporten. No se atribuyen ceremonias, TDD o programación en pareja que no ocurrieron.

Monolito modular: React/TypeScript → rutas Express → servicios de negocio → SQLite. Stack fijado: Node24.16.0; Express5.3.0; React19.3.1; TypeScript7.0.2; Vite8.3.8; Zod4.6.7; Supertest7.3.2; Playwright1.65.0. SQLite3.53.0 incluido en Node. PostgreSQL/Supabase queda como opción pendiente de decisión y migración real.

El clon inicial sólo contenía9 archivos documentales. La app descrita por guías antiguas pertenece a otra carpeta y no se encontró aquí. Se preservaron el contrato y los siete TXT. Sólo se modificó README entre los archivos preexistentes.

## Archivos creados o modificados

| Grupo | Archivos y finalidad |
|---|---|
| Arranque | `package.json`, `package-lock.json`, `.env.example`, `.nvmrc`, `.gitignore`, `vite.config.ts`, `tsconfig.json`, `index.html`, `README.md`; dependencias, scripts, configuración y guía reproducible |
| Interfaz | `src/App.tsx`, `Users.tsx`, `Trainings.tsx`, `components.tsx`, `api.ts`, `hooks.ts`, `types.ts`, `styles.css`, `main.tsx`, `vite-env.d.ts`; sesión, pantallas, formularios y comunicación con API |
| API | `server/app.js`, `index.js`, `routes/auth.js`, `routes/users.js`, `routes/trainings.js`; composición, HTTP y permisos |
| Negocio/seguridad | `server/services/user-service.js`, `training-service.js`, `security.js`, `constants.js`, `errors.js`; validación, reglas, autorización y errores |
| Persistencia | `server/db.js`, `migrations/001_initial.sql`, `migrate.js`, `seed.js`; esquema, transacciones, migraciones y datos ficticios |
| Calidad | `tests/helpers.js`, `api.test.js`, `security.test.js`, `persistence.test.js`, `ui.spec.ts`, `playwright.config.ts`, `scripts/serve-e2e.js`, `.github/workflows/ci.yml` |
| Documentación | `docs/DIAGNOSTICO_INICIAL.md`, `REQUISITOS.md`, `BACKLOG.md`, `CRITERIOS_ACEPTACION.md`, `TRAZABILIDAD.md`, `PROCESO_DESARROLLO.md`, `SPRINT_1.md`, `ARQUITECTURA.md`, `DECISIONES_TECNICAS.md`, `API.md`, `PRUEBAS.md`, este estado y `AGENTS.md` |
| Modelos/informe |11 fuentes en `docs/diagramas/`; `docs/latex/main.tex`,11 capítulos, bibliografía, bitácora, tabla de evidencia, preparador Overleaf y PDF |
| Evidencia |`docs/evidencias/v1-escritorio.png`, `v1-movil.png`, capturadas en Chrome con datos ficticios |

Los nombres abreviados en cada fila son relativos a la carpeta indicada. `.verification/`, `node_modules/`, caché, dist y bases son artefactos locales ignorados; no son fuentes para commit.

## Ejecución y comprobación

Seguir el README: `npm.cmd ci`; copiar `.env.example` a `.env`; definir contraseña ficticia local de12–128 caracteres; `npm.cmd run db:migrate`; `npm.cmd run db:seed`; `npm.cmd run dev`; abrir http://127.0.0.1:5173. Sin contraseña de semilla configurada no se crean cuentas predeterminadas.

`npm.cmd run check` aprobó **28 pruebas** de API/seguridad/persistencia y el build. `npm.cmd run test:ui` aprobó **4 pruebas Chrome**, incluidos formularios y diseño móvil. La evidencia y problemas corregidos están en `docs/PRUEBAS.md`. Los resultados no certifican los84 casos diseñados de todas las historias.

Informe: fuente completa en `docs/latex/`, fragmentos leídos del código real y capturas reales. XeLaTeX falló por falta de formato; la alternativa pdfLaTeX + BibTeX generó el PDF. La revisión final del PDF se registra en PRUEBAS. Campos académicos por confirmar: facultad, escuela oficial, apellidos de Franshesco/Daniela y escudo autorizado.

## Estado Git y contribución

Rama `feature/v1-base-funcional` desde `main` en `cf6e720`. Cambios sin commit y sin staging. Se respetaron referencias de integrantes; no se hizo fetch ni integración de sus ramas. Antes de continuar comprobar `git status --short --branch`, `git diff` y archivos nuevos. Nunca usar reset/clean para preparar la entrega.

La implementación y documentación se produjeron con asistencia de Codex, basado en GPT-6 según la plataforma; la variante exacta no se expuso. Se usaron agentes para frontend, requisitos y arquitectura/reporte, y una revisión técnica independiente detectó fallos corregidos. No se atribuye revisión ni autoría manual a estudiantes que no la confirmaron.

## Dificultades y siguiente iteración

C: está sin espacio; D: tiene espacio suficiente. El ejecutor aislado falló al iniciar comandos; se usaron ejecuciones autorizadas y caché/perfiles/bases temporales en D:. No se borraron archivos del usuario. MiKTeX requirió alternativa a XeLaTeX y correcciones de fuentes/diagramas. No se modificaron servicios PostgreSQL ni cuentas de alojamiento.

Siguiente actividad: Brenda u otro revisor acordado verifica el diff y el flujo ficticio, registra observaciones y el equipo confirma reglas de roles/estados/cupos. Tras esa revisión, seleccionar **HU-06 inscripción de participantes** y sus dependencias HU-05/17/19 para V2, con pruebas de duplicado, permisos y carrera por último cupo. No continuar automáticamente con28 historias ni marcar Jira como Hecho sin evidencia.
