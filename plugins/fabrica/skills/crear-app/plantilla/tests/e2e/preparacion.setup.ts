import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as preparacion, expect } from '@playwright/test';
import { SESION_ADMIN } from '../../playwright.config';
import { ADMIN } from './datos';

// Crea la primera cuenta (que es administradora) o entra con ella si ya existe, y guarda la sesión.
preparacion('cuenta administradora', async ({ page }) => {
  mkdirSync(path.dirname(SESION_ADMIN), { recursive: true });
  await page.goto('/registro');
  if (await page.getByRole('heading', { name: 'Crear cuenta' }).isVisible()) {
    await page.getByLabel('Nombre').fill(ADMIN.nombre);
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
  } else {
    await page.goto('/entrar');
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Entrar' }).click();
  }
  await expect(page).toHaveURL(/\/panel$/);
  await page.context().storageState({ path: SESION_ADMIN });
});
