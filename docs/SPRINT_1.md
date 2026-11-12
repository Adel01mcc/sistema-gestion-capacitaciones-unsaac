# Planificación del Sprint 1 e hitos del producto

Fecha: **2026-11-12, America/Lima**. Plan propuesto de dos semanas, sin fechas
académicas confirmadas, velocidad histórica ni compromiso de horas del equipo.

## Referencia histórica conservada

Según el encargo, el Sprint 1 histórico de Jira contiene:

| HU | Alcance histórico referido |
| --- | --- |
| HU-01 | Registrar usuarios. |
| HU-02 | Asignar roles y permisos. |
| HU-03 | Registrar capacitación. |
| HU-04 | Modificar capacitación. |

No se consultaron claves, estimaciones, estados, fechas o responsables reales
en Jira. No se cambian ni se atribuyen estimaciones a ese registro. Los puntos
de `BACKLOG.md` son una propuesta nueva de refinamiento.

## Objetivo verificable propuesto

Un administrador inicia sesión, registra un usuario y sus roles; un usuario
autorizado crea y edita una capacitación y puede recuperar los datos guardados
después de volver a consultar. La API rechaza credenciales, permisos y datos
inválidos con mensajes comprensibles. Los datos persisten en una base local.

HU-16 se incorpora como prerrequisito técnico del objetivo; esta incorporación
no reescribe silenciosamente la referencia histórica. La semilla inicial de
administración no es autorregistro público.

## Capacidad y razonabilidad

Las cuatro historias históricas suman **18 SP propuestos** en esta nueva
estimación; HU-16 añade 5, total 23. No existe velocidad medida para afirmar
que 23 puntos caben en dos semanas. Además, esta base exige entorno,
migraciones, autenticación, pruebas y documentación, lo que aumenta el riesgo.

Ejemplo de capacidad para conversar, **no disponibilidad real**: si cada
integrante tuviera 6 horas por semana, serían 48 horas brutas en dos semanas;
reservando 25 % para coordinación/aprendizaje quedarían 36. Los puntos no se
convierten automáticamente en esas horas. Confirmar horario y habilidades en
Planning, limitar WIP y reducir alcance si es necesario.

La entrega mínima, si no cabe el objetivo completo, es sesión segura y un
registro/consulta de capacitación de extremo a extremo usando la cuenta
administradora ficticia. Los controles básicos de permiso siguen siendo
obligatorios. La gestión completa de usuarios/roles y edición que falten se
registran como pendientes; no se declaran las cuatro HU terminadas por tener
ese mínimo.

## Sprint Backlog propuesto

Los responsables son áreas de trabajo propuestas, no contribuciones ya
realizadas ni asignaciones verificadas de Jira.

| Tarea | HU | Resultado comprobable | Dependencia | Revisión humana propuesta |
| --- | --- | --- | --- | --- |
| S1-T01 Diagnóstico y contrato | Técnica | Inventario real, decisiones y límites de V1. | Inspección del clon. | Brenda. |
| S1-T02 Persistencia y semilla | 01, 03, 16 | Migración idempotente, datos ficticios y conexión verificable. | T01. | Otro integrante distinto del autor. |
| S1-T03 Autenticación | 16 | Login/me/logout, hashing, cookie y CSRF con casos negativos. | T02. | Brenda si lo implementa Adel. |
| S1-T04 Usuarios | 01 | Alta/consulta/edición con unicidad y mensajes de error. | T03. | Otro integrante. |
| S1-T05 Roles y permisos | 02 | Asignación y comprobación efectiva en servidor, admin protegido. | T03, T04. | Otro integrante. |
| S1-T06 Alta capacitación | 03 | Formulario conectado, validación y recuperación persistida. | T02, T03, permisos básicos T05. | Brenda/otro revisor sin autoría. |
| S1-T07 Edición capacitación | 04 | Actualización con validación, estados y datos previos intactos ante error. | T06. | Otro integrante. |
| S1-T08 Verificación y documentación | Todas V1 | Pruebas pertinentes, build/typecheck, trazabilidad, LaTeX y demo reproducible. | Ejecutar por cada entrega; cerrar tras T03–T07. | Equipo; aprobación real pendiente. |

## Secuencia propuesta de las dos semanas

Primera semana: confirmar alcance y entorno, construir sesión y la primera
entrega vertical de capacitación, comprobar sus validaciones y registrar la
evidencia. Segunda semana: usuarios/roles y edición según capacidad restante,
revisión, correcciones y demostración. Las capas se verifican juntas en cada
entrega; no se posterga toda la integración al último día.

## Guion de demostración del incremento

1. Instalar dependencias fijadas y preparar variables locales según README.
2. Migrar y sembrar una base de demostración con datos ficticios.
3. Iniciar el sistema e iniciar sesión con la cuenta local preparada.
4. Crear un usuario; repetir su correo y observar el rechazo sin duplicado.
5. Asignar un rol y comprobar una operación permitida y otra denegada.
6. Crear una capacitación con capacidad uno; volver a consultar y editarla.
7. Enviar fecha inválida/capacidad cero; comprobar error y datos sin corrupción.
8. Reiniciar servidor y comprobar que siguen los datos.
9. Cerrar sesión y comprobar que una ruta protegida deja de ser accesible.

Este guion es una comprobación manual pendiente hasta registrar su ejecución.
Los comandos y resultados automatizados deben constar en la evidencia real;
un guion escrito no es una prueba aprobada.

## Cierre y siguientes hitos

| Hito propuesto | Objetivo verificable de un Sprint de dos semanas | Condición antes de comenzarlo |
| --- | --- | --- |
| V1 Base funcional | Sesión, usuarios/roles y alta/edición de capacitación con persistencia. | Alcance y criterios técnicos de esta entrega; revisión de negocio pendiente. |
| V2 Mejoramiento estructural | Revisar V1, refactorizar problemas observados con regresión y completar instructor/inscripción individual respetando cupos. | Revisar V1 y validar HU-05/06/17/19; si no cabe, reducir alcance explícitamente. |
| V3 Ampliación | Registrar sesiones/asistencia y consultar un historial; añadir evaluaciones si la capacidad lo permite. | V2 verificable y reglas de asistencia/evaluación confirmadas. |
| V4 Estabilización | Integrar prioridades restantes seleccionadas, corregir defectos y ejecutar demo reproducible; certificados solo cuando corresponda. | Priorizar entre reportes, catálogos, certificados y alertas, sin prometer todo a la vez. |

Son hitos futuros, no tags creados ni versiones históricas. V2–V4 no existen
como incrementos cerrados. El cierre requiere DoD, feedback real y aprobación
para cualquier publicación o etiqueta. Si una funcionalidad se desplaza,
registrar qué quedó pendiente y por qué, sin reconstruir un pasado ficticio.
