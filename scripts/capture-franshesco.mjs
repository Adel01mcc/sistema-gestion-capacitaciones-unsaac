// Capturas reproducibles: aplicación real, base :memory:, sin cargar .env.
// node scripts/capture-franshesco.mjs --phase antes --root .verification/franshesco/inicio
// node scripts/capture-franshesco.mjs --phase despues --root .
import { chromium, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { captureCodeEvidence } from './franshesco-code-evidence.mjs';
import { captureAccountScreens, captureTrainingScreens } from './franshesco-ui-evidence.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const phase = option('--phase', 'despues');
if (!['antes', 'despues'].includes(phase)) throw new Error('Fase inválida.');
const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(option('--root', project));
const output = resolve(project, 'docs/franshesco/evidencias/archivo_png'); mkdirSync(output, { recursive: true });
const evidence = resolve(project, 'docs/franshesco/evidencias'); mkdirSync(evidence, { recursive: true });
const load = path => import(pathToFileURL(join(root, path)).href);
const { createDatabase } = await load('server/db.js');
const { createApp } = await load('server/app.js');
const { seedDemo } = await load('server/seed.js');
const password = randomBytes(24).toString('hex');
const db = createDatabase(':memory:');
await seedDemo(db, password);
const app = createApp({ db, rateLimitEnabled: false, staticDirectory: join(root, 'dist') });
const server = app.listen(0, '127.0.0.1');
await new Promise((ok, fail) => { server.once('listening', ok); server.once('error', fail); });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const files = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'es-PE' });
  const capture = async name => {
    const path = join(output, `${name}_${phase}.png`);
    await page.screenshot({ path, fullPage: true, animations: 'disabled' }); files.push(path);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await expect(page.getByRole('heading', { name: 'Tu equipo, conectado.', exact: true })).toBeVisible();
  await capture('login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('admin@demo.test');
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'En la agenda', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('panel_movil');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await captureAccountScreens({ page, password, capture });
  if (phase === 'despues') {
    await page.getByRole('button', { name: 'Avisos', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Todavía no tienes avisos', exact: true })).toBeVisible();
    await capture('avisos_vacios');
  }
  const api = await captureTrainingScreens({ page, capture });
  if (api.createStatus !== 201 || api.updateStatus !== 200) throw new Error('La evidencia requiere operaciones reales correctas.');
  if (phase === 'antes') {
    if (api.notificationsStatus !== 404) throw new Error('La referencia anterior inesperadamente tiene avisos.');
    await expect(page.getByRole('button', { name: 'Avisos', exact: true })).toHaveCount(0);
  } else {
    if (api.notificationsStatus !== 200 || api.notifications.meta.total !== 2) throw new Error('Se esperaban dos avisos reales.');
    await page.getByRole('button', { name: 'Avisos', exact: true }).click();
    await expect(page.locator('.notification-item')).toHaveCount(2);
    await capture('avisos');
    await page.locator('.notification-item').first().getByRole('button', { name: 'Marcar como leído', exact: true }).click();
    await expect(page.locator('.notification-item').first().locator('.notification-state')).toHaveText('Leído');
    await capture('aviso_leido');
    await page.getByRole('button', { name: 'Reintentar avisos pendientes', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Eventos procesados: 0. Pendientes: 0.' })).toBeVisible();
    await capture('avisos_reintento');
    await page.setViewportSize({ width: 390, height: 844 });
    if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) throw new Error('Desbordamiento móvil.');
    await capture('avisos_movil');
  }
  const { sourceViews, revision } = await captureCodeEvidence({ phase, root, project, output, evidence, browser, files });
  const hash = db.prepare('SELECT password_hash FROM users WHERE id=1').get().password_hash;
  const insert = db.prepare("INSERT INTO users(first_name,last_name,email,password_hash,created_at,updated_at) VALUES ('Persona','Medición',?,?,'2026-01-01','2026-01-01')");
  for (let i = 0; i < 400; i++) {
    const id = Number(insert.run(`medicion${i}@demo.test`, hash).lastInsertRowid);
    db.prepare("INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE code='participante'").run(id);
  }
  let selects = 0;
  const { listUsers } = await load('server/services/user-service.js');
  const measured = listUsers({ prepare(sql) { if (/^SELECT/i.test(sql)) selects++; return db.prepare(sql); } }, { page: 1, pageSize: 100 });
  const paginationMeasurement = { fictionalUsers: measured.meta.total, pageSize: measured.data.length, selects, includesAuthentication: false };
  const manifest = { phase, capturedAt: new Date().toISOString(), revision, sourceViews, database: ':memory: (datos ficticios)', browser: await browser.version(), api, paginationMeasurement, imagesAndSources: files.map(path => ({ path: path.slice(project.length + 1).replaceAll('\\', '/'), sha256: createHash('sha256').update(readFileSync(path)).digest('hex') })) };
  writeFileSync(join(evidence, `captura_${phase}.json`), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`${phase}: ${files.length} evidencias y manifiesto verificados.`);
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise(ok => server.close(ok));
  db.close();
}
