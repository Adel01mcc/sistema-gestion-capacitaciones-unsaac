import { createDatabase } from './db.js';
const db = createDatabase();
console.log('Migraciones aplicadas:', db.prepare('SELECT * FROM schema_migrations ORDER BY version').all());
db.close();
