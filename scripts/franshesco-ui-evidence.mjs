import { expect } from '@playwright/test';

export async function captureAccountScreens({ page, password, capture }) {
  await expect(page.getByRole('heading', { name: 'En la agenda', exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Cargando información' })).toHaveCount(0);
  await capture('panel');
  await page.getByRole('button', { name: 'Usuarios', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'admin@demo.test' })).toHaveCount(1);
  await capture('usuarios');
  await page.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  const form = page.getByRole('dialog');
  await form.getByLabel('Nombres *', { exact: true }).fill('Persona');
  await form.getByLabel('Apellidos *', { exact: true }).fill('Demostración');
  await form.getByLabel('Correo electrónico *', { exact: true }).fill('admin@demo.test');
  await form.getByLabel('Área', { exact: true }).fill('Área ficticia');
  await form.getByLabel('Especialidad', { exact: true }).fill('Demostración técnica');
  await capture('registro_usuario'); // Password todavía vacío, sin credenciales expuestas.
  await form.getByLabel(/^Contraseña \*/).fill(password);
  const response = page.waitForResponse(response => response.url().endsWith('/api/users') && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Registrar usuario', exact: true }).click();
  expect((await response).status()).toBe(409);
  await expect(form.getByRole('alert')).toContainText('correo');
  await capture('registro_duplicado');
  await form.getByRole('button', { name: 'Cancelar', exact: true }).click();
  const participant = page.getByRole('row').filter({ hasText: 'participante@demo.test' });
  await participant.getByRole('button', { name: 'Roles', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Asignar roles', exact: true })).toBeVisible();
  await capture('asignar_roles');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Roles y permisos', exact: true }).click();
  const coordinator = page.locator('.role-card').filter({ has: page.getByRole('heading', { name: 'Coordinador', exact: true }) });
  await expect(coordinator).toBeVisible();
  await capture('roles');
  await coordinator.getByRole('button', { name: 'Editar permisos', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Editar rol: Coordinador', exact: true })).toBeVisible();
  await capture('editar_permisos');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
}

export async function captureTrainingScreens({ page, capture }) {
  const title = 'Atención al cliente - evidencia ficticia';
  await page.getByRole('button', { name: 'Capacitaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva capacitación', exact: true }).click();
  let form = page.getByRole('dialog');
  await form.getByLabel('Código *', { exact: true }).fill('FRAN-EVIDENCIA');
  await form.getByLabel(/^Estado \*/).selectOption('programada');
  await form.getByLabel('Título de la capacitación *', { exact: true }).fill(title);
  await form.getByLabel('Descripción', { exact: true }).fill('Evidencia técnica aislada. Programación y modificación reales.');
  await form.getByLabel('Fecha de inicio *', { exact: true }).fill('2027-02-10');
  await form.getByLabel('Fecha de fin *', { exact: true }).fill('2027-02-10');
  await form.getByLabel('Hora de inicio *', { exact: true }).fill('09:00');
  await form.getByLabel('Hora de fin *', { exact: true }).fill('11:00');
  await form.getByLabel('Lugar o enlace *', { exact: true }).fill('Sala de demostración');
  await form.getByLabel('Capacidad de personas *', { exact: true }).fill('20');
  await expect(form.getByLabel(/^Instructor/)).toBeEnabled();
  await form.getByLabel(/^Instructor/).selectOption('3');
  await capture('programar_capacitacion');
  const createResponse = page.waitForResponse(response => response.url().endsWith('/api/trainings') && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Crear capacitación', exact: true }).click();
  const created = await createResponse;
  expect(created.status()).toBe(201);
  const result = await created.json();
  await expect(form).toHaveCount(0);
  const row = page.getByRole('row').filter({ hasText: 'FRAN-EVIDENCIA' });
  await expect(row).toHaveCount(1);
  await capture('capacitaciones');
  await row.getByRole('button', { name: 'Ver detalle', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: title, exact: true })).toBeVisible();
  await capture('detalle_capacitacion');
  await page.getByRole('dialog').getByRole('button', { name: 'Cerrar formulario', exact: true }).click();
  await row.getByRole('button', { name: `Editar ${title}`, exact: true }).click();
  form = page.getByRole('dialog');
  await form.getByLabel('Lugar o enlace *', { exact: true }).fill('Sala de demostración actualizada');
  await capture('editar_capacitacion');
  const updateResponse = page.waitForResponse(response => response.url().endsWith(`/api/trainings/${result.data.id}`) && response.request().method() === 'PUT');
  await form.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  const updated = await updateResponse;
  expect(updated.status()).toBe(200);
  await expect(form).toHaveCount(0);
  await capture('capacitacion_guardada');
  const notifications = await page.evaluate(async () => {
    const response = await fetch('/api/notifications');
    return { status: response.status, body: await response.json() };
  });
  return { createStatus: created.status(), updateStatus: updated.status(), notificationsStatus: notifications.status, notifications: notifications.body };
}
