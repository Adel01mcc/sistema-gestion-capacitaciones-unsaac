import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { escapeHtml as escape, evidenceStyle } from './franshesco-evidence-style.mjs';

const explanations = {
  registro: {
    before: 'Una función combina validación Zod, consulta de privilegios, cálculo del hash, INSERT SQL y auditoría.',
    after: 'El caso de uso coordina validación, política, hashing y repositorio mediante colaboradores recibidos por inyección.',
    tags: ['Repository', 'SRP', 'DIP', 'Inyección de dependencias'],
    benefit: 'La persistencia cambia en el repositorio. La lógica puede probarse con objetos en memoria, sin Express ni SQLite.',
    proof: 'Se conserva el contrato del formulario de Brenda. Después del await se comprueban otra vez los permisos antes de guardar.',
    focus: ['validate(', 'db.prepare(', 'await hashPassword', 'parseUserInput', 'assertUserCreation', 'users.insert', 'passwordHasher', 'writeAudit'],
  },
  autenticacion: {
    before: 'La ruta HTTP valida credenciales, limita intentos, consulta usuarios, verifica hashes y escribe sesiones.',
    after: 'La ruta conserva cookies y HTTP. auth-service coordina autenticación; validadores, limitador y repositorio tienen módulos propios.',
    tags: ['SRP', 'DIP', 'Inyección de dependencias'],
    benefit: 'La autenticación puede verificarse con colaboradores controlados. Las sesiones siguen siendo opacas y HttpOnly.',
    proof: 'Se comprueba de nuevo que la cuenta siga activa y conserve el mismo hash después de esperar la verificación. Login sigue usando correo.',
    focus: ['validate(', 'db.prepare(', 'parseLogin', 'limiter.check', 'verifyPassword', 'const current', 'current?.active', 'insertSession'],
  },
  permisos: {
    before: 'updateRole valida y modifica roles con SQL. La autorización de esta operación depende de la ruta que lo invoca.',
    after: 'El servicio autoriza roles.manage dentro de la transacción, aplica reglas y delega la escritura al repositorio.',
    tags: ['Repository', 'SRP', 'DIP', 'Política de autorización'],
    benefit: 'La regla también protege una llamada directa al servicio. La edición conserva el bloqueo del rol administrador.',
    proof: 'users.manage y roles.manage siguen siendo permisos distintos. La prueba de autorización directa espera 403 sin escritura.',
    focus: ['db.prepare(', 'validate(', 'assertPermission', 'roles.update', 'administrador', 'runInTransaction'],
  },
  eventos: {
    before: 'El servicio de Adel ya valida, usa repositorio, controla estados y guarda auditoría. No registra ni publica eventos de avisos.',
    after: 'Se añade el puerto events. El evento se guarda con la capacitación y se publica después de que termina la transacción.',
    tags: ['Observer', 'Outbox transaccional', 'Inyección de dependencias'],
    benefit: 'Capacitaciones no importa notificaciones. Un suscriptor crea avisos internos y los pendientes pueden reintentarse sin duplicarlos.',
    proof: 'Observer desacopla publicación y consumo; outbox conserva el evento. Se mantienen las reglas de Adel y no se añade State.',
    focus: ['events', 'transaction(', 'audit(', 'return getTraining'],
  },
  observer: {
    after: 'El publicador guarda suscriptores por tipo. subscribe registra una función, publish llama a las registradas y el retorno de subscribe permite desuscribirse.',
    tags: ['Observer · patrón de diseño'],
    benefit: 'El publicador conoce funciones suscritas. La composición conecta el observador que crea avisos sin introducir ese detalle en capacitaciones.',
    proof: 'Este archivo implementa Observer. El outbox se implementa en otros módulos para conservar eventos ante fallos; son responsabilidades distintas.',
    focus: ['subscribe(', 'listeners.get(type).add', 'return ()', 'publish(event)', 'listener(event)'],
  },
};

