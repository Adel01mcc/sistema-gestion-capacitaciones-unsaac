export function insertAudit(db, userId, action, entity, entityId, timestamp) {
  db.prepare('INSERT INTO audit_log (user_id,action,entity,entity_id,created_at) VALUES (?,?,?,?,?)').run(userId, action, entity, entityId, timestamp);
}
