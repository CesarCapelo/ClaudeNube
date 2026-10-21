import { test, expect } from '@playwright/test';
import { SESION_RECEPCION } from '../../playwright.config';
import { unico } from './datos';

test('T3 · la administración ve el alta de un paciente sin sus datos personales', async ({ page }) => {
  const nombre = unico('Paciente Actividad');
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('600 222 333');
  await page.getByLabel('Notas clínicas').fill('Lumbalgia crónica');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page).toHaveURL(/\/pacientes\?aviso=guardado$/);

  await page.goto('/actividad');
  await expect(page.getByRole('heading', { level: 1, name: 'Actividad' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Alta de paciente' }).first()).toBeVisible();
  await expect(page.getByText(nombre)).toHaveCount(0);
  await expect(page.getByText('Lumbalgia')).toHaveCount(0);
});

test.describe('recepción (rol user)', () => {
  test.use({ storageState: SESION_RECEPCION });
  test('T3 · no puede ver la actividad', async ({ page }) => {
    await page.goto('/actividad');
    await expect(page).toHaveURL(/\/prohibido$/);
  });
});

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('T3 · lleva a entrar', async ({ page }) => {
    await page.goto('/actividad');
    await expect(page).toHaveURL(/\/entrar$/);
  });
});
