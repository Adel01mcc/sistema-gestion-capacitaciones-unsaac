# Seguimiento local del Sprint - Franshesco

18/11/2026. Este tablero registra trabajo comprobado en el repositorio; no acredita
actualización de Jira, reunión, aprobación de compañeros ni cambios de prioridad.

| Tarea local | Referencia | Evidencia | Estado técnico |
|---|---|---|---|
| FRAN-01 Conservar inicio y diagnóstico | HU-01/02/16 | etiqueta punto-inicio-fran, archivos antes, README | Comprobado |
| FRAN-02 Separar usuarios y roles | HU-01/02 | validation, repositorios, user-management, role-service | Comprobado |
| FRAN-03 Separar autenticación y permisos | HU-16/02 | auth-service, policy, servicios y pruebas de revocación | Comprobado |
| FRAN-04 Eventos y bandeja interna | HU-26, soporte HU-03/04 | Observer, outbox 003, API y Notifications.tsx | Comprobado técnicamente, alcance parcial HU-26 |
| FRAN-05 Regresión y fallos | HU-01/02/16/26 | 95 pruebas backend y cinco de navegador | Aprobadas localmente |
| FRAN-06 Evidencias y exposición | Documentación | imágenes reales, manifiestos, capítulo y guion | Preparado para revisión |
| FRAN-07 Preparar entrega en rama propia | Gestión de configuración | commit con mensaje Punto final fran 1 y documentos de entrega | Preparada para publicación autorizada; revisión humana y PR pendientes |

Coordinación propuesta: Brenda revisa compatibilidad de usuarios/roles y la
bandeja mínima; Adel revisa los puntos de emisión sin sustituir sus reglas de
capacitaciones; Daniela revisa el nuevo flujo y su integración con su rama.
Estas revisiones no se registran como realizadas. No se fusionó la rama pendiente
de Daniela ni se alteró la responsabilidad de sus formularios.

El usuario autorizó el cierre con mensaje `Punto final fran 1` y publicación de
`dev/franshesco`. La referencia de entrega está en `ENTREGA.md`. Aún corresponde
comprobar la política de destinatarios con el equipo/cliente y preparar un PR
revisado. «Comprobado técnicamente» no equivale a «Hecho» según
la Definition of Done del proyecto. La funcionalidad no completa toda HU-26:
no incluye anticipación, participantes inscritos ni canales externos.
