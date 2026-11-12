# Diagnóstico inicial del clon — 12 de noviembre de 2026

Inspección realizada antes de implementar V1. Fecha: America/Lima. Base Git: `main`, commit `cf6e720` (`docs: add project documentation`), anterior `ee5dd9b`. Árbol de trabajo inicialmente limpio. Se creó la rama local `feature/v1-base-funcional`; no se hicieron commits, push, merge ni etiquetas.

## Inventario observado

El árbol completo inicial tenía nueve archivos: `README.md`, `docs/IMPLEMENTATION_CONTRACT.md` y siete TXT en `docs/coordinacion/` (`00_EMPEZAR_AQUI`, `PROMPT_MAESTRO`, `CONTEXTO_GENERAL`, `ADEL`, `BRENDA`, `DANIELA`, `FRANSHESCO`). Se preservaron todos. No existían `package.json`, código fuente, base de datos, migraciones, pruebas, escudo ni informe LaTeX en este clon.

Ramas locales: `main`. Referencias remotas: `origin/main`, `origin/AD-1-registro-usuarios`, `origin/BrendaPro`, `origin/feature/brenda-mayhuire`; `origin/HEAD` apunta a main. `git ls-tree -r --name-only` mostró solamente README en AD-1 y feature/brenda-mayhuire; BrendaPro contiene README y documentos. No se hizo fetch: esta observación corresponde a las referencias locales disponibles, no certifica cambios posteriores en GitHub. No se mezcló ni descartó trabajo de integrantes.

| Elemento | Existe inicialmente | Decisión para primer incremento |
|---|---|---|
| Lenguaje | Documentación Markdown/TXT; ninguna aplicación | JavaScript ESM en servidor; TypeScript en interfaz y configuración |
| Framework frontend | Sólo propuesto en contrato: React + Vite | Implementar React 19.3.1, Vite 8.3.8, TypeScript 7.0.2 |
| Framework backend | Sólo propuesto: Node 24 + Express 5 | Node 24.16.0 disponible; Express 5.3.0 |
| Base de datos | Ninguna; contrato describe SQLite y guías mencionan futuro PostgreSQL | SQLite 3.53.0 mediante node:sqlite comprobado en memoria; persistencia en archivo para V1 |
| Librerías importantes | Ninguna instalada o declarada | Zod 4.6.7 para entradas, crypto nativo para scrypt/sesiones, React para UI |
| Herramientas de pruebas | Ninguna en el árbol | Node Test Runner + Supertest 7.3.2, según contrato |
| Arquitectura | Contrato de API y modelo SQL documentados | Monolito modular: presentación, rutas, servicios, persistencia |
| Funcionalidades existentes | Ninguna ejecutable en el clon | HU-01/02/03/04/16 para V1 |
| Funcionalidades pendientes | Las 28 HU son alcance candidato | Participantes, asistencia, sesiones, historial, evaluación, reportes y certificados en incrementos posteriores |
| Riesgos técnicos | Guías desactualizadas, reglas sin validar, falta de app y evidencia | Documentar supuestos, separar estado real/propuesta, probar API y persistencia aislada |

Las versiones se obtuvieron del registro npm antes de instalar y quedaron fijadas en `package-lock.json`. No son versiones encontradas en una aplicación preexistente. La comprobación funcional posterior se registra en [PRUEBAS.md](PRUEBAS.md).

## Contradicciones y conservación

Los TXT describen una carpeta `C:\Users\Usuario\Documents\Gestor-de-Capacitaciones` con código, SQLite y sin Git; ese estado no corresponde al clon actual en D:. Contienen políticas históricas R0002/R0003 contradictorias sobre publicación. No se reescribieron ni se supuso que sus pruebas, autorizaciones o revisiones hubiesen ocurrido aquí. La solicitud adjunta actual autoriza diagnóstico, diseño e implementación de un primer incremento y tiene prioridad frente a la antigua detención en F0-01. Los TXT ya estaban versionados al iniciar; esta sesión no cambió su visibilidad ni los publicó.

Se conserva el contrato como base de campos y respuestas, pero su alcance completo es diseño futuro. Los endpoints que no existen en V1 están explícitamente excluidos del flujo. Las guías mencionan PostgreSQL/Supabase: falta validar esa decisión con el equipo y preparar una migración real. No se afirma que SQLite sea una implementación previa recuperada. No se introduce Prisma sin una necesidad inmediata.

## Entorno y límites

- Node `v24.16.0`, npm `11.13.0`; una prueba directa de `DatabaseSync(':memory:')` devolvió SQLite `3.53.0`.
- Docker y psql no aparecieron inicialmente en PATH. Existe carpeta PostgreSQL 18; no se verificó ni modificó su servicio, credenciales o bases.
- El entorno completo tiene XeLaTeX, pdfLaTeX y latexmk en MiKTeX. Su presencia no equivale a una compilación exitosa; véase el registro de pruebas.
- Se detectó C: sin bytes libres y D: con aproximadamente 120 GB. El ejecutor aislado dejó de iniciar comandos (`helper_log_failed`, error 112). Los comandos autorizados fuera del aislamiento funcionaron; la caché npm y bases de prueba se ubicaron dentro del proyecto en D:. No se borraron archivos para liberar espacio.
- Modelo comunicado por la plataforma: Codex basado en GPT-6. No se expuso una variante exacta; no se atribuye una.

## Conservación y alcance

La rama nueva evita desarrollar sobre main. Para cuatro estudiantes se proponen ramas por historia y PR revisados por otro integrante; no se renombran ramas de compañeros. El incremento será revisable y ejecutable localmente. Su cierre según Definition of Done requiere todavía revisión humana e integración autorizada. V2–V4 son planes, no versiones ya realizadas.

Fuentes consultadas: [requisitos de Vite](https://vite.dev/guide/), [Express 5](https://expressjs.com/en/guide/migrating-5/), [SQLite en Node 24](https://nodejs.org/download/release/v24.16.0/docs/api/sqlite.html). La compatibilidad se comprueba también ejecutando las herramientas instaladas.
