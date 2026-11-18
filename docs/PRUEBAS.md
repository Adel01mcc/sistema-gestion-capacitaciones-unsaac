# Evidencia de comprobación — 2026-11-12 (America/Lima)

Entorno: Windows, Node24.16.0, npm11.13.0, SQLite3.53.0. Datos ficticios, bases en memoria y archivos temporales propios en `.verification/`; no se usa la base de demostración del usuario para pruebas. Registro de una ejecución local asistida por IA; **revisión humana, aceptación de Paz Sur, integración y CI remota pendientes**.

## Comandos y resultados observados

| Comando | Resultado real |
|---|---|
| `node --version`, `npm.cmd --version` | v24.16.0 y11.13.0 |
| Prueba directa `DatabaseSync(':memory:')` | SQLite3.53.0, abre/consulta/cierra |
| `npm.cmd install --cache .npm-cache --fetch-timeout=30000 --fetch-retries=1` |129 paquetes; auditoría npm:0 vulnerabilidades |
| `npm.cmd install --save-dev --save-exact @playwright/test --cache .npm-cache ...` |3 paquetes más,133 auditados;0 vulnerabilidades reportadas. No sustituye una auditoría de seguridad |
| `npm.cmd test` (primera ejecución) |23 aprobadas,0 fallidas,10.80s |
| `npm.cmd test` (regresiones intermedias) |26 aprobadas en12.61s;27 aprobadas en12.34s;0 fallidas |
| `npm.cmd run check` (final) |**28 pruebas aprobadas,0 fallidas**,12.52s; TypeScript y build Vite aprobados |
| `npm.cmd run build` (inicial) |Falló TS2882 por declaración del import CSS; se añadió `src/vite-env.d.ts` |
| `npm.cmd run build` (final, dentro de check) |**TypeScript y Vite aprobados**,22 módulos; CSS32.18kB y JS264.10kB antes de gzip |
| `npm.cmd run test:ui` (final) |**4 aprobadas,0 fallidas**,9.0s; Chrome real instalado, modo headless, servidor/base aislados |
| `npm.cmd run dev` y peticiones HTML/health/proxy |Vite listo en232ms; interfaz5173, API3001 y health mediante proxy:200. Base aislada `.verification/dev-smoke.sqlite` |
| `xelatex --disable-installer -interaction=nonstopmode -halt-on-error main.tex` |Falló código1: falta `xelatex.fmt` y su generación no se completó |
| `pdflatex --disable-installer -interaction=nonstopmode -halt-on-error main.tex` (primer intento) |Llegó al capítulo5; detectó conflicto Babel con `>=Latex` de TikZ. Se corrigió cargando biblioteca babel; se repite la compilación |
| `pdflatex` tras corrección Babel |Recorrió informe y anexos; falló al generar fuente bitmap en MiKTeX. Se cambió a Latin Modern vectorial |
| `pdflatex`, `bibtex main`, dos pasadas posteriores de `pdflatex` |**PDF A4 de50 páginas generado**, sin referencias/citas indefinidas ni cajas Overfull en la pasada revisada; quedan advertencias menores de sustitución tipográfica y cajas Underfull |

El análisis de tipos se ejecutó como primer paso de `build` (`tsc --noEmit`); no se presenta el script `typecheck` como ejecución separada. Los resultados posteriores de PDF/capturas se incorporan al cierre de esta página.

## Cobertura ejecutada de API y persistencia

`tests/api.test.js` contiene12 pruebas: sesión/health, registro con hash y auditoría, duplicados sin efectos parciales, campos/roles inválidos, búsqueda literal y paginación, edición/asignación, último administrador, alta/consulta/edición de capacitación, restricciones de cupo/fecha/horario/instructor, transiciones, filtros/dashboard y frontera de fecha en Lima. Incluye regresión de filtros vacíos que envía la interfaz.

