# Comparaciones de Franshesco

Esta carpeta contiene sólo **23 imágenes comparativas**: las 14 `comparacion_visual_*`
conservadas sin modificación y nueve `comparacion_codigo_*` que muestran el código
anterior y el refactorizado juntos. Cada lámina explica el cambio y su diseño.

## Código: antes y después en la misma imagen

| Comparación | Patrón, principio o técnica |
|---|---|
| [Registro de usuarios](comparacion_codigo_01_registro.png) | Repository · SRP · DIP · Inyección de dependencias |
| [Autenticación separada de HTTP](comparacion_codigo_02_autenticacion.png) | SRP · DIP · Servicio de aplicación |
| [Autorización dentro del servicio de roles](comparacion_codigo_03_permisos.png) | Política de autorización · Repository · SRP · DIP |
| [Listado de usuarios y consultas por lotes](comparacion_codigo_04_repository.png) | Repository · acceso a datos · SRP · Eliminación de consultas por persona |
| [Dependencias explícitas y composición](comparacion_codigo_05_inyeccion.png) | DIP · principio SOLID · Inyección de dependencias · técnica · Monolito modular por capas |
| [Capacitaciones publica hechos mediante un puerto](comparacion_codigo_06_eventos.png) | Observer · Outbox transaccional · Inyección de dependencias |
| [Observer: suscribir, publicar y consumir](comparacion_codigo_07_observer.png) | Observer · patrón de diseño · Publicador y suscriptores · Composición |
| [Evento durable, rollback y reintento](comparacion_codigo_08_outbox.png) | Transactional Outbox · Atomicidad · Idempotencia interna |
| [Errores controlados y detalles protegidos](comparacion_codigo_09_errores.png) | SRP · Traducción de errores de infraestructura · Contrato HTTP conservado |

Antes: **Punto Inicio Fran**, etiqueta `punto-inicio-fran`, commit `98f8d5a`.
Después: rama **dev/franshesco**, cambios sin commit sobre esa base. Las láminas
identifican archivos, líneas y hashes. No se inventa código previo cuando un
módulo como Observer es nuevo: se compara con el flujo anterior de guardado real.

## Comparaciones visuales conservadas intactas

- [Inicio de sesión · continuidad del acceso](comparacion_visual_01_login.png)
- [Panel general · integración con la aplicación existente](comparacion_visual_02_panel.png)
- [Directorio de usuarios · mismo contrato, persistencia separada](comparacion_visual_03_usuarios.png)
- [Registro de usuarios · formulario compatible](comparacion_visual_04_registro.png)
- [Correo duplicado · rechazo real conservado](comparacion_visual_05_duplicados.png)
- [Roles y permisos · catálogo conservado](comparacion_visual_06_roles.png)
- [Asignación de roles · separación de responsabilidades](comparacion_visual_07_asignacion.png)
- [Edición de permisos · autorización también en el servicio](comparacion_visual_08_permisos.png)
- [Programación · punto que origina el evento](comparacion_visual_09_programacion.png)
- [Capacitaciones · registro real en ambas versiones](comparacion_visual_10_capacitaciones.png)
- [Modificar una capacitación · evento de actualización](comparacion_visual_11_edicion.png)
- [Detalle de capacitación · lectura conservada](comparacion_visual_12_detalle.png)
- [Nueva capacidad · de guardar a recibir avisos](comparacion_visual_13_observer.png)
- [Acceso móvil · nueva bandeja integrada](comparacion_visual_14_movil.png)

## Procedencia y regeneración

Los originales individuales se apartaron de esta carpeta para conservar la
trazabilidad en `docs/franshesco/evidencias/archivo_png/`; no forman parte del
conjunto final de láminas. Sus hashes y los de las 14 comparaciones conservadas
permiten comprobar que no se alteraron.

Generar las comparaciones de código: `node scripts/compare-franshesco-code.mjs`.
Comprobar todo: `node scripts/verify-franshesco.mjs`.
Manifiestos: `comparaciones_codigo.json`, `comparaciones_visuales.json` y
`visuales_conservadas.json` en `docs/franshesco/evidencias/`.
