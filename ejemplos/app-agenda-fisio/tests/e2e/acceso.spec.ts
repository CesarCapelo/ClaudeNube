import { test, expect } from '@playwright/test';
import { ADMIN } from './datos';

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('las páginas privadas redirigen a entrar', async ({ page }) => {
    await page.goto('/pacientes');
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('el registro queda cerrado tras crear la primera cuenta', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.getByRole('heading', { name: 'Registro cerrado' })).toBeVisible();
  });

  test('una contraseña incorrecta muestra un error comprensible', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill('contraseña-incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  });
});

test('con sesión, el inicio lleva a la agenda', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agenda');
});