`tests/security.test.js` contiene13 pruebas: cookie HttpOnly/SameSite, token almacenado con hash, credenciales genéricas, sesión obligatoria, CSRF ausente/ajeno/Unicode, JSON/formato/tamaño/inyección, permisos de coordinador, alcance de instructor/participante, actualización efectiva de permisos, prevención de escalamiento por users.manage delegado y por privilegios indirectos de participante, revocación por contraseña/inactividad, logout/vencimiento, límite de intentos y prevención de su reinicio mediante login correcto. Algunos escenarios se agrupan en la misma prueba; el número de solicitudes HTTP es mayor.

`tests/persistence.test.js` contiene3 pruebas: semilla y migración repetibles con reapertura de archivo, rollback y claves foráneas, segunda migración sin reinsertar catálogos ni sobrescribir personalizaciones. También se comprueba el CHECK SQL de capacidad cero. Las bases temporales se eliminan sólo tras verificar que el destino está dentro de `.verification/`.

## Navegador y capturas reales

`tests/ui.spec.ts`, Playwright1.65.0, Chrome del sistema. Cuatro escenarios: credenciales erróneas/login/logout y cookie HttpOnly; panel escritorio1440×900 y móvil390×844 con menú y control de desbordamiento; alta/edición/duplicado de usuario; validación de horario y alta/edición/detalle de capacitación. No hay interceptores que simulen éxito de guardado.

Las capturas `docs/evidencias/v1-escritorio.png` y `v1-movil.png` se obtuvieron de esta aplicación mediante `page.screenshot`, con datos ficticios del servidor de pruebas. No son imágenes generadas ni evidencia de una revisión humana. Se corrigió la captura durante una transición CSS y se ajustaron los títulos que se recortaban en390px; la prueba final comprueba sus límites visibles y la ausencia de desbordamiento antes de tomar la captura estable.

Para repetir: `npm.cmd ci`, `npm.cmd run build`, `npm.cmd run test:ui`. El navegador Chrome debe estar instalado. No se descargó un navegador adicional ni se modificó su instalación. Los perfiles temporales se dirigen a `.verification/browser-tmp` para evitar C: lleno. El servidor de E2E en3101 usa SQLite en memoria y se detiene al terminar.

## Defectos detectados y corregidos

| Problema observado | Corrección | Evidencia de regresión |
|---|---|---|
| TypeScript no reconocía import CSS |Tipos de cliente Vite |build aprobado |
| Logout enviaba POST sin JSON |Cuerpo `{}` y content-type |Escenario UI de login/logout |
| Filtros vacíos chocaban con enum/fecha |Vacío equivale a filtro omitido |API y listados UI |
| Segunda migración reinserta catálogo |Carga inicial sólo con001 |Prueba incremental con002 aislada |
| users.manage delegado podía elevar roles |roles.manage obligatorio y protección de cuentas privilegiadas |Regresión de escalamiento |
| CSRF Unicode podía causar500 por tamaño de buffer |Validar formato de64 dígitos hex antes de comparación |CSRF Unicode devuelve403 |
| Agenda comparaba fechas UTC |Fecha de negocio America/Lima |Prueba con reloj fijo:21enero02:00UTC conserva actividades del20enero en Lima |
| Login correcto reiniciaba límite porIP |Conservar bucket hasta vencimiento |Prueba de alternar fallos y login correcto |
| Mensajes de Zod por defecto en inglés |Locale española global |Validación inválida observada y revisión de configuración |

Estos ajustes pertenecen a la construcción de V1; no se inventa una V2 histórica ni commits previos de refactorización.

## Límites y revisión pendiente

- Las84 especificaciones de casos CP del backlog están diseñadas; no son84 ejecuciones automatizadas. El alcance posterior no se certifica con las32 pruebas de V1.
- No se ejecutaron pruebas de PostgreSQL, carga, concurrencia de inscripciones, accesibilidad integral, entrega de alertas ni certificados: esas funciones no están implementadas.
- Workflow de GitHub Actions preparado para `npm ci` y `npm run check`, sin ejecución remota acreditada.
- C: reportó cero bytes libres; el ejecutor aislado falló con error112. Los comandos autorizados fuera del aislamiento funcionaron. No se borraron archivos del usuario ni se cambió la configuración global.
- La revisión de agentes detectó fallos y motivó correcciones, pero no reemplaza revisión de compañeros ni aprobación del cliente.

