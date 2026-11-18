// Comparaciones de código literal: git show para ANTES y archivos actuales para DESPUÉS.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { escapeHtml as escape, evidenceStyle } from './franshesco-evidence-style.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'docs/latex/imagenes/franshesco');
const evidence = join(root, 'docs/franshesco/evidencias');
const sha = data => createHash('sha256').update(data).digest('hex');
const captured = Object.fromEntries(['antes', 'despues'].map(phase => [phase, JSON.parse(readFileSync(join(evidence, `captura_${phase}.json`), 'utf8'))]));
const block = (phase, key) => ({ phase, key });
const beforeTraining = { phase: 'antes', path: 'server/services/training-service.js', start: 'export function createTraining', end: 'export function updateTraining' };
const pairs = [
  {
    key: '01_registro', title: 'Registro de usuarios', tags: ['Repository', 'SRP', 'DIP', 'Inyección de dependencias'],
    before: [block('antes', 'registro')], after: [block('despues', 'registro')],
    problem: 'createUser reunía validación, reglas, hashing y SQL en una sola función.',
    change: 'El caso de uso coordina validadores, política y repositorio. Los colaboradores se reciben por inyección.',
    proof: 'Se conserva el contrato de Brenda y la transacción perfil + roles + auditoría. Se reevalúan permisos después del await del hash.',
    focus: ['validate(', 'db.prepare(', 'parseUserInput', 'assertUserCreation', 'users.insert', 'passwordHasher'],
  },
  {
    key: '02_autenticacion', title: 'Autenticación separada de HTTP', tags: ['SRP', 'DIP', 'Servicio de aplicación'],
    before: [block('antes', 'autenticacion')], after: [block('despues', 'autenticacion')],
    problem: 'La ruta valida, limita intentos, consulta credenciales y escribe sesiones.',
    change: 'auth-service recibe repositorio, credenciales, limitador y transacción. La ruta se ocupa de HTTP y cookies.',
    proof: 'La cuenta y el hash se comprueban otra vez después de verificar la clave. Se conservan correo, cookie HttpOnly y CSRF.',
    focus: ['db.prepare(', 'validate(', 'parseLogin', 'limiter.check', 'const current', 'insertSession'],
  },
  {
    key: '03_permisos', title: 'Autorización dentro del servicio de roles', tags: ['Política de autorización', 'Repository', 'SRP', 'DIP'],
    before: [block('antes', 'permisos')], after: [block('despues', 'permisos')],
    problem: 'updateRole dependía de que la ruta hubiera autorizado al actor y mezclaba validación con SQL.',
    change: 'role-service exige roles.manage dentro de la transacción, aplica la regla del administrador y delega la persistencia.',
    proof: 'Una llamada directa sin permiso también recibe 403. La protección del rol administrador ya existía y se mantiene.',
    focus: ['db.prepare(', 'assertPermission', 'runInTransaction', 'roles.update', 'administrador'],
  },
  {
    key: '04_repository', title: 'Listado de usuarios y consultas por lotes', tags: ['Repository · acceso a datos', 'SRP', 'Eliminación de consultas por persona'],
    before: [{ phase: 'antes', path: 'server/services/user-service.js', start: 'export function listUsers', end: 'export async function createUser' }],
    after: [{ phase: 'despues', path: 'server/repositories/user-repository.js', start: '  function hydrate', end: '    emailExists:' }],
    problem: 'El servicio consulta IDs y llama a hydrateUser por cada fila; cada hidratación añade tres SELECT.',
    change: 'user-repository concentra SQL y recupera perfiles, roles y permisos por lote. El servicio recibe las filas listas.',
    proof: 'Medición registrada: página de 100 entre 404 cuentas ficticias, 302 SELECT antes y cuatro después, excluyendo autenticación. No es una prueba de carga.',
    focus: ['rows.map', 'hydrateUser', 'const ids', 'IN (', 'const total', 'const rows', 'hydrate(rows)'],
  },
  {
    key: '05_inyeccion', title: 'Dependencias explícitas y composición', tags: ['DIP · principio SOLID', 'Inyección de dependencias · técnica', 'Monolito modular por capas'],
    before: [block('antes', 'registro')],
    after: [{ phase: 'despues', path: 'server/services/user-management.js', start: 'export function createUserService', count: 1 }, { phase: 'despues', path: 'server/composition.js', start: 'export function createUserServices', end: 'export function createAuthentication' }],
    problem: 'La función anterior trabaja directamente con db, hashPassword y audit; no recibe contratos separados para cada colaborador.',
    change: 'La composición conecta adaptadores SQLite con un caso de uso que recibe las operaciones necesarias, incluido hashing, reloj y transacción.',
    proof: 'El test de alta con objetos en memoria ejecuta el servicio sin Express ni SQLite. No se añadieron interfaces vacías ni una migración de motor.',
    focus: ['db.prepare(', 'hashPassword', 'createUserService', 'dependencies', 'runInTransaction', 'passwordHasher'],
  },
  {
    key: '06_eventos', title: 'Capacitaciones publica hechos mediante un puerto', tags: ['Observer', 'Outbox transaccional', 'Inyección de dependencias'],
    before: [beforeTraining],
    after: [{ phase: 'despues', path: 'server/services/training-service.js', start: 'export function createTraining', end: 'export function updateTraining' }],
    problem: 'El servicio de Adel ya guarda capacitación y auditoría, pero no anuncia hechos para producir avisos.',
    change: 'Se inyecta events, se registra training.scheduled dentro de la transacción y se despacha sólo después del commit.',
    proof: 'La lógica de capacitaciones no importa notificaciones. Se conservan validación, repositorio y reglas de Adel. El alta sólo planificada no avisa.',
    focus: ['transaction(', 'audit(', 'events', 'return getTraining'],
  },
  {
    key: '07_observer', title: 'Observer: suscribir, publicar y consumir', tags: ['Observer · patrón de diseño', 'Publicador y suscriptores', 'Composición'],
    before: [beforeTraining],
    after: [{ phase: 'despues', path: 'server/events/observer.js', start: 'export function createObserver' }, { phase: 'despues', path: 'server/notifications/composition.js', start: '  for (const type', end: '  return {' }],
    problem: 'No existía observer.js ni bandeja de avisos. Se muestra el guardado anterior real; no se inventa una implementación previa de Observer.',
    change: 'subscribe registra consumidores por tipo; publish los invoca; la composición conecta el consumidor de avisos internos.',
    proof: 'Observer desacopla publicación y consumo. El outbox, implementado aparte, conserva el evento ante fallos. No existe envío automático por WhatsApp.',
    focus: ['subscribe(', 'listeners.get(type).add', 'return ()', 'publish(event)', 'listener(event)', 'observer.subscribe'],
  },
  {
    key: '08_outbox', title: 'Evento durable, rollback y reintento', tags: ['Transactional Outbox', 'Atomicidad', 'Idempotencia interna'],
    before: [beforeTraining],
    after: [{ phase: 'despues', path: 'server/services/training-events.js', start: 'export function createTrainingEvents' }],
    problem: 'El flujo anterior sólo confirma el guardado; no hay evento persistido que recuperar si falla un consumidor.',
    change: 'record guarda el pendiente con la capacitación. dispatch procesa avisos y marca el evento en otra transacción; el fallo lo deja pendiente.',
    proof: 'El reintento manual procesa hasta 50 pendientes. La unicidad evento/destinatario evita duplicados internos. No hay worker automático ni garantía universal para proveedores externos.',
    focus: ['runInTransaction', 'repository.find', 'observer.publish', 'repository.processed', 'catch', 'repository.failed', 'repository.insert', 'retryPending'],
  },
  {
    key: '09_errores', title: 'Errores controlados y detalles protegidos', tags: ['SRP', 'Traducción de errores de infraestructura', 'Contrato HTTP conservado'],
    before: [{ phase: 'antes', path: 'server/app.js', start: '  app.use((error', end: '  return app;' }],
    after: [{ phase: 'despues', path: 'server/errors.js', start: 'export function errorMiddleware' }],
    problem: 'El middleware incrustado en app.js busca texto UNIQUE en cualquier error y devuelve fields si está presente.',
    change: 'El manejador se extrae, traduce códigos SQLite y devuelve fields únicamente para HttpError controlados.',
    proof: 'Se conservan errores de validación y mensajes genéricos para fallos inesperados. Este cambio aplica SRP; no requiere otro patrón GoF.',
    focus: ['UNIQUE constraint failed', 'error.fields', 'error.errcode', "error.code ===", 'instanceof HttpError', 'res.status'],
  },
];

