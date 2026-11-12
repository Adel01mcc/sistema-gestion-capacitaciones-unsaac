import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

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
  await login(page);
  await page.getByRole('button', { name: 'Capacitaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Nueva capacitación', exact: true }).click();
  let form = page.getByRole('dialog');
  await form.getByLabel('Código *', { exact: true }).fill('E2E-001');
  await form.getByLabel('Título de la capacitación *', { exact: true }).fill('Capacitación E2E');
  await form.getByLabel('Fecha de inicio *', { exact: true }).fill('2027-01-15');
  await form.getByLabel('Fecha de fin *', { exact: true }).fill('2027-01-15');
  await form.getByLabel('Hora de inicio *', { exact: true }).fill('10:00');
  await form.getByLabel('Hora de fin *', { exact: true }).fill('09:00');
  await form.getByLabel('Lugar o enlace *', { exact: true }).fill('Sala ficticia E2E');
  await form.getByLabel('Capacidad de personas *', { exact: true }).fill('25');
  await form.getByRole('button', { name: 'Crear capacitación', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('posteriores al inicio');
  await form.getByLabel('Hora de inicio *', { exact: true }).fill('09:00');
  await form.getByLabel('Hora de fin *', { exact: true }).fill('10:00');
  await form.getByRole('button', { name: 'Crear capacitación', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'La capacitación se registró correctamente.' })).toBeVisible();
  await page.getByLabel('Buscar capacitaciones por título o código', { exact: true }).fill('E2E-001');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'E2E-001' });
  await expect(row).toHaveCount(1);
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
