import { pathToFileURL } from 'node:url';
import { createDatabase } from './db.js';
import { createUser, passwordSchema } from './services/user-service.js';
import { createTraining } from './services/training-service.js';
import { validate } from './errors.js';
import { hydrateUser } from './security.js';

export async function seedDemo(db, password, email = 'admin@demo.test') {
  validate(passwordSchema, password);
  const fixtures = [
    { email, first_name: 'Administración', last_name: 'Demostración', roles: ['administrador'] },
    { email: 'coordinacion@demo.test', first_name: 'Coordinación', last_name: 'Demostración', roles: ['coordinador'] },
    { email: 'instructor@demo.test', first_name: 'Instructor', last_name: 'Demostración', roles: ['instructor'], specialty: 'Productos ficticios' },
    { email: 'participante@demo.test', first_name: 'Participante', last_name: 'Demostración', roles: ['participante'] },
  ];
  for (const user of fixtures) {
    if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(user.email)) await createUser(db, { ...user, password }, null);
  }
  const adminId = db.prepare('SELECT id FROM users WHERE email=?').get(email).id;
  const instructorId = db.prepare("SELECT id FROM users WHERE email='instructor@demo.test'").get().id;
  const admin = hydrateUser(db, adminId);
  const day = offset => { const date = new Date(); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); };
  for (const [code, title, offset, status] of [['DEMO-001', 'Conocimiento de productos · demostración', 7, 'planificada'], ['DEMO-002', 'Atención al cliente · demostración', 14, 'programada']]) {
    if (!db.prepare('SELECT 1 FROM trainings WHERE code=?').get(code)) createTraining(db, { code, title, description: 'Información totalmente ficticia para pruebas académicas.', start_date: day(offset), end_date: day(offset), start_time: '09:00', end_time: '11:00', modality: 'presencial', location: 'Sala ficticia de demostración', capacity: 20, status, instructor_id: instructorId }, admin);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.error('Defina SEED_ADMIN_PASSWORD en .env con al menos 12 caracteres. No existe una contraseña predeterminada.');
    process.exitCode = 1;
  } else {
    const db = createDatabase();
    try { await seedDemo(db, process.env.SEED_ADMIN_PASSWORD, process.env.SEED_ADMIN_EMAIL || 'admin@demo.test'); console.log('Datos ficticios preparados. Las cuatro cuentas usan la contraseña local indicada; las cuentas existentes no se modifican.'); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
    finally { db.close(); }
  }
}
