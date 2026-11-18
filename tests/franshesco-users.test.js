import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUserService } from '../server/services/user-management.js';
import { createRoleService } from '../server/services/role-service.js';
import { createUserRepository } from '../server/repositories/user-repository.js';
import { verifyPassword } from '../server/auth/credentials.js';
import { fixture, login, userInput } from './helpers.js';

test('Fran/SRP-DIP: alta con colaboradores inyectados, sin SQLite ni Express', async () => {
  const records = new Map();
  const audit = [];
  const users = {
    find: id => records.get(id), emailExists: () => false, documentExists: () => false,
    insert(value, hash, timestamp) { assert.equal(hash, 'hash-ficticio'); assert.equal(timestamp, 'fecha-ficticia'); records.set(10, { id: 10, email: value.email }); return 10; },
    setRoles(id, roles) { records.get(id).roles = roles; },
  };
  const service = createUserService({ users, roles: {}, sessions: {}, runInTransaction: fn => fn(),
    passwordHasher: async () => 'hash-ficticio', writeAudit: (...args) => audit.push(args), clock: () => 'fecha-ficticia' });
  assert.deepEqual(await service.create(userInput({ email: 'NORMALIZADO@demo.test' }), null), { id: 10, email: 'normalizado@demo.test', roles: ['participante'] });
  assert.deepEqual(audit, [[null, 'create', 'user', 10]]);
});

test('Fran/permisos: una revocación durante el hash impide crear la cuenta', async () => {
  let actor = { id: 1, active: true, permissions: ['users.manage', 'roles.manage'] };
  let inserted = false;
  const users = { find: () => actor, insert: () => { inserted = true; } };
  const service = createUserService({ users, roles: { participantIsPrivileged: () => false }, sessions: {}, runInTransaction: fn => fn(),
    passwordHasher: async () => { actor = { ...actor, permissions: [] }; return 'hash-ficticio'; }, writeAudit() {}, clock: () => '' });
  await assert.rejects(service.create(userInput(), 1), { status: 403 });
  assert.equal(inserted, false);
});

test('Fran/permisos: revocar roles.manage durante el hash protege también una edición', async () => {
  let actor = { id: 1, active: true, permissions: ['users.manage', 'roles.manage'] };
  const target = { id: 2, active: true, permissions: ['users.manage'], roles: ['administrador'] };
  const service = createUserService({ users: { find: id => id === 1 ? actor : target }, roles: {}, sessions: {}, runInTransaction: fn => fn(),
    passwordHasher: async () => { actor = { ...actor, permissions: ['users.manage'] }; return 'hash-ficticio'; }, writeAudit() {}, clock: () => '' });
  const input = userInput(); delete input.roles;
  await assert.rejects(service.update(2, input, 1), { status: 403 });
});

test('Fran/permisos: llamar al servicio de roles directamente también exige autorización', () => {
  const service = createRoleService({ roles: { permissions: () => [{ code: 'learning.view' }] }, users: { find: () => ({ active: true, permissions: [] }) }, runInTransaction: fn => fn(), writeAudit() {} });
  assert.throws(() => service.update(2, { name: 'Intento', permissions: ['learning.view'] }, 8), { status: 403 });
});

test('Fran/usuarios: dos altas simultáneas del mismo correo crean una sola cuenta', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const create = () => admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'simultanea@demo.test', document: null }));
    const results = await Promise.all([create(), create()]);
    assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
    assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM users WHERE email='simultanea@demo.test'").get().n, 1);
    assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity='user' AND action='create'").get().n, 5);
    assert.equal(JSON.stringify(results[0].body).includes('password_hash'), false);
  } finally { context.close(); }
});

test('Fran/usuarios: fallo de auditoría revierte perfil, roles y nueva cuenta', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    context.db.exec("CREATE TRIGGER fail_user_audit BEFORE INSERT ON audit_log WHEN NEW.entity='user' AND NEW.action='create' BEGIN SELECT RAISE(ABORT,'fallo de prueba'); END");
    const original = console.error; console.error = () => {};
    try {
      const result = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput()).expect(500);
      assert.equal(result.body.error.fields, undefined);
      assert.equal(JSON.stringify(result.body).includes('fallo de prueba'), false);
    } finally { console.error = original; }
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 4);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM user_roles').get().n, 4);
  } finally { context.close(); }
});

test('Fran/rendimiento: 400 personas, página de 100 con cuatro SELECT y permisos sin duplicar', async () => {
  const context = await fixture();
  try {
    const hash = context.db.prepare('SELECT password_hash FROM users WHERE id=1').get().password_hash;
    const insert = context.db.prepare("INSERT INTO users(first_name,last_name,email,password_hash,created_at,updated_at) VALUES ('Persona','Prueba',?,?, '2026-01-01','2026-01-01')");
    for (let i = 0; i < 400; i++) {
      const id = Number(insert.run(`persona${i}@demo.test`, hash).lastInsertRowid);
      context.db.prepare("INSERT INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE code IN ('instructor','participante')").run(id);
    }
    let selects = 0;
    const repository = createUserRepository({ prepare(sql) { if (/^SELECT/i.test(sql)) selects++; return context.db.prepare(sql); } });
    const result = repository.search({ search: '', page: 1, pageSize: 100 });
    assert.equal(result.total, 404);
    assert.equal(result.rows.length, 100);
    assert.equal(selects, 4);
    for (const row of result.rows) {
      assert.equal(row.password_hash, undefined);
      assert.equal(new Set(row.permissions).size, row.permissions.length);
    }
    const multiRole = result.rows.find(row => row.roles.length === 2);
    assert.deepEqual(multiRole.roles, ['instructor', 'participante']);
  } finally { context.close(); }
});

test('Fran/auth: hashes malformados se rechazan de forma controlada', async () => {
  for (const hash of [null, '', 'scrypt$32768$8$3$invalid$' + 'a'.repeat(128), 'scrypt$32768$8$3$' + 'a'.repeat(32) + '$' + 'b'.repeat(128) + '$extra']) {
    assert.equal(await verifyPassword('clave-ficticia', hash), false);
  }
});
