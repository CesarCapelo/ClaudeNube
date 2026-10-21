import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { test as preparacion, expect, type Browser } from '@playwright/test';
import { SESION_ADMIN, SESION_RECEPCION } from '../../playwright.config';
import { ADMIN, FISIO, RECEPCION } from './datos';

preparacion.describe.configure({ mode: 'serial' });

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
  await expect(page).toHaveURL(/\/agenda$/);
  await page.context().storageState({ path: SESION_ADMIN });
});

async function entrarComo(browser: Browser, cuenta: { email: string; password: string }, ruta?: string) {
  const contexto = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const pagina = await contexto.newPage();
  await pagina.goto('/entrar');
  await pagina.getByLabel('Correo electrónico').fill(cuenta.email);
  await pagina.getByLabel('Contraseña').fill(cuenta.password);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
  await expect(pagina).toHaveURL(/\/agenda$/);
  if (ruta) await contexto.storageState({ path: ruta });
  await contexto.close();
}

// Recepcionista (rol user, no atiende citas) y fisioterapeuta (rol user con la marca «atiende citas»).
// La recepcionista guarda su sesión para las pruebas de permisos.
preparacion('cuentas del equipo', async ({ browser }) => {
  const contexto = await browser.newContext({ storageState: SESION_ADMIN });
  const admin = await contexto.newPage();
  await admin.goto('/usuarios');
  const alta = admin.getByRole('region', { name: 'Dar de alta una cuenta' });
  const crear = async (cuenta: typeof FISIO, atiende: boolean) => {
    if (await admin.getByRole('listitem').filter({ hasText: cuenta.email }).count()) return false;
    await alta.getByLabel('Nombre').fill(cuenta.nombre);
    await alta.getByLabel('Correo electrónico').fill(cuenta.email);
    await alta.getByLabel('Contraseña inicial').fill(cuenta.password);
    const marca = alta.getByLabel('Atiende citas (fisioterapeuta)');
    if (atiende) await marca.check();
    else await marca.uncheck();
    await alta.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(admin.getByText(`Cuenta creada para ${cuenta.email}.`)).toBeVisible();
    return true;
  };
  await crear(RECEPCION, false);
  await crear(FISIO, true);
  await contexto.close();
  await entrarComo(browser, RECEPCION, SESION_RECEPCION);
});
