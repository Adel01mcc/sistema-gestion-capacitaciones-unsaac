# Guion individual — Adel

Duración prevista: 2–3 minutos. Fecha: 17/11/2026. La duración es una estimación para preparar la exposición, no una medición de una presentación realizada.

Mi responsabilidad en esta etapa fue revisar la arquitectura y refactorizar el backend de registro y edición de capacitaciones, principalmente HU-04 y el soporte de HU-03.

Partí de una versión funcional real: el commit `eb00464`. Creé la rama `feature/adel-refactor-backend` desde `main`, conservé los cambios locales de SQLite y mantuve separada la rama de Brenda. Antes de modificar el código ejecutamos las 28 pruebas existentes y todas aprobaron.

El backend ya utilizaba Express, servicios de negocio, validación con Zod y SQLite. Las rutas ya comprobaban permisos y las mutaciones tenían protección CSRF. El problema que encontré estaba dentro de `training-service.js`: el mismo archivo contenía los esquemas de entrada, las consultas SQL, las transiciones de estado y la coordinación de la transacción.

Separé la validación en `training-validation.js` y las consultas parametrizadas en `training-repository.js`. El servicio conserva la responsabilidad de coordinar el caso de uso, comprobar las reglas y guardar la capacitación y su auditoría en una misma transacción. Apliqué responsabilidad única y mejor cohesión sin añadir librerías ni clases vacías. Las rutas y el JSON consumido por el frontend se mantienen compatibles.

También comprobamos un problema de integridad: el esquema inicial comparaba fechas y horas como texto. La API rechazaba un 30 de febrero, pero una escritura SQL directa podía guardarlo. La migración 002 añade controles al insertar y modificar. Conserva las filas y los identificadores existentes; si encuentra históricos inválidos, aborta en vez de corregirlos silenciosamente. Las pruebas utilizan bases ficticias aisladas.

Evalué State. Las reglas actuales consisten en un mapa pequeño de transiciones y el bloqueo de estados terminales; no justifican una jerarquía de clases. Conservé la solución directa. Por ejemplo, pasar de planificada a programada es válido, mientras que saltar de planificada a finalizada devuelve 409. Una capacitación finalizada tampoco permite editar su título.

La regresión comprueba entradas inválidas, duplicados, registros inexistentes, transiciones, reversión si falla la auditoría y persistencia tras reabrir SQLite. La comprobación final aprobó 68 pruebas, incluidos los 25 subcasos de estados, y compiló TypeScript y Vite. Puedo mostrar el antes con `git show eb00464` y el después con `git diff` y los archivos actuales.

El informe incluye la comparación y las decisiones reales. Esta implementación fue asistida por Codex; sigue pendiente la revisión de otro integrante humano y la integración según nuestra definición de terminado.

## Apoyos para la demostración

1. Mostrar `git show eb00464:server/services/training-service.js` y los archivos nuevos de validación/repositorio.
2. Mostrar la transacción del servicio y la prueba de error de auditoría.
3. Mostrar la migración 002 y su prueba con datos ficticios.
4. Consultar el registro final en `docs/PRUEBAS.md`; mencionar únicamente los resultados allí acreditados.
5. Si se consulta la validación de interfaz: la repetición final de Playwright aprobó 4/4 y terminó con código 0; el primer intento se interrumpió tras completar casos por un cierre trabado, según el registro.

Referencias Git de apoyo: `36b2f2d` extracción del backend; `1440c84` integridad temporal; `541a3bf` regresión. El commit `63cdbd9` conserva archivos locales y retira del índice entorno/bases previamente rastreados; no limpia el historial anterior.

No presentar como aportes nuevos la autenticación, la parametrización SQL o las rutas que ya existían en `eb00464`. No afirmar revisión humana, integración o despliegue sin su evidencia.
