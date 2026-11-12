import { createApp } from './app.js';
import { createDatabase } from './db.js';

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
const db = createDatabase();
const app = createApp({ db, secureCookies: process.env.NODE_ENV === 'production' });
const server = app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Paz Sur API: http://${process.env.HOST || '127.0.0.1'}:${port}`));
server.on('error', error => { console.error(error.message); db.close(); process.exitCode = 1; });
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close(() => { db.close(); process.exit(0); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
