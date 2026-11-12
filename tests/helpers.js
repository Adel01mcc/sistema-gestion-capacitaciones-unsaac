import request from 'supertest';
import { createDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
import { seedDemo } from '../server/seed.js';

export const demoPassword = 'Pruebas-ficticias-2026!';
export async function fixture(options = {}) {
  const db = createDatabase(':memory:');
  await seedDemo(db, demoPassword);
  const app = createApp({ db, rateLimitEnabled: false, ...options });
  return { db, app, close: () => db.close() };
}
export async function login(app, email = 'admin@demo.test', password = demoPassword) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email, password }).expect(200);
  const csrf = response.body.data.csrfToken;
  return { agent, csrf, user: response.body.data.user, response };
}
export const userInput = (overrides = {}) => ({ first_name: 'Persona', last_name: 'Ficticia', email: 'nueva@demo.test', document: 'FICTICIO-001', department: 'Área de prueba', specialty: '', active: true, password: demoPassword, roles: ['participante'], ...overrides });
export const trainingInput = (overrides = {}) => ({ code: 'TEST-001', title: 'Capacitación ficticia de prueba', description: 'Caso automatizado', start_date: '2027-01-20', end_date: '2027-01-20', start_time: '09:00', end_time: '11:00', modality: 'presencial', location: 'Sala ficticia', capacity: 10, status: 'planificada', instructor_id: null, ...overrides });
