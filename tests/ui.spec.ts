import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Training, User } from '../src/types';

const demoPassword = 'Pruebas-ficticias-2026!';
const demoEmail = 'admin@demo.test';

async function login(page: Page) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(demoEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
}

test('rechaza credenciales incorrectas y permite entrar y cerrar la sesión', async ({ page, context }) => {
  await page.goto('/');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(demoEmail);
  await page.getByLabel('Contraseña', { exact: true }).fill('Contraseña-incorrecta-2026!');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/incorrect|inválid/i);
  await page.getByLabel('Contraseña', { exact: true }).fill(demoPassword);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Hola,/ })).toBeVisible();
  const cookie = (await context.cookies()).find((item) => item.name === 'sgc_session');
  expect(cookie?.httpOnly).toBe(true);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu equipo, conectado.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
});

test('muestra el panel en escritorio y móvil y obtiene capturas del navegador real', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('heading', { name: 'En la agenda', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Cargando información' })).toHaveCount(0);
  mkdirSync(resolve('docs/evidencias'), { recursive: true });
  await page.screenshot({ path: resolve('docs/evidencias/v1-escritorio.png'), fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Abrir menú', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('.sidebar').evaluate((sidebar) => sidebar.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const selector of ['.page-heading h1', '.welcome-banner h2']) {
    const heading = page.locator(selector);
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return element.scrollWidth <= element.clientWidth && bounds.left >= 0 && bounds.right <= window.innerWidth;
    }), `El texto ${selector} debe caber completo en el móvil`).toBe(true);
  }
  await page.screenshot({ path: resolve('docs/evidencias/v1-movil.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('button', { name: 'Capacitaciones', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Capacitaciones', exact: true })).toBeVisible();
});

test('registra y modifica un usuario y explica el rechazo de un correo duplicado', async ({ page }) => {
  const email = 'persona.e2e@demo.test';
  await login(page);
  await page.getByRole('button', { name: 'Usuarios', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  let form = page.getByRole('dialog');
  await form.getByLabel('Nombres *', { exact: true }).fill('Persona');
  await form.getByLabel('Apellidos *', { exact: true }).fill('E2E');
  await form.getByLabel('Correo electrónico *', { exact: true }).fill(email);
  await form.getByLabel(/^Contraseña \*/).fill(demoPassword);
  await form.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'La cuenta se registró correctamente.' })).toBeVisible();
  await page.getByLabel('Buscar usuarios por nombre o correo', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: email });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: 'Editar a Persona E2E', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Área', { exact: true }).fill('Área ficticia actualizada');
  await form.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(row).toContainText('Área ficticia actualizada');
  await page.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Nombres *', { exact: true }).fill('Cuenta');
  await form.getByLabel('Apellidos *', { exact: true }).fill('Duplicada');
  await form.getByLabel('Correo electrónico *', { exact: true }).fill(email);
  await form.getByLabel(/^Contraseña \*/).fill(demoPassword);
  await form.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText(/correo|registrad|duplicad|existe/i);
  await expect(form).toBeVisible();
  await form.getByRole('button', { name: 'Cancelar', exact: true }).click();
});

