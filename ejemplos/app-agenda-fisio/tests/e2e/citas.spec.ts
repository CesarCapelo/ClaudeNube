import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SESION_RECEPCION } from '../../playwright.config';
import {
  abrirFormularioCita,
  crearCitaPorUI,
  crearFisio,
  crearPaciente,
  fechaLejana,
  idCitaVisible,
  rellenarHorario,
} from './ayudas';

// H2 y H4. Cada prueba usa su propio fisioterapeuta y pacientes únicos (escritorio y móvil corren en paralelo).

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('H2 · sin sesión /citas/nueva lleva a /entrar', async ({ page }) => {
    await page.goto('/citas/nueva');
    await expect(page).toHaveURL(/\/entrar/);
  });

  test('H4 · sin sesión el detalle de una cita lleva a /entrar', async ({ page }) => {
    await page.goto(`/citas/${crypto.randomUUID()}`);
    await expect(page).toHaveURL(/\/entrar/);
  });
});

test('H2 · crea una cita y aparece en la agenda del fisioterapeuta con el aviso «Cita guardada»', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha, hora: '10:00', motivo: 'Dolor lumbar' });

  await expect(page).toHaveURL(new RegExp(`/agenda\\?.*fecha=${fecha}`));
  const lista = page.getByRole('region', { name: /Citas del día/ });
  await expect(lista.getByText('10:00–10:50')).toBeVisible();
  await expect(lista.getByRole('link', { name: paciente })).toBeVisible();
  // El motivo no se muestra en la agenda, solo en el detalle.
  await expect(page.getByText('Dolor lumbar')).toHaveCount(0);
  await lista.getByRole('link', { name: paciente }).click();
  await expect(page.getByText('Dolor lumbar')).toBeVisible();
});

test('H2 · el buscador encuentra al paciente por nombre o por teléfono y ofrece «Nuevo paciente»', async ({
  page,
}) => {
  const paciente = await crearPaciente(page);
  await page.goto(`/citas/nueva?q=${encodeURIComponent(paciente.toLowerCase())}`);
  await expect(page.getByRole('listitem').filter({ hasText: paciente })).toHaveCount(1);
  await page.goto('/citas/nueva?q=600123456');
  await expect(page.getByRole('list', { name: 'Resultados de la búsqueda' })).toBeVisible();
  await page.goto('/citas/nueva?q=zzzNoExisteNadie');
  await expect(page.getByText('No hay pacientes que coincidan')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuevo paciente' })).toHaveAttribute(
    'href',
    '/pacientes/nuevo?siguiente=cita',
  );
  // Sin paciente elegido no se muestra el formulario de la cita.
  await expect(page.getByRole('button', { name: 'Guardar cita' })).toHaveCount(0);
});

test('H2 · si llega con el paciente elegido muestra su nombre; uno inexistente se avisa', async ({
  page,
}) => {
  const paciente = await crearPaciente(page);
  await abrirFormularioCita(page, paciente);
  await expect(page.getByText(paciente)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cambiar paciente' })).toBeVisible();
  await page.goto(`/citas/nueva?paciente=${crypto.randomUUID()}`);
  await expect(page.getByText('El paciente elegido no existe')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar cita' })).toHaveCount(0);
});

test('H2 · los datos inválidos muestran su error por campo, conservan lo escrito y no guardan nada', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  await abrirFormularioCita(page, paciente);
  await page.getByLabel('Fisioterapeuta').selectOption({ label: fisio.nombre });
  await page.getByLabel('Fecha').fill('');
  await page.getByLabel('Motivo (opcional)').fill('Motivo conservado');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Indica la fecha.')).toBeVisible();
  await expect(page.getByText('Indica la hora.')).toBeVisible();
  await expect(page.getByLabel('Motivo (opcional)')).toHaveValue('Motivo conservado');

  const fecha = fechaLejana();
  await rellenarHorario(page, { fecha, hora: '10:03', duracion: '5' });
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Los minutos deben ser múltiplos de 5.')).toBeVisible();
  await expect(page.getByText('La duración mínima es de 10 minutos.')).toBeVisible();
  await expect(page.getByLabel('Fecha')).toHaveValue(fecha);

  await rellenarHorario(page, { fecha, hora: '10:00', duracion: '181' });
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('La duración máxima es de 180 minutos.')).toBeVisible();

  await page.goto(`/agenda?fecha=${fecha}`);
  await page.getByLabel('Fisioterapeuta').selectOption({ label: fisio.nombre });
  await page.getByRole('button', { name: 'Ver agenda' }).click();
  await expect(page.getByText('Sin citas este día')).toBeVisible();
});

