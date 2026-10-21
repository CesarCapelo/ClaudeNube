import { test, expect } from '@playwright/test';
import { unico } from './datos';

test('la administración da de alta una cuenta sin permisos de administración', async ({ page, browser }) => {
  const nombre = unico('Persona');
  const email = `${nombre.split(' ')[1]}@pruebas.local`;
  const password = 'clave-inicial-12345';

  await page.goto('/usuarios');
  const alta = page.getByRole('region', { name: 'Dar de alta una cuenta' });
  await alta.getByLabel('Nombre').fill(nombre);
  await alta.getByLabel('Correo electrónico').fill(email);
  await alta.getByLabel('Contraseña inicial').fill(password);
  await alta.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText(`Cuenta creada para ${email}.`)).toBeVisible();
  await expect(page.getByRole('cell', { name: email })).toBeVisible();

  // La nueva cuenta entra, no ve la gestión de usuarios y no puede acceder a ella.
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const otra = await contexto.newPage();
  await otra.goto('/entrar');
  await otra.getByLabel('Correo electrónico').fill(email);
  await otra.getByLabel('Contraseña').fill(password);
  await otra.getByRole('button', { name: 'Entrar' }).click();
  await expect(otra).toHaveURL(/\/panel$/);
  await expect(otra.getByRole('link', { name: 'Usuarios' })).toHaveCount(0);
  await otra.goto('/usuarios');
  await expect(otra).toHaveURL(/\/prohibido$/);
  await contexto.close();
});
