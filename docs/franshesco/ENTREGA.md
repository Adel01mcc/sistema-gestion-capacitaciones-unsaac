# Entrega individual de Franshesco

Fecha: 18/11/2026, America/Lima. Rama de entrega: `dev/franshesco`.
Mensaje de commit solicitado: **Punto final fran 1**.
Repositorio: https://github.com/Adel01mcc/sistema-gestion-capacitaciones-unsaac

## Referencias y alcance

- Inicio: etiqueta anotada `punto-inicio-fran` (Punto Inicio Fran), commit `98f8d5a`.
- Cierre: commit con mensaje `Punto final fran 1`, identificado por el historial de la rama.
- Aporte: separación de usuarios, autenticación y roles; autorización y errores;
  Repository, SRP/DIP e inyección; Observer con bandeja interna y outbox recuperable.
- Se conservan contratos de Brenda y las reglas, validadores, repositorio y
  migraciones previas de Adel. No se integra automáticamente la rama de Daniela.

Publicar la rama y la etiqueta no implica fusionar con main, crear un despliegue
ni acreditar aprobación del equipo. No se registra una revisión humana inexistente.

## Documentación para revisar

- Informe individual: `output/pdf/refactorizacion-franshesco.pdf`.
- Fuente principal: `docs/latex/capitulos/09_refactorizacion_franshesco.tex`.
- Compilación individual: `docs/latex/franshesco.tex`.
- Índice de 23 láminas: `docs/latex/imagenes/franshesco/README.md`.
- Análisis técnico: `docs/franshesco/README.md`.
- Guion y seguimiento: `GUION_PROFESOR.md`, `SPRINT.md`.

Las 14 comparaciones visuales permanecen intactas. Las nueve de código comparan
fuentes reales antes/después y explican el diseño. Los rótulos «sin commit» reflejan
el momento de captura anterior al cierre; el código mostrado se vincula con las
fuentes de entrega mediante archivos, líneas y hashes.

## Verificación final ejecutada

Se usó una copia aislada de la entrega con bases ficticias, sin cargar `.env` ni
abrir la base de trabajo. Fecha y registros en `evidencias/validacion_entrega.json`
y los archivos de salida asociados.

| Control | Resultado |
|---|---|
| `npm.cmd run check` | 95 pruebas backend aprobadas, cero fallos, TypeScript y Vite correctos |
| `npm.cmd run test:ui` | Cinco escenarios Chrome aprobados |
| `node scripts/verify-franshesco.mjs` | Hashes, fragmentos y selección de imágenes comprobados |
| PDF individual | Compilado y renderizado para revisión visual |

La base inicial aprobaba 75 pruebas backend y cuatro de navegador. La medición
del listado (100 de 404 cuentas ficticias) conserva los resultados 302 frente a
cuatro SELECT, excluyendo autenticación; no es un ensayo de conexiones concurrentes.

## Comprobación después de descargar la rama

```bash
git show --no-patch punto-inicio-fran
git log -1 --format="%h %s"
npm run check
npm run test:ui
node scripts/verify-franshesco.mjs
```

Preparar dependencias y configuración local conforme al README. La cuenta existente
no cambia de contraseña por modificar `.env`; no repetir la semilla para intentar
restablecerla. Antes de aplicar migraciones sobre datos importantes, hacer un
respaldo consistente con escritores detenidos.

## Límites y revisión pendiente

HU-26 es parcial: avisos internos para gestores e instructor asignado según acceso
vigente; no hay inscritos, anticipación, correo, WhatsApp, worker ni tiempo real.
La política de destinatarios sigue pendiente de validar con Paz Sur. Se requieren
revisión humana e integración mediante Pull Request; los tests locales no cierran
por sí solos la Definition of Done.
