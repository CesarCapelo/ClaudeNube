import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { crearCitaPorUI, crearFisio, crearPaciente, fechaLejana, hoyMadrid } from './ayudas';

// H3. Cada prueba usa su propio fisioterapeuta (escritorio y móvil corren en paralelo sobre la misma base).

const sumar = (fecha: string, dias: number) =>
  new Date(Date.UTC(+fecha.slice(0, 4), +fecha.slice(5, 7) - 1, +fecha.slice(8) + dias))
    .toISOString()
    .slice(0, 10);

async function sinDesbordamiento(page: Page) {
  const exceso = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(exceso).toBeLessThanOrEqual(0);
}

async function seleccionar(page: Page, fisio: string) {
  await page.getByLabel('Fisioterapeuta').selectOption({ label: fisio });
  await page.getByRole('button', { name: 'Ver agenda' }).click();
}

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('H3 · sin sesión /agenda lleva a /entrar', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page).toHaveURL(/\/entrar/);
  });
});

test('H3 · por defecto muestra el día de hoy, con un único h1 «Agenda» y la navegación Anterior, Hoy y Siguiente', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  await page.goto('/agenda');
  await expect(page.locator('h1')).toHaveText('Agenda');
  await expect(page.getByRole('link', { name: 'Día', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.goto(`/agenda?fecha=2040-05-10`);
  await seleccionar(page, fisio.nombre);
  await expect(page).toHaveURL(/fecha=2040-05-10/);
  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(/fecha=2040-05-11/);
  await page.getByRole('link', { name: 'Anterior' }).click();
  await page.getByRole('link', { name: 'Anterior' }).click();
  await expect(page).toHaveURL(/fecha=2040-05-09/);
  await page.getByRole('link', { name: 'Hoy' }).click();
  await expect(page).toHaveURL(new RegExp(`fecha=${hoyMadrid()}`));
});

test('H3 · un día sin citas muestra «Sin citas este día» con enlace a «Nueva cita»', async ({ page }) => {
  const fisio = await crearFisio(page);
  await page.goto(`/agenda?fecha=${fechaLejana()}`);
  await seleccionar(page, fisio.nombre);
  const vacio = page.getByRole('region', { name: /Citas del día/ });
  await expect(vacio.getByText('Sin citas este día')).toBeVisible();
  await expect(vacio.getByRole('link', { name: 'Nueva cita' })).toHaveAttribute('href', /\/citas\/nueva\?/);
});

test('H3 · el día lista las citas ordenadas por hora con estado en texto y sin motivo', async ({ page }) => {
  const fisio = await crearFisio(page);
  const tarde = await crearPaciente(page);
  const manana = await crearPaciente(page);
  const futura = fechaLejana();
  await crearCitaPorUI(page, {
    paciente: tarde,
    fisio: fisio.nombre,
    fecha: futura,
    hora: '16:00',
    motivo: 'MOTIVO-PRIVADO',
  });
  await crearCitaPorUI(page, {
    paciente: manana,
    fisio: fisio.nombre,
    fecha: futura,
    hora: '09:15',
    duracion: '30',
  });

  const items = page.getByRole('region', { name: /Citas del día/ }).getByRole('listitem');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('09:15–09:45');
  await expect(items.nth(0)).toContainText(manana);
  await expect(items.nth(0)).toContainText('Programada');
  await expect(items.nth(1)).toContainText('16:00–16:50');
  await expect(page.getByText('MOTIVO-PRIVADO')).toHaveCount(0);
  // Una cita futura no ofrece «Realizada» ni «No se presentó» (solo cancelar).
  await expect(page.getByRole('button', { name: 'Realizada' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Cancelar/ })).toHaveCount(2);
  await expect(page.getByText('Pendiente de marcar')).toHaveCount(0);
});

test('H3 · una cita programada ya pasada muestra «Pendiente de marcar» y las canceladas se indican con texto', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const pasada = fechaLejana(true);
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: pasada, hora: '11:00' });
  await expect(page.getByText('Pendiente de marcar')).toBeVisible();
  await expect(page.getByRole('button', { name: 'No se presentó' })).toBeVisible();
  await page.getByRole('button', { name: /Cancelar/ }).click();
  await expect(page.getByText('Cita actualizada')).toBeVisible();
  const cita = page.getByRole('region', { name: /Citas del día/ }).getByRole('listitem');
  await expect(cita).toContainText('Cancelada');
  await expect(cita.getByRole('button')).toHaveCount(0);
  await expect(page.getByText('Pendiente de marcar')).toHaveCount(0);
});

