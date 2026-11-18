-- Ampliación aditiva. No reemplaza usuarios, capacitaciones ni permisos existentes.
CREATE TABLE training_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('training.scheduled', 'training.updated')),
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  occurred_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  processed_at TEXT
) STRICT;
CREATE INDEX idx_training_events_pending ON training_events(processed_at, occurred_at);
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES training_events(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  training_id INTEGER NOT NULL REFERENCES trainings(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at TEXT,
  UNIQUE(event_id, user_id)
) STRICT;
CREATE INDEX idx_notifications_user ON notifications(user_id, id DESC);