test('H2 · rechaza el solape sin revelar al otro paciente y admite la cita contigua y otro fisioterapeuta', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const otroFisio = await crearFisio(page);
  const primero = await crearPaciente(page);
  const segundo = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente: primero, fisio: fisio.nombre, fecha, hora: '10:00' });

  await abrirFormularioCita(page, segundo);
  await page.getByLabel('Fisioterapeuta').selectOption({ label: fisio.nombre });
  await rellenarHorario(page, { fecha, hora: '10:30' });
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Ese fisioterapeuta ya tiene una cita de 10:00 a 10:50')).toBeVisible();
  await expect(page.getByText(primero)).toHaveCount(0);

  // Contigua (empieza justo cuando la otra acaba): se guarda.
  await rellenarHorario(page, { fecha, hora: '10:50' });
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Cita guardada')).toBeVisible();
  await expect(page.getByText('10:50–11:40')).toBeVisible();

  // La misma hora con otro fisioterapeuta también se guarda.
  await crearCitaPorUI(page, { paciente: segundo, fisio: otroFisio.nombre, fecha, hora: '10:00' });
});

test('H2 · reprograma una cita y aplica las mismas reglas de solape', async ({ page }) => {
  const fisio = await crearFisio(page);
  const primero = await crearPaciente(page);
  const segundo = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente: primero, fisio: fisio.nombre, fecha, hora: '10:00' });
  await crearCitaPorUI(page, { paciente: segundo, fisio: fisio.nombre, fecha, hora: '12:00' });
  await page.getByRole('link', { name: segundo }).click();

  const reprogramar = page.getByRole('region', { name: 'Reprogramar' });
  await reprogramar.getByLabel('Hora').fill('10:30');
  await reprogramar.getByRole('button', { name: 'Reprogramar cita' }).click();
  await expect(page.getByText('Ese fisioterapeuta ya tiene una cita de 10:00 a 10:50')).toBeVisible();

  await reprogramar.getByLabel('Hora').fill('13:00');
  await reprogramar.getByLabel('Duración (minutos)').fill('30');
  await reprogramar.getByRole('button', { name: 'Reprogramar cita' }).click();
  await expect(page.getByText('Cita actualizada')).toBeVisible();
  await expect(page.getByText('13:00–13:30 (30 min)')).toBeVisible();
});

test('H2 · una cita con id no válido o inexistente da 404', async ({ page }) => {
  for (const id of ['no-es-un-uuid', crypto.randomUUID()]) {
    const respuesta = await page.goto(`/citas/${id}`);
    expect(respuesta?.status()).toBe(404);
  }
});

test('H4 · marca como realizada una cita pasada desde la agenda y desaparece «Pendiente de marcar»', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const fecha = fechaLejana(true);
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha, hora: '10:00' });
  await expect(page.getByText('Pendiente de marcar')).toBeVisible();

  await page.getByRole('button', { name: 'Realizada' }).click();
  await expect(page.getByText('Cita actualizada')).toBeVisible();
  await expect(page.getByText('Pendiente de marcar')).toHaveCount(0);
  await expect(page.getByRole('region', { name: /Citas del día/ }).getByText('Realizada')).toBeVisible();
});