test('H3 · el selector cambia de fisioterapeuta y cada agenda solo muestra sus citas', async ({ page }) => {
  const fisioA = await crearFisio(page);
  const fisioB = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente, fisio: fisioA.nombre, fecha, hora: '10:00' });
  await expect(page.getByRole('link', { name: paciente })).toBeVisible();
  await expect(page.getByLabel('Fisioterapeuta')).toHaveValue(/.+/);

  await seleccionar(page, fisioB.nombre);
  await expect(page.getByText('Sin citas este día')).toBeVisible();
  await expect(page.getByRole('link', { name: paciente })).toHaveCount(0);
  await seleccionar(page, fisioA.nombre);
  await expect(page.getByRole('link', { name: paciente })).toBeVisible();
});

test('H3 · la semana va de lunes a domingo, coloca cada cita en su día y navega de semana en semana', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  // 2041-03-13 es miércoles: la semana va del lunes 11 al domingo 17.
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: '2041-03-13', hora: '12:00' });
  await page.getByRole('link', { name: 'Semana', exact: true }).click();
  await expect(page).toHaveURL(/vista=semana/);
  await expect(page.locator('h1')).toHaveText('Agenda');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7);
  const dias = page.getByRole('region').filter({ has: page.getByRole('heading', { level: 3 }) });
  await expect(dias.first()).toContainText('lun');
  await expect(dias.last()).toContainText('dom');
  const miercoles = page.locator('section', { has: page.getByRole('heading', { level: 3, name: /mié/ }) });
  await expect(miercoles).toContainText(paciente);
  await expect(miercoles).toContainText('12:00–12:50');
  await expect(page.getByRole('link', { name: paciente })).toHaveCount(1);
  await sinDesbordamiento(page);

  await page.getByRole('link', { name: 'Siguiente' }).click();
  await expect(page).toHaveURL(new RegExp(`fecha=${sumar('2041-03-13', 7)}`));
  await expect(page.getByRole('link', { name: paciente })).toHaveCount(0);
  await page.getByRole('link', { name: 'Anterior' }).click();
  await expect(page.getByRole('link', { name: paciente })).toHaveCount(1);
});

test('H3 · en 360 px la semana se apila sin desplazamiento horizontal de la página', async ({ page }) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: '2041-03-13', hora: '12:00' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('link', { name: 'Semana', exact: true }).click();
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7);
  await sinDesbordamiento(page);
  await page.getByRole('link', { name: 'Día', exact: true }).click();
  await sinDesbordamiento(page);
});

test('H3 · los parámetros inválidos no rompen la agenda (fecha y fisioterapeuta)', async ({ page }) => {
  await crearFisio(page);
  await page.goto('/agenda?fecha=2026-02-30&fisio=no-existe&vista=otra');
  await expect(page.locator('h1')).toHaveText('Agenda');
  await expect(page.getByRole('link', { name: 'Día', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel('Fisioterapeuta')).toBeVisible();
});

test('H3 · las horas se muestran en horario de Madrid en las semanas de cambio de hora (29-mar y 25-oct de 2026)', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: '2026-03-29', hora: '10:00' });
  await expect(page.getByRole('region', { name: /Citas del día/ })).toContainText('10:00–10:50');
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: '2026-10-25', hora: '23:30' });
  await expect(page.getByRole('region', { name: /Citas del día/ })).toContainText('23:30–00:20');

  await page.getByRole('link', { name: 'Semana', exact: true }).click();
  const domingo = page.locator('section', { has: page.getByRole('heading', { level: 3, name: /dom/ }) });
  await expect(domingo).toContainText('23:30–00:20');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(7);
});

test('H3 · la agenda no tiene errores de accesibilidad con citas, en día y en semana', async ({ page }) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: fechaLejana(true), hora: '09:00' });
  for (const vista of ['dia', 'semana']) {
    await page.goto(`${page.url().replace(/&aviso=\w+/, '')}&vista=${vista}`);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  }
});
