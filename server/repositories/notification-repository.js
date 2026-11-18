// Los avisos no amplían el alcance: permisos y asignación se comprueban al leer.
const access = `EXISTS (SELECT 1 FROM user_roles ur JOIN role_permissions rp ON rp.role_id=ur.role_id
  WHERE ur.user_id=u.id AND (rp.permission_code IN ('trainings.manage','trainings.view_all')
  OR (rp.permission_code='teaching.manage' AND t.instructor_id=u.id)))`;
export function createNotificationRepository(db) {
  const own = `n.user_id=? AND u.active=1 AND (${access})`;
  const joins = 'FROM notifications n JOIN users u ON u.id=n.user_id JOIN trainings t ON t.id=n.training_id';
  return {
    recipients: trainingId => db.prepare(`SELECT u.id FROM users u JOIN trainings t ON t.id=? WHERE u.active=1 AND (${access}) ORDER BY u.id`).all(trainingId),
    insert(event, userId, title, message) {
      db.prepare('INSERT INTO notifications (event_id,user_id,training_id,title,message,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(event_id,user_id) DO NOTHING')
        .run(event.id, userId, event.training_id, title, message, event.occurred_at);
    },
    list(userId, { page, pageSize }) {
      const total = db.prepare(`SELECT COUNT(*) AS total ${joins} WHERE ${own}`).get(userId).total;
      const rows = db.prepare(`SELECT n.id,n.training_id,n.title,n.message,n.created_at,n.read_at ${joins} WHERE ${own} ORDER BY n.id DESC LIMIT ? OFFSET ?`).all(userId, pageSize, (page - 1) * pageSize);
      return { rows, total };
    },
    markRead(id, userId, timestamp) {
      return db.prepare(`UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND id IN (SELECT n.id ${joins} WHERE ${own})`).run(timestamp, id, userId).changes > 0;
    },
  };
}