Protocolo humano propuesto: seguir el README, registrar una identidad ficticia y una capacitación, repetir el correo, probar cupo cero, reiniciar y recuperar registros; comparar permisos con coordinador/instructor. Anotar fecha, resultado y observaciones antes de aprobar e integrar.

## Cierre del informe y del entorno

`docs/latex/main.pdf`: 50 páginas A4, 674909 bytes. SHA-256: `DB4F0F531C8E0C206C21F8E838C9E85B64F527C260BD10456A2BD12792469EAD`.

Se renderizaron las 50 páginas con Poppler y se inspeccionaron en hojas de contacto. Tras ajustes finales, Poppler se interrumpió en este equipo; se instaló PyMuPDF 1.24.14 únicamente en `.verification/python`, con temporales en D:, y se renderizaron de nuevo las **50 páginas definitivas**. Se comprobó además por extracción de texto que la tabla contiene las 28 pruebas aprobadas. La primera descarga del renderizador alternativo falló por temporales en C:; se completó al dirigirlos a D:.

Se revisaron a mayor tamaño portada, arquitectura/estados, tabla de evidencia y bitácora. Se corrigió un salto de párrafo que situaba el título junto al espacio del escudo. Las tablas y diagramas revisados son legibles y no presentan solapamientos ni texto cortado. Las advertencias restantes de sustitución de fuente y Underfull no impidieron compilar; no hay citas/referencias indefinidas ni Overfull en la última pasada. Las fuentes Mermaid se entregan sin certificación de renderizado por un motor Mermaid. La herramienta de revisión PDF no es una dependencia de la aplicación.

Se ejecutó `docs/latex/preparar-overleaf.ps1`: copias actuales de tres archivos reales de código,11 fuentes Mermaid y dos capturas, con manifiesto `FUENTES_SHA256.txt`. El informe puede prepararse como proyecto autónomo en Overleaf; no se subió a ese servicio.

`git diff --check` terminó sin errores. El diff de `docs/coordinacion/` y `docs/IMPLEMENTATION_CONTRACT.md` quedó vacío. Se comprobaron los puertos3001,3101 y5173 sin procesos escuchando después de detener los servidores propios de verificación. No hubo commit, staging, push, merge, tag ni despliegue.

## Segunda etapa de Adel — 17 de noviembre de 2026

Fecha de las ejecuciones: **2026-11-17, America/Lima**. Referencia inicial real `eb004641b114d8c71f86af08b05f0f9e073baf73`; rama `feature/adel-refactor-backend` desde `main`. Esta entrada conserva el registro histórico anterior y documenta únicamente la refactorización HU-04, soporte HU-03 e integridad temporal. No modifica las historias ni acredita revisión humana, CI remota o integración.

Las pruebas utilizan SQLite en memoria o archivos ficticios propios en `.verification/`; no leen `.env`, no utilizan `DATABASE_PATH` ni abren la base de trabajo. Se conservan Node Test Runner, Supertest, Zod, TypeScript, Vite y Playwright existentes; no se añade una dependencia para esta refactorización.

### Comandos y resultados reales

