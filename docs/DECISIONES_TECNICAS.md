# Registro de decisiones técnicas

Fecha de elaboración: 2026-11-12, America/Lima. Las decisiones de implementación corresponden al incremento local autorizado en esta sesión; las reglas de negocio provisionales requieren validación. No equivalen a aprobaciones humanas ni a decisiones verificadas en Jira.

## ADR-001 — Conservar el contrato y construir una base nueva

- **Fecha:** 2026-11-12.
- **Problema:** el clon `cf6e720` solo contiene documentos; las guías mencionan código de otra carpeta que no existe en este árbol ni en las referencias remotas inspeccionadas.
- **Alternativas:** afirmar que el código descrito está disponible; sustituir todos los documentos; conservar antecedentes y construir el primer incremento siguiendo el contrato real.
- **Decisión:** conservar archivos existentes y usar `IMPLEMENTATION_CONTRACT.md` como orientación. Registrar las diferencias entre el contrato completo y el subconjunto V1.
- **Justificación:** evita perder el trabajo documental o inventar funcionalidad previa.
- **Ventajas:** trazabilidad honesta y contratos aprovechables.
- **Limitaciones:** habrá capacidades descritas en el contrato que aún no tengan endpoint.
- **Impacto:** documentación de alcance explícita; HU restantes quedan como candidatas, no terminadas.

## ADR-002 — JavaScript ESM en API y TypeScript en interfaz

- **Fecha:** 2026-11-12.
- **Problema:** se necesita código ejecutable y comprensible en Node 24 sin una cadena de herramientas innecesaria.
- **Alternativas:** TypeScript en ambas capas; JavaScript en ambas; JavaScript ESM en API y TypeScript en React.
- **Decisión:** API JavaScript ESM conforme a los nombres `.js` del contrato; interfaz TypeScript.
- **Justificación:** el contrato existente usa módulos backend `.js`; Node puede ejecutarlos directamente y Zod valida entradas en ejecución.
- **Ventajas:** scripts sencillos y contratos de interfaz tipados.
- **Limitaciones:** JavaScript backend no ofrece la misma comprobación estática que TypeScript; las pruebas y la validación no reemplazan todos los beneficios del tipado.
- **Impacto:** no se anuncia que todo el proyecto usa TypeScript; una migración posterior debe responder a problemas observados.

## ADR-003 — React, Vite y Express 5

