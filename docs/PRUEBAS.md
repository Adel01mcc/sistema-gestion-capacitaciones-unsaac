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