test('valida horarios y guarda y edita una capacitación desde el formulario', async ({ page }) => {
  const creationRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/trainings') {
      creationRequests.push(request.url());
    }
  });

  await login(page);
  await page.getByRole('button', { name: 'Capacitaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva capacitación', exact: true }).click();
  let form = page.getByRole('dialog');
  const initialStatus = form.getByRole('combobox', { name: 'Estado *', exact: true });
  await expect(initialStatus).toHaveValue('planificada');
  await expect(initialStatus.locator('option')).toHaveText(['Planificada', 'Programada']);
  await form.getByLabel('Código *', { exact: true }).fill('E2E-001');
  await form.getByLabel('Título de la capacitación *', { exact: true }).fill('Capacitación E2E');
  await form.getByLabel('Fecha de inicio *', { exact: true }).fill('2027-01-15');
  await form.getByLabel('Fecha de fin *', { exact: true }).fill('2027-01-16');
  await form.getByLabel('Hora de inicio *', { exact: true }).fill('10:00');
  const endTime = form.getByLabel('Hora de fin *', { exact: true });
  await endTime.fill('09:00');
  await form.getByLabel('Lugar o enlace *', { exact: true }).fill('Sala ficticia E2E');
  await form.getByLabel('Capacidad de personas *', { exact: true }).fill('1');
  const createButton = form.getByRole('button', { name: 'Crear capacitación', exact: true });
  await createButton.click();
  const scheduleError = 'La hora de fin debe ser posterior a la hora de inicio en cada día de la capacitación.';
  await expect(form.getByRole('alert')).toHaveText(scheduleError);
  await expect(endTime).toHaveAccessibleDescription(scheduleError);
  expect(creationRequests).toHaveLength(0);

  await endTime.fill('11:00');
  await expect(form.getByRole('alert')).toHaveCount(0);
  await form.getByLabel('Fecha de fin *', { exact: true }).fill('2027-01-15');
  await endTime.fill('09:00');
  await createButton.click();
  await expect(endTime).toHaveAccessibleDescription(scheduleError);
  expect(creationRequests).toHaveLength(0);

  await form.getByLabel('Hora de inicio *', { exact: true }).fill('09:00');
  await endTime.fill('10:00');
  await form.getByLabel('Fecha de fin *', { exact: true }).fill('2027-01-16');

  const code = form.getByLabel('Código *', { exact: true });
  await code.fill('DEMO-001');
  await createButton.click();
  await expect(form.getByRole('alert')).toHaveText('Use otro código.');
  await expect(code).toHaveAccessibleDescription('Use otro código.');
  expect(creationRequests).toHaveLength(1);

  await code.fill('E2E-001');
  await createButton.click();
  await expect(form).toHaveCount(0);
  expect(creationRequests).toHaveLength(2);
  await expect(page.getByRole('status').filter({ hasText: 'La capacitación se registró correctamente.' })).toBeVisible();
  await page.getByLabel('Buscar capacitaciones por título o código', { exact: true }).fill('E2E-001');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E-001' });
  await expect(row).toHaveCount(1);
  await expect(row.getByText('1', { exact: true })).toBeVisible();
  await expect(row.getByText('Sin asignar', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Editar Capacitación E2E', exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Título de la capacitación *', { exact: true }).fill('Capacitación E2E actualizada');
  await form.getByLabel('Capacidad de personas *', { exact: true }).fill('30');
  await form.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(row).toContainText('Capacitación E2E actualizada');
  await expect(row.getByText('30', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Ver detalle', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Capacitación E2E actualizada', exact: true })).toBeVisible();
});

function trainingData(code: string) {
  return {
    code, title: 'Capacitación ' + code, description: 'Caso ficticio de HU-04',
    start_date: '2027-01-20', end_date: '2027-01-21', start_time: '09:00', end_time: '11:00',
    modality: 'presencial', location: 'Sala original', capacity: 10, status: 'planificada',
    instructor_id: null as number | null,
  };
}

async function sessionHeaders(page: Page) {
  const response = await page.request.get('/api/auth/me');
  await expect(response).toBeOK();
  const { data } = await response.json();
  return { 'X-CSRF-Token': data.csrfToken as string };
}

async function createTraining(page: Page, data: ReturnType<typeof trainingData>) {
  const headers = await sessionHeaders(page);
  const response = await page.request.post('/api/trainings', { headers, data });
  expect(response.status()).toBe(201);
  const { data: training } = await response.json();
  const record: Training = training;
  const path = '/api/trainings/' + record.id;
  return {
    record,
    path,
    async update(changes: Partial<typeof data>) {
      const result = await page.request.put(path, { headers, data: { ...data, ...changes } });
      await expect(result).toBeOK();
    },
    async read(): Promise<Training> {
      const result = await page.request.get(path);
      await expect(result).toBeOK();
      return (await result.json()).data;
    },
  };
}

async function searchTrainings(page: Page, code: string) {
  await page.getByRole('button', { name: 'Capacitaciones', exact: true }).click();
  await page.getByLabel('Buscar capacitaciones por título o código', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

function trainingRow(page: Page, code: string) {
  return page.getByRole('row').filter({ hasText: code });
}

test('HU-04 precarga el detalle vigente y guarda título y cupo en el mismo registro', async ({ page }) => {
  await login(page);
  const data = trainingData('HU04-VIGENTE');
  const training = await createTraining(page, data);
  await searchTrainings(page, data.code);
  const edit = trainingRow(page, data.code).getByRole('button', { name: /^Editar/ });
  await expect(edit).toBeVisible();
  await training.update({ location: 'Sala actualizada antes de abrir', capacity: 15 });

  await edit.click();
  const form = page.getByRole('dialog');
  await expect(form.getByLabel('Lugar o enlace *', { exact: true })).toHaveValue('Sala actualizada antes de abrir');
  const capacity = form.getByLabel('Capacidad de personas *', { exact: true });
  await expect(capacity).toHaveValue('15');
  await form.getByLabel('Título de la capacitación *', { exact: true }).fill('Título revisado de HU-04');
  await capacity.fill('30');
  await form.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'La capacitación se actualizó correctamente.' })).toBeVisible();
  expect(await training.read()).toMatchObject({
    id: training.record.id, responsible_id: training.record.responsible_id, status: data.status,
    title: 'Título revisado de HU-04', capacity: 30, location: 'Sala actualizada antes de abrir',
  });
});

