# Instrucciones para trabajar en Paz Sur

## Contexto y alcance

Este repositorio contiene el Sistema de Gestión de Capacitaciones de Paz Sur,
proyecto académico de Ingeniería de Software I de la UNSAAC. Lee primero el
README, `docs/DIAGNOSTICO_INICIAL.md`, `docs/IMPLEMENTATION_CONTRACT.md`,
`docs/REQUISITOS.md`, `docs/BACKLOG.md` y la documentación del módulo afectado.
Comprueba los archivos y Git reales: un documento antiguo no prueba que exista
código, una base de datos, una rama o una aprobación.

La solicitud de 2026-11-12 autoriza construir un primer incremento funcional.
Las guías de `docs/coordinacion/` describen otro estado y contienen políticas
históricas contradictorias; consérvalas como antecedentes. No las conviertas en
un bloqueo adicional para trabajo ya autorizado ni registres revisiones humanas
que no han ocurrido. Ante una instrucción nueva del usuario, aplícala dentro de
su alcance y documenta la decisión.

## Arquitectura y cambios

- Mantén React + TypeScript + Vite en `src/`, Express en `server/`, servicios de
  negocio separados de rutas y acceso SQL parametrizado. SQLite con `node:sqlite`
  es la base del incremento local. PostgreSQL/Supabase es una alternativa futura
  que requiere una decisión y migración explícitas.
- Respeta el contrato de API de misma procedencia `/api`, su autorización en el
  servidor, sesiones con cookie HttpOnly y protección CSRF de las mutaciones.
- Relaciona cada cambio con una HU o tarea técnica. Implementa el incremento
  autorizado; las 28 historias son alcance candidato, no una promesa de cierre.
- Antes de añadir librerías o abstracciones, explica qué problema real resuelven.
  No introduzcas Strategy, Adapter u otros patrones por cumplir una lista.
- Conserva cambios de compañeros. Revisa el estado y las ramas antes de editar;
  no hagas borrados masivos, `reset --hard`, `clean`, force push, merge, push,
  etiquetas o publicación sin autorización aplicable. No inventes commits o PR.

## Verificación y documentación continua

- Explica qué cambia, por qué, cómo se ejecuta y cómo se comprueba, en español.
- Ejecuta los controles pertinentes disponibles; registra comando, fecha,
  resultado y limitaciones en la documentación de pruebas. Las pruebas usan
  datos ficticios y una base aislada, nunca la base de trabajo o producción.
- Tras cambios importantes actualiza los documentos técnicos, la trazabilidad,
  el capítulo correspondiente de `docs/latex/` y `docs/latex/bitacora.tex`.
  Incluye fragmentos reales del código o enlaces a sus fuentes.
- Registra decisiones importantes en `docs/DECISIONES_TECNICAS.md`, con
  alternativas, justificación, limitaciones e impacto.
- No declares una funcionalidad «Hecha» sin la Definition of Done de
  `docs/PROCESO_DESARROLLO.md`. Distingue comprobación automatizada, revisión
  técnica por IA, revisión humana e integración real.
- No fabriques capturas, tiempos de respuesta, reuniones, contribuciones,
  resultados, despliegues ni versiones. Si LaTeX no está disponible, conserva
  fuentes válidas y documenta cómo compilarlas; no afirmes que existe un PDF.

## Datos y seguridad

No expongas contraseñas, tokens, claves, cookies, datos personales reales o `.env`.
Mantén `.env.example` sin secretos; utiliza únicamente datos ficticios de prueba.
No incluyas archivos SQLite, WAL/SHM, dependencias o artefactos locales en commits.
No cambies autorías ni identidades Git para atribuir trabajo a otra persona.
Las decisiones de negocio no confirmadas deben identificarse como supuestos.