- **Fecha:** 2026-11-12.
- **Problema:** construir formularios conectados con una API y mantener separación de responsabilidades.
- **Alternativas:** HTML con renderizado de servidor; React/Vite + Express; introducir un framework full stack nuevo.
- **Decisión:** React + TypeScript + Vite y Node 24 + Express 5.
- **Justificación:** coincide con el contrato y la propuesta del usuario. [Express 5](https://expressjs.com/en/guide/migrating-5/) y [Vite](https://vite.dev/guide/) documentan sus requisitos de Node; el entorno ofrece Node 24.16.0.
- **Ventajas:** ecosistema conocido, interfaz modular y API testeable por separado.
- **Limitaciones:** dos procesos durante desarrollo y necesidad de mantener contrato JSON.
- **Impacto:** Vite redirige `/api` al servidor local; en la compilación la API sirve los recursos bajo la misma procedencia. Versiones exactas fijadas en el lockfile del incremento.

## ADR-004 — SQLite para el incremento local

- **Fecha:** 2026-11-12.
- **Problema:** el usuario necesita persistencia reproducible y las guías contienen tanto SQLite como una intención de PostgreSQL/Supabase, sin migración existente.
- **Alternativas:** instalar y configurar PostgreSQL ahora; depender de una cuenta externa; usar `node:sqlite` del contrato como base local y decidir la migración después.
- **Decisión:** SQLite con migraciones SQL transaccionales, claves foráneas y WAL para V1. El catálogo inicial se inserta solo al aplicar `001_initial.sql`; las reaperturas o migraciones posteriores conservan personalizaciones. PostgreSQL permanece como objetivo candidato sujeto a validación, no se declara descartado ni implementado.
- **Justificación:** se comprobó `DatabaseSync` con el Node instalado; no requiere cuentas ni un servicio adicional para demostrar el flujo completo.
- **Ventajas:** arranque simple, archivo duradero, pruebas en memoria y transacciones.
- **Limitaciones:** escrituras serializadas, SQL específico y archivo que debe respaldarse; no usar disco efímero en hosting.
- **Impacto:** una futura migración debe adaptar consultas y transacciones, ejecutar pruebas en PostgreSQL y documentar resultados. No se simula una conexión Supabase.

## ADR-005 — Monolito modular y servicios de aplicación

- **Fecha:** 2026-11-12.
- **Problema:** evitar lógica de negocio dentro de componentes visuales o controladores extensos.
- **Alternativas:** un archivo único; servicios distribuidos; capas y módulos dentro de un proceso.
- **Decisión:** rutas HTTP, servicios de usuario/capacitación y módulo de persistencia con conexión inyectada.
- **Justificación:** alta cohesión y bajo acoplamiento con una cantidad de abstracciones razonable para cuatro estudiantes.
- **Ventajas:** pruebas aisladas, reglas centrales y despliegue sencillo.
- **Limitaciones:** los servicios aún conocen SQL; cambiar el motor exige trabajo real.
- **Impacto:** no crear repositorios genéricos o clases por cada tabla sin un consumidor y una necesidad comprobada.

## ADR-006 — Sesiones opacas, hashing y autorización en servidor

- **Fecha:** 2026-11-12.
- **Problema:** iniciar sesión sin guardar contraseñas en texto ni confiar en roles elegidos por el navegador.
- **Alternativas:** token persistido en localStorage; JWT con permisos embebidos; cookie HttpOnly y sesión de servidor.
- **Decisión:** contraseñas `scrypt` con sal; cookie opaca `sgc_session`; hash de token y vencimiento de ocho horas en base; CSRF en mutaciones; permisos actuales consultados en servidor. Desactivación y cambio de contraseña revocan sesiones. Limitador por IP de diez intentos de login en quince minutos, incluidos los correctos y sin reiniciar contador al acertar.
- **Justificación:** el contrato prevé esta sesión y permite revocar acceso o cambiar roles sin esperar a que expire un JWT con privilegios antiguos.
- **Ventajas:** token inaccesible a JavaScript y revocación explícita.
- **Limitaciones:** se requiere almacenamiento de sesiones, TLS y cookie Secure al desplegar; CSRF y XSS necesitan controles específicos.
- **Impacto:** `.env.example` no contiene secretos; no se exponen hashes o tokens en respuestas de usuario, auditoría o documentación de evidencia. Véanse [crypto de Node](https://nodejs.org/docs/latest-v24.x/api/crypto.html) y [CSRF de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## ADR-007 — Roles fijos con permisos editables protegidos

- **Fecha:** 2026-11-12.
- **Problema:** HU-02 necesita permisos verificables sin permitir que un coordinador se convierta en administrador.
- **Alternativas:** campo de texto libre `rol`; roles fijos sin capacidades; catálogo RBAC con asignaciones y protecciones.
- **Decisión:** seis roles del contrato, tablas de asignación y permisos; rol administrador protegido y conservación de administración activa. La asignación de roles requiere `roles.manage`. Un delegado con solo `users.manage` crea exclusivamente participantes y no edita cuentas con `users.manage` o `roles.manage`.
- **Justificación:** diferencia identidad, rol y autorización; permite consultar y probar cada permiso.
- **Ventajas:** mínimo privilegio y cambios centralizados.
- **Limitaciones:** la matriz inicial requiere revisión del cliente; el catálogo contiene capacidades aún sin módulo.
- **Impacto:** backend filtra tanto acciones como datos; la UI no es la barrera de seguridad. `people.manage` solo habilita selectores/listas filtradas y reducidas en V1, no mutaciones de instructores o participantes.

## ADR-008 — Validación Zod y errores JSON uniformes

- **Fecha:** 2026-11-12.
- **Problema:** entradas inválidas pueden llegar directamente a la API y los mensajes deben ser comprensibles.
- **Alternativas:** validar solo en formularios; repetir comprobaciones ad hoc en cada ruta; esquemas de entrada con reglas de servicio y restricciones SQL.
- **Decisión:** Zod con localización en español para forma y límites, servicios para reglas del caso de uso, SQL para integridad persistente; errores `{error:{message,fields?}}`.
- **Justificación:** cada capa protege una responsabilidad distinta; un correo duplicado no es el mismo problema que un JSON inválido.
- **Ventajas:** respuestas consistentes y casos negativos comprobables.
- **Limitaciones:** los mensajes deben mantenerse en español; el frontend no puede suponer que todos los errores son de campos.
- **Impacto:** respuestas apropiadas 400/401/403/404/409/422; no devolver trazas SQL al cliente.

## ADR-009 — Grafo explícito de estados, regla provisional

- **Fecha:** 2026-11-12.
- **Problema:** editar un registro no debe permitir saltos arbitrarios a finalizada ni cambios posteriores al cierre.
- **Alternativas:** permitir cualquier estado; fechas calculan todo automáticamente; grafo central de transiciones.
- **Decisión:** mapa de transiciones descrito en `ARQUITECTURA.md`; crear solo planificada/programada; finales inmutables.
- **Justificación:** permite comprobar límites y evita estados contradictorios durante la demostración.
- **Ventajas:** una regla localizada y pruebas de transiciones válidas e inválidas.
- **Limitaciones:** requiere validación cliente; reapertura y corrección histórica todavía no se resuelven.
- **Impacto:** no se afirma que State con clases esté aplicado ni que las reglas estén aprobadas por Paz Sur.

## ADR-010 — Pruebas HTTP y base aislada

- **Fecha:** 2026-11-12.
- **Problema:** demostrar persistencia, autorización y errores sin usar datos de la empresa.
- **Alternativas:** solo inspección visual; mocks de todos los componentes; API real con SQLite aislada.
- **Decisión:** Node Test Runner y Supertest con bases en memoria o temporales propias; comprobar reapertura, rollback y migraciones incrementales. Se añade Playwright para automatizar navegador Chrome con una base E2E aislada; sus resultados se registran por separado de la API.
- **Justificación:** prueba el contrato de extremo HTTP a SQL sin tocar la base de demostración.
- **Ventajas:** regresión repetible y cobertura de casos válidos, inválidos y límites.
- **Limitaciones:** no sustituye pruebas de navegador ni evaluación de carga/seguridad profesional.
- **Impacto:** registrar comandos y resultados reales; CI solo se considera ejecutada si existe un resultado verificable. El informe no declara pruebas aprobadas anticipadamente.

## ADR-011 — Rama local y revisión humana pendiente

- **Fecha:** 2026-11-12.
- **Problema:** hay ramas de integrantes y el usuario prohíbe publicar o integrar sin autorización.
- **Alternativas:** editar main; reemplazar ramas; rama de funcionalidad desde la base inspeccionada.
- **Decisión:** `feature/v1-base-funcional` desde `main` en `cf6e720`; respetar `origin/AD-1-registro-usuarios`, `origin/BrendaPro` y `origin/feature/brenda-mayhuire`. No ejecutar commit, push, merge ni tags en esta entrega sin autorización aplicable.
- **Justificación:** mantiene los cambios revisables sin atribuir trabajo a otros integrantes.
- **Ventajas:** diff claro y preservación del historial existente.
- **Limitaciones:** la integración y revisión del equipo quedan pendientes.
- **Impacto:** ramas por historia o tarea pequeña, PR con aceptación y evidencia; un incremento probado localmente todavía no cumple la DoD que exige revisión e integración.

## ADR-012 — Desarrollo iterativo con coordinación propuesta

- **Fecha:** 2026-11-12.
- **Problema:** las 28 HU son alcance candidato y no existen reglas completas validadas ni capacidad histórica comprobada.
- **Alternativas:** plan predictivo cerrado; implementar todo antes de demostrar; incrementos de dos semanas con revisión de prioridades.
- **Decisión:** propuesta Scrum para coordinación, Kanban para flujo y límites WIP, prácticas XP útiles para pruebas y refactorización.
- **Justificación:** entregar y revisar el flujo mínimo reduce incertidumbre antes de ampliar el modelo.
- **Ventajas:** objetivos verificables, visibilidad de bloqueos y posibilidad de adaptar alcance.
- **Limitaciones:** redactar un proceso no demuestra que ocurrieron Sprint Planning, Daily o Retrospective; tampoco demuestra TDD o programación en pareja.
- **Impacto:** separar propuestas de evidencia ejecutada, mantener estimaciones históricas de Jira intactas y registrar revisión humana real. Fuentes: [Scrum Guide](https://scrumguides.org/scrum-guide.html), [Kanban Guide](https://kanbanguides.org/the-kanban-guide/2025.5/) y [XP, Agile Alliance](https://agilealliance.org/glossary/xp/).

## ADR-013 — Evaluar patrones sin imponerlos

- **Fecha:** 2026-11-12.
- **Problema:** el curso estudia Strategy y Adapter, pero V1 no posee múltiples algoritmos ni un proveedor externo real.
- **Alternativas:** añadir clases sin consumidores; posponer todo diseño; evaluar y registrar condiciones de uso.
- **Decisión:** no introducir Strategy/Adapter artificiales. Reconsiderar Strategy ante políticas distintas de evaluación; Adapter al integrar un servicio externo o un segundo motor con diferencias reales.
- **Justificación:** un patrón debe reducir un problema observado.
- **Ventajas:** menos indirección y explicación académica defendible.
- **Limitaciones:** no ofrece una demostración ficticia de patrones en V1.
- **Impacto:** futuras refactorizaciones necesitan problema, referencia anterior real, cambio, regresión y resultado. No se conserva un defecto para tener algo que refactorizar.

## ADR-014 — Informe LaTeX continuo y evidencia verificable

- **Fecha:** 2026-11-12.
- **Problema:** el proyecto requiere memoria académica y el primer diagnóstico no encontró un compilador LaTeX; una comprobación posterior localizó MiKTeX. El intento real de XeLaTeX falló por ausencia de `xelatex.fmt` y no pudo completar la creación de ese formato, con la unidad del perfil sin espacio disponible.
- **Alternativas:** inventar un PDF compilado; entregar solo Markdown; mantener fuentes LaTeX y registrar la limitación de compilación.
- **Decisión:** informe con capítulos, bibliografía, bitácora, fuentes de diagramas y fragmentos importados de archivos reales; comandos de compilación local/Overleaf. Se conserva compatibilidad pdfLaTeX como alternativa y su resultado debe registrarse según ejecución real. No se declara un PDF generado mientras no exista comprobación.
- **Justificación:** documentación y código pueden revisarse conjuntamente sin falsear resultados.
- **Ventajas:** el informe referencia implementaciones existentes y deja preparado el escudo sin inventarlo.
- **Limitaciones:** validación visual del PDF pendiente si no se dispone de XeLaTeX; nombres de facultad/escuela y apellidos faltantes deben confirmar los estudiantes.
- **Impacto:** después de cambios importantes actualizar capítulos, bitácora y evidencia; no publicar datos privados ni atribuir revisiones inexistentes.