| Comando o comprobación | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| `npm.cmd test`, antes de modificar | Conocer la regresión de la referencia funcional | 28 pruebas aprobadas, 0 fallos | Aprobada |
| `node --test --test-concurrency=1 tests/trainings.test.js`, antes de extraer módulos | Caracterizar alta, edición y contrato existente | 35 pruebas aprobadas: 10 de primer nivel y 25 subcasos de estados | Aprobada; ejecución focal |
| `node --test --test-concurrency=1 tests/training-migration.test.js tests/persistence.test.js` | Migración segura y persistencia sin pérdida | 8 aprobadas, 0 fallos; código de salida 0 | Aprobada; ejecución focal |
| `npm.cmd run check`, después de refactorizar | Suite completa, tipos y build sin errores | 68 aprobadas: 43 de primer nivel y 25 subcasos; 0 fallos; TypeScript y Vite correctos; código 0 | Aprobada |
| `node --test --test-concurrency=1 tests/trainings.test.js tests/security.test.js`, agente revisor IA | Detectar regresiones de contrato, acceso o transacción | 48/48 aprobadas; código 0; revisión técnica sin hallazgos bloqueantes | Aprobada; revisión IA, no humana |
| `npm.cmd run test:ui`, primer intento | Completar cuatro casos de navegador y cerrar runner | Cuatro casos marcados `ok`, pero cierre trabado; runner interrumpido con código 1 | Casos completados; comando sin éxito final |
| `npm.cmd run test:ui`, repetición con permisos ampliados | Repetir y acreditar terminación del runner | 4 aprobadas en 8,7 s; código de salida 0 | Aprobada |
| `Get-Command` y búsqueda en ubicaciones MiKTeX/registro Windows | Localizar compilador disponible para actualizar el informe | No se encontró compilador en PATH ni en las ubicaciones consultadas | Compilación LaTeX no ejecutada |
| `powershell -NoProfile -File .\docs\latex\preparar-overleaf.ps1` | Preparar fuentes autónomas y copias reales de código para Overleaf | Finalizó con código 0; capítulo individual y fuentes reales disponibles | Preparación aprobada; no compilación PDF |

El build informó una advertencia de tamaño del paquete JavaScript de **504,11 kB**. No bloqueó TypeScript ni Vite. El diff no cambia fuentes frontend ni dependencias; no se ejecutó un build previo al refactor para comparar esa advertencia. No se presenta como una medición de tiempo de respuesta ni como un defecto nuevo corregido.

### Casos relevantes comprobados

| Prueba | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| POST/PUT con cada campo obligatorio ausente | 422 con campo de error, sin alta/edición/auditoría parcial | El registro y los conteos conservan el estado anterior | Aprobada |
| Calendario, años bisiestos y horarios límite | Aceptar fechas reales y horario válido; rechazar fechas/formatos/intervalos inválidos | API conserva respuesta válida y rechaza inválidos con 422 sin efectos | Aprobada |
| GET/PUT inexistentes o identificadores inválidos | Distinguir 404 de 422 sin cambios persistentes | Códigos y ausencia de mutaciones comprobados | Aprobada |
| PUT realizado por otro gestor | Actualizar campos permitidos y conservar ID, responsable original y creación | Detalle recuperado coincide con respuesta de edición; auditoría identifica al gestor | Aprobada |
| Código duplicado en edición sin distinguir mayúsculas | 409 y ninguna modificación parcial | Fila y auditoría inalteradas | Aprobada |
| Matriz de estados | Cumplir grafo en los 25 pares y bloquear toda edición terminal | Transiciones aceptadas y rechazos 409 coinciden con expectativas explícitas | Aprobada |
| Fallo de auditoría forzado por trigger en base ficticia | 500 genérico y rollback completo de POST/PUT | No queda alta, edición ni auditoría parcial; detalle interno no aparece en respuesta | Aprobada |
| Edición seguida de reapertura de SQLite y aplicación | Conservar modificación y eventos de auditoría | GET posterior devuelve exactamente la edición persistida | Aprobada |
| Filtros literales, paginación y fechas inclusivas | Mantener `{data,meta}` y alcance sin interpretar texto del cliente como SQL | Coincidencias, páginas y campos del contrato comprobados | Aprobada |
| Migración desde 001 | Mantener filas, IDs, auditoría, personalizaciones y claves foráneas; reapertura idempotente | Conservación verificada y 002 registrada una vez | Aprobada |
| INSERT/UPDATE SQL directo temporalmente inválido | Rechazar fecha inexistente u hora fuera de formato | Triggers abortan la escritura; la fila anterior permanece | Aprobada |
| Migración con histórico inválido | Abortar 002 y conservar datos para decisión explícita | No registra 002 ni crea sus triggers; filas intactas | Aprobada |
| Reversión y reaplicación de 002 | Eliminar sólo controles nuevos y su versión, sin pérdida de datos | Reversión, rollback de reversión fallida y reaplicación comprobados | Aprobada |