test('H4 · rechaza «Realizada» y «No se presentó» en una cita futura, pero admite cancelarla', async ({
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha, hora: '10:00' });
  await page.getByRole('link', { name: paciente }).click();

  const mensaje = 'Solo se puede marcar así una cita que ya ha empezado.';
  await page.getByRole('button', { name: 'Realizada' }).click();
  await expect(page.getByText(mensaje)).toBeVisible();
  await page.getByRole('button', { name: 'No se presentó' }).click();
  await expect(page.getByText(mensaje)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Programada' })).toBeDisabled();

  await page.getByRole('button', { name: 'Cancelada' }).click();
  await expect(page.getByText('Cita actualizada')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelada' })).toBeDisabled();
});

test('H4 · cancelar libera la franja y devolverla a «Programada» con solape se rechaza', async ({ page }) => {
  const fisio = await crearFisio(page);
  const primero = await crearPaciente(page);
  const segundo = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente: primero, fisio: fisio.nombre, fecha, hora: '10:00' });
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Cita actualizada')).toBeVisible();

  await crearCitaPorUI(page, { paciente: segundo, fisio: fisio.nombre, fecha, hora: '10:00' });
  await page.getByRole('link', { name: primero }).click();
  await page.getByRole('button', { name: 'Programada' }).click();
  await expect(page.getByText('Ese fisioterapeuta ya tiene una cita de 10:00 a 10:50')).toBeVisible();
});

test('H4 · solo la administración ve «Eliminar cita»; la elimina tras confirmar', async ({
  page,
  browser,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const fecha = fechaLejana();
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha, hora: '10:00' });
  const id = await idCitaVisible(page, paciente);

  // Recepción (user): no ve el botón y no puede eliminar.
  const contexto = await browser.newContext({ storageState: SESION_RECEPCION });
  const recepcion = await contexto.newPage();
  await recepcion.goto(`/citas/${id}`);
  await expect(recepcion.getByRole('heading', { name: `Cita de ${paciente}` })).toBeVisible();
  await expect(recepcion.getByText('Eliminar cita')).toHaveCount(0);
  await expect(recepcion.getByRole('button', { name: /Eliminar/ })).toHaveCount(0);
  await contexto.close();

  // Administración: abre el desplegable y confirma.
  await page.goto(`/citas/${id}`);
  await page.getByText('Eliminar cita').click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page).toHaveURL(/aviso=eliminada/);
  await expect(page.getByText('Cita eliminada')).toBeVisible();
  await expect(page.getByRole('link', { name: paciente })).toHaveCount(0);
  expect((await page.goto(`/citas/${id}`))?.status()).toBe(404);
});

test('H2 · recepción (user, sin marca de fisioterapeuta) crea una cita para el primer fisioterapeuta', async ({
  browser,
  page,
}) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  const contexto = await browser.newContext({ storageState: SESION_RECEPCION });
  const recepcion = await contexto.newPage();
  const fecha = fechaLejana();
  await crearCitaPorUI(recepcion, { paciente, fisio: fisio.nombre, fecha, hora: '16:30' });
  await expect(recepcion.getByText('16:30–17:20')).toBeVisible();
  await contexto.close();
});

test('H2 · el formulario de cita y el detalle no tienen errores de accesibilidad', async ({ page }) => {
  const fisio = await crearFisio(page);
  const paciente = await crearPaciente(page);
  await abrirFormularioCita(page, paciente);
  const comprobar = async () => {
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
  };
  await comprobar();
  await page.getByLabel('Fecha').fill('');
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Indica la fecha.')).toBeVisible();
  await comprobar();
  await crearCitaPorUI(page, { paciente, fisio: fisio.nombre, fecha: fechaLejana(), hora: '10:00' });
  await page.getByRole('link', { name: paciente }).click();
  await expect(page.getByRole('heading', { name: `Cita de ${paciente}` })).toBeVisible();
  await comprobar();
});