function extract(spec) {
  if (spec.key) {
    const view = captured[spec.phase].sourceViews.find(view => view.key === spec.key);
    if (!view) throw new Error(`Fragmento no encontrado: ${spec.key}`);
    spec = { ...spec, path: view.sourcePath, firstLine: view.firstLine, lastLine: view.lastLine };
  }
  const source = (spec.phase === 'antes' ? execFileSync('git', ['show', `punto-inicio-fran:${spec.path}`], { cwd: root, encoding: 'utf8' }) : readFileSync(join(root, spec.path), 'utf8')).replace(/\r\n/g, '\n');
  const lines = source.split('\n');
  const first = spec.firstLine ? spec.firstLine - 1 : lines.findIndex(line => line.includes(spec.start));
  const last = spec.lastLine || (spec.count ? first + spec.count : spec.end ? lines.findIndex((line, index) => index > first && line.includes(spec.end)) : lines.length - 1);
  if (first < 0 || last <= first) throw new Error(`Rango inválido: ${spec.path}`);
  const text = lines.slice(first, last).map((line, index) => `${String(first + index + 1).padStart(3)}  ${line}`).join('\n') + '\n';
  return { phase: spec.phase, path: spec.path, firstLine: first + 1, lastLine: last, sourceSha256LF: sha(source), text };
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const comparisons = [];
try {
  const page = await browser.newPage({ viewport: { width: 2600, height: 1100 } });
  for (const pair of pairs) {
    const before = pair.before.map(extract);
    const after = pair.after.map(extract);
    const panel = (blocks, phase) => `<section class="panel"><h2>${phase === 'antes' ? 'ANTES · Punto Inicio Fran' : 'DESPUÉS · Refactorización de Franshesco'}</h2><div class="stamp">${phase === 'antes' ? 'Etiqueta punto-inicio-fran · commit 98f8d5a' : 'Rama dev/franshesco · sobre 98f8d5a · cambios sin commit'}</div>${blocks.map(item => `<div class="file">${escape(item.path)} · líneas ${item.firstLine}–${item.lastLine} · SHA-256 LF ${item.sourceSha256LF.slice(0, 16)}…</div><pre>${item.text.trimEnd().split('\n').map(line => `<span class="line ${pair.focus.some(term => line.includes(term)) ? 'focus' : ''}">${escape(line)}</span>`).join('')}</pre>`).join('')}</section>`;
    await page.setContent(`<html lang="es"><meta charset="utf-8"><style>${evidenceStyle}body{padding:36px}h1{font-size:40px}.compare{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:stretch}.panel{background:white;border:1px solid #c5d4de;border-radius:9px;overflow:hidden}.panel h2{background:#173c4d;color:white;padding:17px 21px;margin:0;font-size:26px}.stamp{background:#e3f0eb;color:#075f54;padding:12px 21px;font-size:18px;font-weight:650}.file{background:#f1f5f8;color:#38596b;padding:12px 18px;font-size:16px;overflow-wrap:anywhere;border-top:1px solid #d2dfe6}pre{font:16px/1.65 Consolas,monospace;padding:18px;white-space:pre-wrap;overflow-wrap:anywhere}.line{min-height:1.65em}.tags{margin:14px 0 22px}.tag{display:inline-block;font-size:20px;background:#dfede9;color:#086c60;padding:7px 12px;border-radius:5px;margin:0 10px 7px 0}.notes{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:24px}.notes .note{margin:0}.note p{font-size:22px;line-height:1.55}.note h2{font-size:24px}footer{font-size:16px}</style><div class="eyebrow">PAZ SUR · COMPARACIÓN DE CÓDIGO REAL · ${escape(pair.key)}</div><h1>${escape(pair.title)}</h1><div class="tags">${pair.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('')}</div><div class="compare">${panel(before, 'antes')}${panel(after, 'despues')}</div><div class="notes"><section class="note"><h2>Situación inicial</h2><p>${escape(pair.problem)}</p></section><section class="note design"><h2>Qué se refactorizó o añadió</h2><p>${escape(pair.change)}</p></section><section class="note proof"><h2>Qué se conserva o comprueba</h2><p>${escape(pair.proof)}</p></section></div><footer>Fragmentos literales con numeración; los resaltados son anotaciones. No son capturas de VS Code. SRP/DIP son principios SOLID; inyección es una técnica; Observer es el patrón de notificaciones; Repository y outbox cumplen funciones de arquitectura diferentes. La evidencia de pruebas se consulta en docs/franshesco/.</footer></html>`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error(`Texto fuera de la lámina: ${pair.key}`);
    const filename = `comparacion_codigo_${pair.key}.png`;
    await page.screenshot({ path: join(output, filename), fullPage: true });
    comparisons.push({ key: pair.key, title: pair.title, tags: pair.tags, image: filename, sha256: sha(readFileSync(join(output, filename))), before, after, explanation: { problem: pair.problem, change: pair.change, proof: pair.proof } });
  }
  writeFileSync(join(evidence, 'comparaciones_codigo.json'), JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Antes desde git show punto-inicio-fran; después desde los archivos actuales. Fragmentos completos numerados, sin reconstrucción.', comparisons }, null, 2) + '\n');
  const visuals = JSON.parse(readFileSync(join(evidence, 'comparaciones_visuales.json'), 'utf8')).comparisons;
  writeFileSync(join(output, 'README.md'), `# Comparaciones de Franshesco

Esta carpeta contiene sólo **23 imágenes comparativas**: las 14 \`comparacion_visual_*\`
conservadas sin modificación y nueve \`comparacion_codigo_*\` que muestran el código
anterior y el refactorizado juntos. Cada lámina explica el cambio y su diseño.

## Código: antes y después en la misma imagen

| Comparación | Patrón, principio o técnica |
|---|---|
${comparisons.map(item => `| [${item.title}](${item.image}) | ${item.tags.join(' · ')} |`).join('\n')}

Antes: **Punto Inicio Fran**, etiqueta \`punto-inicio-fran\`, commit \`98f8d5a\`.
Después: rama **dev/franshesco**, cambios sin commit sobre esa base. Las láminas
identifican archivos, líneas y hashes. No se inventa código previo cuando un
módulo como Observer es nuevo: se compara con el flujo anterior de guardado real.

## Comparaciones visuales conservadas intactas

${visuals.map(item => `- [${item.title}](${item.image})`).join('\n')}

## Procedencia y regeneración

Los originales individuales se apartaron de esta carpeta para conservar la
trazabilidad en \`docs/franshesco/evidencias/archivo_png/\`; no forman parte del
conjunto final de láminas. Sus hashes y los de las 14 comparaciones conservadas
permiten comprobar que no se alteraron.

Generar las comparaciones de código: \`node scripts/compare-franshesco-code.mjs\`.
Comprobar todo: \`node scripts/verify-franshesco.mjs\`.
Manifiestos: \`comparaciones_codigo.json\`, \`comparaciones_visuales.json\` y
\`visuales_conservadas.json\` en \`docs/franshesco/evidencias/\`.
`);
  console.log(`${comparisons.length} comparaciones de código antes/después generadas; las ${visuals.length} visuales no se modificaron.`);
} finally { await browser.close(); }