Las 68 pruebas incluyen subcasos; no representan 68 historias ni una correspondencia uno a uno con los casos CP del backlog. La matriz de estados utiliza expectativas explícitas, sin importar `TRANSITIONS` como oráculo. Las pruebas de error de auditoría son deliberadas y no indican un fallo inesperado de la ejecución.

### Navegador, capturas y LaTeX

La ejecución de Playwright completó los cuatro escenarios existentes: autenticación; adaptación escritorio/móvil; usuarios; validación, registro y edición de capacitación. El primer runner quedó trabado después de marcar cuatro casos `ok` y se interrumpió con código 1; no se presenta como comando aprobado. La repetición con permisos ampliados terminó correctamente: **4 aprobadas en 8,7 s y código de salida 0**. La limitación observada fue el cierre del proceso del primer intento, no una prueba de interfaz fallida.

Las capturas generadas por esa prueba cambiaron inicialmente `docs/evidencias/v1-escritorio.png` y `v1-movil.png`. Se conservaron las nuevas en `.verification/adel-ui/` y se restauraron los archivos versionados exactamente desde `eb00464`, para no reemplazar evidencia histórica ni incorporar cambios ajenos. La carpeta `.verification/` no se versiona.

No se encontró compilador LaTeX en PATH, ubicaciones MiKTeX consultadas ni registro Windows. No se generó un PDF de esta segunda etapa. `docs/latex/main.pdf` ya estaba en `eb00464`; los datos y la revisión visual descritos en el registro del 12/11 pertenecen a ese informe previo. Las fuentes nuevas están en `docs/latex/capitulos/09_refactorizacion_adel.tex`; el procedimiento de preparación y compilación en Overleaf está en `docs/latex/README.md`. No se afirma revisión visual del capítulo sin renderizado.

### Seguridad del seguimiento Git y límites

Se detectó por nombres del índice que `.env` y los tres archivos SQLite/WAL/SHM ya estaban rastreados en la referencia inicial, a pesar de `.gitignore`. Se retiraron del índice conservando los archivos locales y sus cambios, en el commit real **`63cdbd9`**, `chore(security): excluir entorno y bases locales del seguimiento`. Se verificó su presencia en disco; no se leyeron contenidos de `.env` ni de la base de trabajo. El historial anterior y su copia remota siguen conteniendo esos archivos: esta acción no sanea historia ni acredita revocación de credenciales.

La revisión técnica asistida por IA y las pruebas automatizadas no sustituyen revisión de un compañero humano ni validación de las reglas por Paz Sur. Quedan pendientes revisión humana, validación comercial, integración real y aplicación controlada de 002 a cualquier base propia. No se ejecutaron pruebas de nuevos módulos fuera de HU-03/HU-04, ni se atribuye una ejecución remota de CI a los controles locales.

Commits reales de esta etapa ya creados: `63cdbd9` (seguridad), `36b2f2d` (extracción del backend), `1440c84` (migración temporal y sus pruebas) y `541a3bf` (regresión de API). El commit documental se registra fuera de sí mismo para evitar una referencia circular. La publicación y el PR sólo se acreditarán con sus resultados reales.

Comprobación documental final (17/11/2026): `git diff --check` terminó sin errores. Un script local de verificación en `.verification/verificar-entrega.mjs` comprobó 13 inclusiones LaTeX presentes, seis copias de fuentes idénticas a `server/` y ausencia de `.env`/SQLite en el índice; terminó con código 0. Las dos copias del antes en `docs/adel/antes/` se compararon byte a byte con `git show eb00464:<ruta>`; coincidieron. El diff exportado y sus hashes están en `docs/adel/ANTES_DESPUES.diff` y `EVIDENCIAS_SHA256.txt`. Estos controles no sustituyen compilación ni revisión visual de PDF.

