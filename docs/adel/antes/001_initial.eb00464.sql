CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  document TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  department TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
) STRICT;
CREATE TABLE permissions (code TEXT PRIMARY KEY, name TEXT NOT NULL) STRICT;
CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
) STRICT;
CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id),
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  PRIMARY KEY (role_id, permission_code)
) STRICT;
CREATE TABLE sessions_auth (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_sessions_user ON sessions_auth(user_id);
CREATE TABLE trainings (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL CHECK (end_date >= start_date),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL CHECK (end_time > start_time),
  modality TEXT NOT NULL CHECK (modality IN ('presencial', 'virtual', 'hibrida')),
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 10000),
  status TEXT NOT NULL CHECK (status IN ('planificada', 'programada', 'en_curso', 'finalizada', 'cancelada')),
  instructor_id INTEGER REFERENCES users(id),
  responsible_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX idx_trainings_status_date ON trainings(status, start_date);
CREATE INDEX idx_trainings_instructor ON trainings(instructor_id);
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  created_at TEXT NOT NULL
) STRICT;
