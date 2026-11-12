import { resolve } from 'node:path';
import { createApp } from '../server/app.js';
import { createDatabase } from '../server/db.js';
import { seedDemo } from '../server/seed.js';

// This server uses an isolated, temporary database, never the user's database.
const db = createDatabase(':memory:');
await seedDemo(db, 'Pruebas-ficticias-2026!', 'admin@demo.test');
const app = createApp({ db, rateLimitEnabled: false, staticDirectory: resolve('dist') });
const server = app.listen(3101, '127.0.0.1', () => {
  console.log('Servidor E2E aislado: http://127.0.0.1:3101');
});

let closing = false;
function close() {
  if (closing) return;
  closing = true;
  server.close(() => { db.close(); });
  server.closeAllConnections();
}
process.once('SIGTERM', close);
process.once('SIGINT', close);
server.on('error', (error) => {
  console.error(error.message);
  db.close();
  process.exitCode = 1;
});