## Arranque conjunto solicitado — 17/11/2026, America/Lima

Tarea técnica RNF-06/07/10 y soporte transversal HU-01/02/03/04/16. La solicitud posterior autoriza ejecutar los componentes juntos. Se añade `npm.cmd run local` (build seguido de start), se alinea el proxy de Vite con HOST/PORT del proceso o exclusivamente de `.env`, y se deja sin contraseña el archivo de ejemplo. La configuración privada existente no se cambió ni se imprimió; una comprobación sólo informó si la contraseña de semilla cumplía sus reglas, sin revelar su valor.

Antes de arrancar sobre la base existente se ejecutó `node --env-file-if-exists=.env .verification/respaldar-local.mjs`, utilizando `backup` de `node:sqlite` con conexión origen de sólo lectura. Se creó el respaldo consistente `.verification/backups/paz-sur-pre-arranque-2026-11-18T04-19-01-225Z.sqlite`; el nombre registra UTC, correspondiente al 17/11 en Lima. Es un archivo local ignorado, sin contenido publicado. La aplicación abrió la base mediante sus migraciones habituales, sin reinicializarla, ejecutar la semilla ni cambiar contraseñas. Esto es una operación local solicitada; las pruebas automatizadas siguientes utilizan sus propias bases y archivos ficticios.

| Comando/comprobación | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- |
| `npm.cmd run local` | Compilar y mantener web/API/SQLite disponibles bajo la misma procedencia | Build correcto y servidor iniciado en `http://127.0.0.1:3001` | Activo al cerrar la sesión de trabajo |
| `node .verification/comprobar-disponibilidad.mjs` | Disponibilidad de web, health y recursos compilados, sin mutaciones de negocio | Web 200; `/api/health` 200, SQLite; dos recursos compilados con 200 | Aprobada, comprobación operativa de lectura |
| `node --test --test-concurrency=1 tests/dev-config.test.js` | Destino coherente con backend sin exponer secretos | 7/7; ausencia de archivo, precedencia del proceso, vacíos, archivos por modo ignorados, puerto inválido y destinos IPv6/comodín | Aprobada; fixtures aisladas |
| `npm.cmd run check` | Suite completa y build sin errores | 75/75, incluidos 25 subcasos; TypeScript/Vite correctos; código 0 | Aprobada |
| `npm.cmd run test:ui` | Login/logout, panel, usuarios y registro/edición de capacitación completos | 4/4, código 0, servidor y base ficticia aislados en 3101 | Aprobada |

El build conserva la advertencia del bundle de 504,11 kB; las fuentes frontend no cambiaron. Las nuevas capturas se conservan en `.verification/arranque-ui/`; las históricas se restauran desde Git. El servidor local en 3001 se mantiene separado de las pruebas en 3101. No se fusionan ramas ni se presenta el arranque como despliegue o revisión humana. No se compiló un nuevo PDF LaTeX.
# Verificación de Franshesco - 18/11/2026

Referencia inicial: `punto-inicio-fran`, commit `98f8d5a`, con Brenda y Adel ya
integrados. `npm.cmd run check` en copia aislada: 75/75 pruebas, TypeScript y Vite
correctos. `npm.cmd run test:ui`: 4/4 escenarios, código 0.

Después de refactorizar: `npm.cmd run check`, 95/95 (70 pruebas de primer nivel y
25 subcasos), cero fallos, tipos/build correctos, código 0. Las 20 pruebas propias
están en `tests/franshesco-{users,auth,events}.test.js`. Incluyen inyección de
dependencias, registro simultáneo sin duplicado, permisos revocados durante
hashing, autorización directa, rollback, lotes, errores y eventos/avisos.

`npm.cmd run build` y `npm.cmd run test:ui` en una copia aislada actual: cinco
escenarios correctos, código 0; se preservaron las capturas históricas originales.
El nuevo escenario verifica programación real, aviso, marcado, persistencia al
recargar y ancho móvil. La migración 003 conserva datos ficticios y recupera un
evento pendiente después de reabrir SQLite, sin duplicar avisos.

