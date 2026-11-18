export function createRoleRepository(db) {
  return {
    find: id => db.prepare('SELECT * FROM roles WHERE id=?').get(id),
    permissions: () => db.prepare('SELECT * FROM permissions ORDER BY code').all(),
    list() {
      const permissions = db.prepare('SELECT role_id,permission_code FROM role_permissions ORDER BY permission_code').all();
      return db.prepare('SELECT * FROM roles ORDER BY id').all().map(role => ({ ...role, permissions: permissions.filter(item => item.role_id === role.id).map(item => item.permission_code) }));
    },
    participantIsPrivileged: () => Boolean(db.prepare("SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id WHERE r.code='participante' AND rp.permission_code IN ('users.manage','roles.manage')").get()),
    update(id, value) {
      db.prepare('UPDATE roles SET name=? WHERE id=?').run(value.name, id);
      db.prepare('DELETE FROM role_permissions WHERE role_id=?').run(id);
      for (const permission of value.permissions) db.prepare('INSERT INTO role_permissions (role_id,permission_code) VALUES (?,?)').run(id, permission);
    },
  };
}