test('HU-04 muestra la carga, permite reintentar el detalle y verifica si todavía es editable', async ({ page }) => {
  await login(page);
  const data = trainingData('HU04-REINTENTO');
  const training = await createTraining(page, data);
  await searchTrainings(page, data.code);
  const edit = trainingRow(page, data.code).getByRole('button', { name: /^Editar/ });
  await expect(edit).toBeVisible();
  let release = () => {};
  const gate = new Promise<void>((resolveGate) => { release = resolveGate; });
  const detailUrl = (url: URL) => url.pathname === training.path;
  await page.route(detailUrl, async (route) => {
    await gate;
    await route.fulfill({ status: 503, json: { error: { message: 'Detalle no disponible.' } } });
  });
  const dialog = page.getByRole('dialog');
  try {
    await edit.click();
    await expect(dialog.getByRole('status')).toHaveText('Cargando información…');
    await expect(dialog.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
  } finally {
    release();
  }
  await expect(dialog.getByRole('alert')).toHaveText('Detalle no disponible.');
  await page.unroute(detailUrl);
  await training.update({ status: 'cancelada' });
  await dialog.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('ya no admite cambios');
  await expect(dialog.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0);
});

test('HU-04 ignora una respuesta de detalle tardía al cerrar y editar otro registro', async ({ page }) => {
  await login(page);
  const first = trainingData('HU04-TARDE-A');
  const second = trainingData('HU04-TARDE-B');
  const training = await createTraining(page, first);
  await createTraining(page, second);
  await searchTrainings(page, 'HU04-TARDE');
  let release = () => {};
  const gate = new Promise<void>((resolveGate) => { release = resolveGate; });
  await page.route((url) => url.pathname === training.path, async (route) => {
    await gate;
    await route.continue();
  });
  const request = page.waitForRequest((entry) => new URL(entry.url()).pathname === training.path);
  const dialog = page.getByRole('dialog');
  try {
    await trainingRow(page, first.code).getByRole('button', { name: /^Editar/ }).click();
    await request;
    await expect(dialog.getByRole('status')).toHaveText('Cargando información…');
    await dialog.getByRole('button', { name: 'Cerrar formulario', exact: true }).click();
    await trainingRow(page, second.code).getByRole('button', { name: /^Editar/ }).click();
    await expect(dialog.getByLabel('Código *', { exact: true })).toHaveValue(second.code);
  } finally {
    release();
  }
  await (await (await request).response())?.finished();
  await expect(dialog.getByLabel('Código *', { exact: true })).toHaveValue(second.code);
});

test('HU-04 ofrece las transiciones válidas y bloquea finalizadas y canceladas', async ({ page }) => {
  await login(page);
  const data = trainingData('HU04-ESTADOS-A');
  const cancelled = trainingData('HU04-ESTADOS-B');
  const training = await createTraining(page, data);
  const other = await createTraining(page, cancelled);
  await searchTrainings(page, 'HU04-ESTADOS');
  const edit = trainingRow(page, data.code).getByRole('button', { name: /^Editar/ });
  const dialog = page.getByRole('dialog');
  const state = dialog.getByRole('combobox', { name: 'Estado *', exact: true });
  const save = dialog.getByRole('button', { name: 'Guardar cambios', exact: true });
  for (const [current, options, next] of [
    ['planificada', ['Planificada', 'Programada', 'Cancelada'], 'programada'],
    ['programada', ['Programada', 'Planificada', 'En curso', 'Cancelada'], 'en_curso'],
    ['en_curso', ['En curso', 'Finalizada', 'Cancelada'], 'finalizada'],
  ] as const) {
    await edit.click();
    await expect(state).toHaveValue(current);
    await expect(state.locator('option')).toHaveText([...options]);
    await state.selectOption(next);
    await save.click();
    await expect(dialog).toHaveCount(0);
    expect((await training.read()).status).toBe(next);
  }
  await expect(edit).toHaveCount(0);
  const otherEdit = trainingRow(page, cancelled.code).getByRole('button', { name: /^Editar/ });
  await otherEdit.click();
  await state.selectOption('cancelada');
  await save.click();
  await expect(dialog).toHaveCount(0);
  await expect(otherEdit).toHaveCount(0);
  expect((await other.read()).status).toBe('cancelada');
});

for (const action of ['reemplazar', 'desasignar'] as const) {
  test('HU-04 detecta un instructor inactivo y permite ' + action, async ({ page }) => {
    await login(page);
    const headers = await sessionHeaders(page);
    const profile = { first_name: 'Instructor', last_name: 'Ficticio para ' + action, email: action + '@demo.test', roles: ['instructor'] };
    const created = await page.request.post('/api/users', { headers, data: { ...profile, password: demoPassword } });
    expect(created.status()).toBe(201);
    const { data: instructor } = await created.json() as { data: User };
    const data = { ...trainingData('HU04-INSTR-' + action.toUpperCase()), instructor_id: instructor.id };
    const training = await createTraining(page, data);
    await expect(await page.request.put('/api/users/' + instructor.id, { headers, data: { ...profile, active: false } })).toBeOK();

    await searchTrainings(page, data.code);
    await trainingRow(page, data.code).getByRole('button', { name: /^Editar/ }).click();
    const dialog = page.getByRole('dialog');
    const selector = dialog.getByLabel(/^Instructor/);
    const save = dialog.getByRole('button', { name: 'Guardar cambios', exact: true });
    await expect(dialog.getByRole('status').filter({ hasText: 'ya no es elegible' })).toContainText('Instructor Ficticio para ' + action);
    await expect(selector).toHaveValue(String(instructor.id));
    await expect(save).toBeDisabled();
    const updates: string[] = [];
    page.on('request', (entry) => { if (entry.method() === 'PUT' && new URL(entry.url()).pathname === training.path) updates.push(entry.url()); });
    const title = dialog.getByLabel('Título de la capacitación *', { exact: true });
    await title.fill('Título conservado al ' + action);
    await title.evaluate((input: HTMLInputElement) => input.form?.requestSubmit());
    expect(updates).toHaveLength(0);
    expect((await training.read()).instructor_id).toBe(instructor.id);

    const alternative = action === 'desasignar' ? '' : await selector.locator('option').filter({ hasText: 'Instructor Demostración' }).getAttribute('value');
    expect(alternative).not.toBeNull();
    await selector.selectOption(alternative!);
    await save.click();
    await expect(dialog).toHaveCount(0);
    expect(updates).toHaveLength(1);
    expect(await training.read()).toMatchObject({
      instructor_id: alternative ? Number(alternative) : null,
      title: 'Título conservado al ' + action,
    });
  });
}

test('HU-04 conserva el borrador al reintentar un catálogo que falló', async ({ page }) => {
  await login(page);
  const response = await page.request.get('/api/users?role=instructor');
  await expect(response).toBeOK();
  const { data: [instructor] } = await response.json() as { data: User[] };
  const data = { ...trainingData('HU04-CATALOGO'), instructor_id: instructor.id };
  await createTraining(page, data);
  const catalogUrl = (url: URL) => url.pathname === '/api/users' && url.searchParams.get('role') === 'instructor';
  await page.route(catalogUrl, (route) => route.abort());
  await searchTrainings(page, data.code);
  await trainingRow(page, data.code).getByRole('button', { name: /^Editar/ }).click();
  const dialog = page.getByRole('dialog');
  const title = dialog.getByLabel('Título de la capacitación *', { exact: true });
  const selector = dialog.getByLabel(/^Instructor/);
  await title.fill('Borrador durante el error');
  await expect(dialog.getByRole('alert')).toContainText('No se pudo consultar el catálogo de instructores.');
  await expect(selector.locator('option:checked')).toContainText('sin verificar');
  await expect(dialog.getByText(/ya no es elegible/)).toHaveCount(0);
  await page.unroute(catalogUrl);
  await dialog.getByRole('button', { name: 'Reintentar catálogo', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(selector.locator('option:checked')).toHaveText('Instructor Demostración');
  await expect(title).toHaveValue('Borrador durante el error');
});

test('HU-04 distingue la falta de permiso para consultar el catálogo de un instructor no elegible', async ({ page }) => {
  await login(page);
  const response = await page.request.get('/api/users?role=instructor');
  await expect(response).toBeOK();
  const { data: [instructor] } = await response.json() as { data: User[] };
  const data = { ...trainingData('HU04-SIN-CATALOGO'), instructor_id: instructor.id };
  const training = await createTraining(page, data);
  await page.route((url) => url.pathname === '/api/users' && url.searchParams.get('role') === 'instructor',
    (route) => route.fulfill({ status: 403, json: { error: { message: 'No tiene permiso para consultar usuarios.' } } }));
  await searchTrainings(page, data.code);
  await trainingRow(page, data.code).getByRole('button', { name: /^Editar/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('alert')).toContainText('No tiene permiso para consultar usuarios.');
  await expect(dialog.getByRole('button', { name: 'Reintentar catálogo' })).toHaveCount(0);
  await expect(dialog.getByLabel(/^Instructor/).locator('option:checked')).toContainText('sin verificar');
  await expect(dialog.getByText(/ya no es elegible/)).toHaveCount(0);

  await dialog.getByLabel('Título de la capacitación *', { exact: true }).fill('Título con asignación conservada');
  await dialog.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await training.read()).toMatchObject({ instructor_id: instructor.id, title: 'Título con asignación conservada' });
});

test('HU-04 conserva el borrador si el servidor rechaza un cambio de estado y permite ver el detalle vigente', async ({ page }) => {
  await login(page);
  const data = trainingData('HU04-CONFLICTO');
  const training = await createTraining(page, data);
  await searchTrainings(page, data.code);
  await trainingRow(page, data.code).getByRole('button', { name: /^Editar/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Editar capacitación' });
  const title = dialog.getByLabel('Título de la capacitación *', { exact: true });
  const save = dialog.getByRole('button', { name: 'Guardar cambios', exact: true });
  await title.fill('Título escrito antes del conflicto');
  await training.update({ title: 'Versión cerrada antes de guardar', status: 'cancelada' });
  const rejected = page.waitForResponse((entry) => new URL(entry.url()).pathname === training.path && entry.request().method() === 'PUT');
  await save.click();
  expect((await rejected).status()).toBe(409);
  await expect(dialog.getByRole('alert')).toContainText('El estado de la capacitación cambió');
  await expect(title).toHaveValue('Título escrito antes del conflicto');
  await expect(save).toBeDisabled();
  await expect(page.getByText('La capacitación se actualizó correctamente.', { exact: true })).toHaveCount(0);

  await dialog.getByRole('button', { name: 'Consultar versión vigente', exact: true }).click();
  const detail = dialog.getByRole('region', { name: 'Versión vigente' });
  await expect(detail.getByRole('heading', { name: 'Versión cerrada antes de guardar' })).toBeVisible();
  await expect(detail.getByText('Cancelada', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: 'Cerrar consulta', exact: true }).click();
  await expect(title).toHaveValue('Título escrito antes del conflicto');
  expect((await training.read()).title).toBe('Versión cerrada antes de guardar');
});
test('Fran: programar genera avisos reales, permite leerlos y funciona en móvil', async ({ page }) => {
  await login(page);
  const result = await page.evaluate(async () => {
    const session = await fetch('/api/auth/me').then(response => response.json());
    const response = await fetch('/api/trainings', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.data.csrfToken },
      body: JSON.stringify({ code: 'FRAN-E2E', title: 'Aviso de capacitación E2E', description: 'Prueba ficticia', start_date: '2027-02-01', end_date: '2027-02-01', start_time: '09:00', end_time: '10:00', modality: 'presencial', location: 'Sala ficticia', capacity: 20, status: 'programada', instructor_id: null }),
    });
    return response.status;
  });
  expect(result).toBe(201);
  await page.getByRole('button', { name: 'Avisos', exact: true }).click();
  const item = page.locator('.notification-item').filter({ hasText: 'FRAN-E2E' });
  await expect(item).toContainText('Capacitación programada');
  await expect(item).toContainText('Sin leer');
  await item.getByRole('button', { name: 'Marcar como leído', exact: true }).click();
  await expect(item.locator('.notification-state')).toHaveText('Leído');
  await page.reload();
  await page.getByRole('button', { name: 'Avisos', exact: true }).click();
  await expect(item.locator('.notification-state')).toHaveText('Leído');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Avisos', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Reintentar avisos pendientes', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /Eventos procesados:/ })).toBeVisible();
});