export async function captureCodeEvidence({ phase, root, project, output, evidence, browser, files }) {
  const revision = phase === 'antes' ? execFileSync('git', ['rev-parse', 'punto-inicio-fran^{commit}'], { cwd: project, encoding: 'utf8' }).trim() : 'árbol de trabajo posterior a punto-inicio-fran (sin commit de entrega)';
  const versionLabel = phase === 'antes' ? 'Punto Inicio Fran | punto-inicio-fran | 98f8d5a' : 'Refactorización de Franshesco | dev/franshesco | sobre 98f8d5a, cambios sin commit';
  const views = phase === 'antes' ? [
    { key: 'registro', image: 'codigo', title: 'Registro de usuarios', path: 'server/services/user-service.js', start: 'export async function createUser', end: 'export async function updateUser' },
    { key: 'autenticacion', image: 'codigo_autenticacion', title: 'Autenticación', path: 'server/routes/auth.js', start: "router.post('/auth/login'", end: "router.post('/auth/logout'" },
    { key: 'permisos', image: 'codigo_permisos', title: 'Permisos de roles', path: 'server/services/user-service.js', start: 'export function updateRole' },
    { key: 'eventos', image: 'codigo_eventos', title: 'Capacitaciones y eventos', path: 'server/services/training-service.js', start: 'export function createTraining', end: 'export function dashboard' },
  ] : [
    { key: 'registro', image: 'codigo', title: 'Registro de usuarios', path: 'server/services/user-management.js', start: 'async create(input', end: 'async update(id' },
    { key: 'autenticacion', image: 'codigo_autenticacion', title: 'Autenticación', path: 'server/services/auth-service.js', start: 'async login(input', end: 'logout:' },
    { key: 'permisos', image: 'codigo_permisos', title: 'Permisos de roles', path: 'server/services/role-service.js', start: 'export function createRoleService' },
    { key: 'eventos', image: 'codigo_eventos', title: 'Capacitaciones y eventos', path: 'server/services/training-service.js', start: 'export function createTraining', end: 'export function dashboard' },
    { key: 'observer', image: 'codigo_observer', title: 'Patrón Observer · implementación real', path: 'server/events/observer.js', start: 'export function createObserver' },
  ];
  const sourceViews = [];
  for (const view of views) {
    const source = readFileSync(join(root, view.path), 'utf8').replace(/\r\n/g, '\n');
    const lines = source.split('\n');
    const start = lines.findIndex(line => line.includes(view.start));
    const end = view.end ? lines.findIndex((line, index) => index > start && line.includes(view.end)) : lines.length - 1;
    if (start < 0 || end <= start) throw new Error(`Fragmento ausente: ${view.path}`);
    const selected = lines.slice(start, end).map((line, index) => `${String(start + index + 1).padStart(3)}  ${line}`).join('\n');
    const sourceFile = join(evidence, `${view.key}_${phase}.txt`); writeFileSync(sourceFile, selected + '\n'); files.push(sourceFile);
    const explanation = explanations[view.key];
    const codeHtml = lines.slice(start, end).map((line, index) => `<span class="line ${explanation.focus.some(text => line.includes(text)) ? 'focus' : ''}"><span class="number">${String(start + index + 1).padStart(3)}  </span>${escape(line) || ' '}</span>`).join('');
    const tags = explanation.tags.map(tag => `<span class="tag">${escape(tag)}</span>`).join('');
    const codePage = await browser.newPage({ viewport: { width: 1600, height: 800 } });
    await codePage.setContent(`<html lang="es"><meta charset="utf-8"><style>${evidenceStyle}</style><div class="eyebrow">PAZ SUR · EVIDENCIA DE REFACTORIZACIÓN</div><h1>${escape(view.title)} · ${phase.toUpperCase()}</h1><div class="version">${escape(versionLabel)}</div><div class="meta">Archivo: ${escape(view.path)} · Líneas ${start + 1}–${end} · SHA-256 LF: ${createHash('sha256').update(source).digest('hex').slice(0, 16)}…</div><div class="layout"><div class="code"><div class="code-title">Código real de ${phase === 'antes' ? 'la referencia inicial' : 'la versión refactorizada'} · líneas relevantes resaltadas</div><pre>${codeHtml}</pre></div><aside><section class="note"><h2>${phase === 'antes' ? 'Situación inicial' : 'Qué se refactorizó'}</h2><p>${escape(phase === 'antes' ? explanation.before : explanation.after)}</p></section><section class="note design"><h2>${phase === 'antes' ? 'Diseño aplicado después' : 'Diseño aplicado'}</h2>${tags}<p>${escape(explanation.benefit)}</p></section><section class="note proof"><h2>Qué explicar al profesor</h2><p>${escape(explanation.proof)}</p></section></aside></div><footer>Transcripción literal del código con numeración. Los colores y notas son anotaciones explicativas; no alteran el fragmento ni representan una captura de VS Code. ${phase === 'antes' ? 'Los patrones indicados en la columna derecha corresponden a la mejora posterior.' : 'SRP y DIP son principios SOLID; la inyección es una técnica. Observer, Repository y outbox tienen funciones diferentes.'}</footer></html>`);
    const codeImage = join(output, `${view.image}_${phase}.png`);
    await codePage.screenshot({ path: codeImage, fullPage: true }); files.push(codeImage);
    await codePage.close();
    sourceViews.push({ key: view.key, sourcePath: view.path, firstLine: start + 1, lastLine: end, sourceSha256LF: createHash('sha256').update(source).digest('hex'), versionLabel, explanation });
  }
  return { sourceViews, revision };
}
