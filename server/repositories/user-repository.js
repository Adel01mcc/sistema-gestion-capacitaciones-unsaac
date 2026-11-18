import { searchPattern } from '../errors.js';

const columns = 'u.id,u.first_name,u.last_name,u.email,u.document,u.active,u.department,u.specialty,u.created_at,u.updated_at';
export function createUserRepository(db) {
  function hydrate(rows) {
    if (!rows.length) return [];
    const ids = rows.map(row => row.id);
    const placeholders = ids.map(() => '?').join(',');
    const roles = db.prepare(`SELECT ur.user_id,r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id IN (${placeholders}) ORDER BY r.code`).all(...ids);
    const permissions = db.prepare(`SELECT DISTINCT ur.user_id,rp.permission_code FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id WHERE ur.user_id IN (${placeholders}) ORDER BY rp.permission_code`).all(...ids);
    const roleMap = new Map(ids.map(id => [id, []]));
    const permissionMap = new Map(ids.map(id => [id, []]));
    for (const row of roles) roleMap.get(row.user_id).push(row.code);
    for (const row of permissions) permissionMap.get(row.user_id).push(row.permission_code);
    return rows.map(row => ({ ...row, active: Boolean(row.active), roles: roleMap.get(row.id), permissions: permissionMap.get(row.id) }));
  }
  return {
    find: id => hydrate(db.prepare(`SELECT ${columns} FROM users u WHERE u.id=?`).all(id))[0] || null,
    search({ search, role, page, pageSize }) {
      const filter = role ? ' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.code=?)' : '';
      const where = `(u.first_name LIKE ? ESCAPE '\\' OR u.last_name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')${filter}`;
      const args = [searchPattern(search), searchPattern(search), searchPattern(search), ...(role ? [role] : [])];
      const total = db.prepare(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`).get(...args).total;
      const rows = db.prepare(`SELECT ${columns} FROM users u WHERE ${where} ORDER BY u.last_name,u.first_name,u.id LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize);
      return { rows: hydrate(rows), total };
    },
    emailExists: (email, id) => Boolean(db.prepare('SELECT 1 FROM users WHERE email=? AND id<>?').get(email, id)),
    documentExists: (document, id) => Boolean(db.prepare('SELECT 1 FROM users WHERE document=? AND id<>?').get(document, id)),
    otherActiveAdmins: id => db.prepare("SELECT COUNT(*) AS total FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.active=1 AND r.code='administrador' AND u.id<>?").get(id).total,
    insert(value, hash, timestamp) {
      return Number(db.prepare('INSERT INTO users (first_name,last_name,email,document,password_hash,active,department,specialty,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(value.first_name, value.last_name, value.email, value.document, hash, Number(value.active), value.department, value.specialty, timestamp, timestamp).lastInsertRowid);
    },
    update(id, value, timestamp) {
      db.prepare('UPDATE users SET first_name=?,last_name=?,email=?,document=?,active=?,department=?,specialty=?,updated_at=? WHERE id=?')
        .run(value.first_name, value.last_name, value.email, value.document, Number(value.active), value.department, value.specialty, timestamp, id);
    },
    setPassword: (id, hash) => db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, id),
    setRoles(id, roles) {
      db.prepare('DELETE FROM user_roles WHERE user_id=?').run(id);
      for (const role of roles) db.prepare('INSERT INTO user_roles (user_id,role_id) SELECT ?,id FROM roles WHERE code=?').run(id, role);
    },
  };
}
