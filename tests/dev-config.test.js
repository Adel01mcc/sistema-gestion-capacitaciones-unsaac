import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import configure from '../vite.config.ts';

function fixture(t, content = '') {
  const initialDirectory = process.cwd();
  const base = resolve('.verification');
  mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'dev-config-'));
  writeFileSync(join(directory, '.env'), content);
  const original = { PORT: process.env.PORT, HOST: process.env.HOST };
  delete process.env.PORT;
  delete process.env.HOST;
  process.chdir(directory);
  t.after(() => {
    process.chdir(initialDirectory);
    for (const key of ['PORT', 'HOST']) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    if (dirname(resolve(directory)) !== base) throw new Error('Directorio temporal fuera de .verification.');
    rmSync(directory, { recursive: true, force: true });
  });
  return () => configure({ command: 'serve', mode: 'development' });
}

test('Integración dev: sin configuración el proxy usa la API local predeterminada', t => {
  const configureFixture = fixture(t);
  rmSync('.env'); // Sólo el archivo de la carpeta ficticia creada por fixture.
  const config = configureFixture();
  assert.equal(config.server.proxy['/api'].target, 'http://127.0.0.1:3001');
  assert.equal(config.server.proxy['/api'].changeOrigin, false);
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 5173);
  assert.equal(config.server.strictPort, true);
});

test('Integración dev: PORT/HOST del archivo configuran el destino sin exponer secretos al cliente', t => {
  const config = fixture(t, 'PORT=3219\nHOST=localhost\nSEED_ADMIN_PASSWORD=valor-ficticio-no-exponer\n')();
  assert.equal(config.server.proxy['/api'].target, 'http://localhost:3219');
  assert.ok(!JSON.stringify(config).includes('valor-ficticio-no-exponer'));
  assert.equal(config.define, undefined);
  assert.equal(config.envPrefix, undefined);
});

test('Integración dev: el entorno del proceso prevalece sobre el archivo igual que en Node', t => {
  const configureFixture = fixture(t, 'PORT=3219\nHOST=localhost\n');
  process.env.PORT = '3220';
  process.env.HOST = '127.0.0.2';
  assert.equal(configureFixture().server.proxy['/api'].target, 'http://127.0.0.2:3220');
});

test('Integración dev: los archivos locales y por modo no sustituyen el .env que carga el backend', t => {
  const configureFixture = fixture(t, 'PORT=3219\nHOST=localhost\n');
  writeFileSync('.env.local', 'PORT=3222\nHOST=127.0.0.2\n');
  writeFileSync('.env.development', 'PORT=3223\nHOST=127.0.0.3\n');
  writeFileSync('.env.development.local', 'PORT=3224\nHOST=127.0.0.4\n');
  assert.equal(configureFixture().server.proxy['/api'].target, 'http://localhost:3219');
});

test('Integración dev: variables existentes vacías usan los mismos valores predeterminados que Node', t => {
  const configureFixture = fixture(t, 'PORT=3219\nHOST=localhost\n');
  process.env.PORT = '';
  process.env.HOST = '';
  assert.equal(configureFixture().server.proxy['/api'].target, 'http://127.0.0.1:3001');
});

test('Integración dev: los listeners comodín se conectan por loopback e IPv6 conserva su dirección', t => {
  const configureFixture = fixture(t, 'PORT=3221\n');
  for (const [host, target] of [
    ['0.0.0.0', 'http://127.0.0.1:3221'],
    ['::', 'http://[::1]:3221'],
    ['::1', 'http://[::1]:3221'],
  ]) {
    process.env.HOST = host;
    assert.equal(configureFixture().server.proxy['/api'].target, target);
  }
});

test('Integración dev: un puerto inválido falla con mensaje claro antes de iniciar Vite', t => {
  const configureFixture = fixture(t);
  for (const port of ['0', '-1', '65536', '3001.5', 'otro']) {
    process.env.PORT = port;
    assert.throws(configureFixture, /PORT debe ser un puerto válido/);
  }
});
