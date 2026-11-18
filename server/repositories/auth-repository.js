export function createAuthRepository(db) {
  return {
    credentials: email => db.prepare('SELECT id,password_hash,active FROM users WHERE email=?').get(email),
    session: (hash, timestamp) => db.prepare('SELECT * FROM sessions_auth WHERE token_hash=? AND expires_at>?').get(hash, timestamp),
    revoke: hash => db.prepare('DELETE FROM sessions_auth WHERE token_hash=?').run(hash),
    revokeUser: id => db.prepare('DELETE FROM sessions_auth WHERE user_id=?').run(id),
    deleteExpired: timestamp => db.prepare('DELETE FROM sessions_auth WHERE expires_at<=?').run(timestamp),
    insertSession({ tokenHash, userId, csrfToken, expiresAt }) {
      db.prepare('INSERT INTO sessions_auth (token_hash,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run(tokenHash, userId, csrfToken, expiresAt);
    },
  };
}