Captura comparativa ejecutada con `scripts/capture-franshesco.mjs`: antes la ruta
de avisos responde 404; después responde 200 y devuelve dos avisos tras programar
y modificar. Medición de página 100/404: 302 SELECT antes, cuatro después,
excluyendo autenticación; no es una prueba de 400 conexiones simultáneas.
Metadatos y SHA-256: `docs/franshesco/evidencias/`. Verificación reproducible:
`node scripts/verify-franshesco.mjs`.

Build aislado sin `.env`: 266,99 kB JS. Build en raíz con el entorno local
development: 508,76 kB y advertencia de tamaño sin fallo. No se alteró `.env` ni
se ejecutaron pruebas contra la base de trabajo. No se acredita revisión humana,
cliente, despliegue ni ejecución remota de CI por estos resultados locales.

## Revisión posterior de imágenes de Franshesco

Se regeneraron las imágenes de código con notas de refactorización, principios y
patrones, líneas resaltadas y referencias de versión; se añadió el código real
Observer. Nueve fragmentos son transcripciones literales verificables.
Se ejecutaron los recorridos de captura en ambas versiones con Chrome, API y
SQLite en memoria: registro duplicado 409, creación programada 201, modificación
200; avisos 404 antes y 200 después con dos mensajes. También marcado como leído,
reintento con cero pendientes y vistas móviles. Se conservaron los formularios de
los compañeros y no se modificó código del producto en esta revisión.

Resultado gráfico: 33 capturas originales, nueve imágenes de código explicado y
14 láminas comparativas (56 PNG). Las láminas conservan sus capturas de origen y
las anotaciones se ubican fuera de la interfaz. Manifiestos por fase y
comparaciones_visuales.json con SHA-256; comprobación reproducible mediante
node scripts/verify-franshesco.mjs. Índice en
docs/latex/imagenes/franshesco/README.md. PDF individual recompilado y revisión
visual realizada sobre su renderizado. Los resultados 95/95 y 5/5 anteriores
corresponden a la implementación; no se atribuyen como una nueva ejecución aquí.

## Selección final de imágenes solicitada

La carpeta de Franshesco conserva 14 comparacion_visual_* con los mismos hashes
anteriores y contiene nueve comparacion_codigo_* nuevas: cada una reúne código
anterior y refactorizado con sus versiones y explicación del diseño. Los 42 PNG
individuales anteriores se apartaron a docs/franshesco/evidencias/archivo_png/ para
conservar su procedencia, sin mezclarlos con las láminas finales. Se actualizaron
las rutas de manifiestos e informe. El verificador compara archivos originales,
fragmentos literales de Git/árbol actual y hashes de las 14 visuales intactas.
No se modificó el código del producto ni se atribuye una nueva ejecución de la
suite backend a esta reorganización de documentación.

## Cierre de Franshesco — Punto final fran 1

18/11/2026, America/Lima. Se volvió a ejecutar la verificación sobre una copia
actual de la entrega, sin `.env` ni datos de trabajo. `npm.cmd run check`:
95/95 pruebas backend, cero fallos, TypeScript y Vite correctos, código 0.
`npm.cmd run test:ui`: cinco escenarios aprobados, código 0. Salidas preservadas
en `docs/franshesco/evidencias/validacion_*_entrega.txt` y resumen estructurado
en `validacion_entrega.json`. Las advertencias de color del navegador no cambian
el resultado de salida.

Se revisaron las 23 láminas contra código y manifiestos. Las 14 visuales permanecen
intactas y los 29 fragmentos literales de los manifiestos coinciden con la
referencia inicial o los archivos de entrega. El informe individual se reorganizó
por problema, solución, diseño y comprobación, con alcance parcial de HU-26 y
contribuciones de compañeros diferenciadas. Las imágenes conservan sus rótulos
históricos anteriores al commit; la entrega se identifica por el mensaje
`Punto final fran 1`. No se acredita revisión humana ni integración por PR.
