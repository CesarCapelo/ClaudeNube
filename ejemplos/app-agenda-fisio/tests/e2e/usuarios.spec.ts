import { test, expect } from '@playwright/test';
import { unico } from './datos';

async function altaDeCuenta(page: import('@playwright/test').Page, nombre: string, atiende: boolean) {
  const email = `${nombre.split(' ')[1]}@pruebas.local`;
  await page.goto('/usuarios');
  const alta = page.getByRole('region', { name: 'Dar de alta una cuenta' });
  await alta.getByLabel('Nombre').fill(nombre);
  await alta.getByLabel('Correo electrónico').fill(email);
  await alta.getByLabel('Contraseña inicial').fill('clave-inicial-12345');
  if (atiende) await alta.getByLabel('Atiende citas (fisioterapeuta)').check();
  await alta.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText(`Cuenta creada para ${email}.`)).toBeVisible();
  return { email, fila: page.getByRole('listitem').filter({ hasText: email }) };
}

test('la administración da de alta una cuenta sin permisos de administración', async ({ page, browser }) => {
  const nombre = unico('Persona');
  const { email, fila } = await altaDeCuenta(page, nombre, false);
  await expect(fila).toContainText(/Atiende citas:\s*No/);

  // La nueva cuenta entra, no ve la gestión de usuarios y no puede acceder a ella.
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const otra = await contexto.newPage();
  await otra.goto('/entrar');
  await otra.getByLabel('Correo electrónico').fill(email);
  await otra.getByLabel('Contraseña').fill('clave-inicial-12345');
  await otra.getByRole('button', { name: 'Entrar' }).click();
  await expect(otra).toHaveURL(/\/agenda$/);
  for (const enlace of ['Usuarios', 'Actividad', 'Sin volver']) {
    await expect(otra.getByRole('link', { name: enlace })).toHaveCount(0);
  }
  await otra.goto('/usuarios');
  await expect(otra).toHaveURL(/\/prohibido$/);
  await otra.goto('/actividad');
  await expect(otra).toHaveURL(/\/prohibido$/);
  await contexto.close();
});

test('se marca y desmarca «atiende citas» y se cambia el rol de otra cuenta', async ({ page }) => {
  const nombre = unico('Fisio');
  const { fila } = await altaDeCuenta(page, nombre, true);
  await expect(fila).toContainText(/Atiende citas:\s*Sí/);

  await fila.getByRole('button', { name: 'Quitar de fisioterapeutas' }).click();
  await expect(fila).toContainText(/Atiende citas:\s*No/);

  await fila.getByRole('button', { name: 'Dar rol de administración' }).click();
  await expect(fila).toContainText(/Rol:\s*Administración/);
  await fila.getByRole('button', { name: 'Quitar administración' }).click();
  await expect(fila).toContainText(/Rol:\s*Usuario/);
});

test('la administradora no puede quitarse la administración ni bloquearse a sí misma', async ({ page }) => {
  await page.goto('/usuarios');
  const propia = page.getByRole('listitem').filter({ hasText: 'admin@pruebas.local' });
  await expect(propia.getByRole('button', { name: /Bloquear|Quitar administración/ })).toHaveCount(0);
});
