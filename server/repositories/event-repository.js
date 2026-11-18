export function createEventRepository(db) {
  return {
    insert(event) {
      db.prepare('INSERT INTO training_events (id,type,training_id,payload,occurred_at) VALUES (?,?,?,?,?)')
        .run(event.id, event.type, event.training_id, JSON.stringify(event.payload), event.occurred_at);
    },
    find(id) {
      const row = db.prepare('SELECT * FROM training_events WHERE id=? AND processed_at IS NULL').get(id);
      return row ? { ...row, payload: JSON.parse(row.payload) } : null;
    },
    pending: () => db.prepare('SELECT id FROM training_events WHERE processed_at IS NULL ORDER BY occurred_at,id LIMIT 50').all(),
    countPending: () => db.prepare('SELECT COUNT(*) AS total FROM training_events WHERE processed_at IS NULL').get().total,
    processed: (id, timestamp) => db.prepare('UPDATE training_events SET processed_at=?,attempts=attempts+1 WHERE id=?').run(timestamp, id),
    failed: id => db.prepare('UPDATE training_events SET attempts=attempts+1 WHERE id=? AND processed_at IS NULL').run(id),
  };
}
