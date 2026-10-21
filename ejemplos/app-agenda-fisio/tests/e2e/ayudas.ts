import { expect, type Page } from '@playwright/test';
import { unico } from './datos';

// Ayudas de las pruebas de citas y agenda. Los proyectos de escritorio y móvil corren en paralelo
// contra la misma base: cada prueba crea su propio fisioterapeuta y pacientes con nombre único.

export const CLAVE_FISIO = 'clave-fisio-12345';

/** Da de alta (desde /usuarios, con la sesión de administración de `page`) una cuenta que atiende citas. */
export async function crearFisio(page: Page) {
  const nombre = unico('Fisio');
  const email = `${nombre.split(' ')[1]}@pruebas.local`;
  await page.goto('/usuarios');
  const alta = page.getByRole('region', { name: 'Dar de alta una cuenta' });
  await alta.getByLabel('Nombre').fill(nombre);
  await alta.getByLabel('Correo electrónico').fill(email);
  await alta.getByLabel('Contraseña inicial').fill(CLAVE_FISIO);
  await alta.getByLabel('Atiende citas (fisioterapeuta)').check();
  await alta.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByText(`Cuenta creada para ${email}.`)).toBeVisible();
  return { nombre, email };
}

/** Crea un paciente por la interfaz de /pacientes/nuevo (campos «Nombre» y «Teléfono», botón «Guardar paciente»). */
export async function crearPaciente(page: Page, nombre = unico('Paciente')) {
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('600123456');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/pacientes/nuevo'));
  return nombre;
}

/** Fecha aleatoria (AAAA-MM-DD) lejana en el futuro (2040-2049) o en el pasado (2000-2009). */
export function fechaLejana(pasado = false) {
  const anio = (pasado ? 2000 : 2040) + Math.floor(Math.random() * 10);
  const mes = 1 + Math.floor(Math.random() * 12);
  const dia = 1 + Math.floor(Math.random() * 28);
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Fecha de hoy en Madrid (AAAA-MM-DD). */
export function hoyMadrid() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date());
}

type Horario = { fecha: string; hora: string; duracion?: string };

export async function rellenarHorario(page: Page, { fecha, hora, duracion }: Horario) {
  await page.getByLabel('Fecha').fill(fecha);
  await page.getByLabel('Hora').fill(hora);
  if (duracion !== undefined) await page.getByLabel('Duración (minutos)').fill(duracion);
}

/** Abre «Nueva cita», busca y elige el paciente y deja el formulario listo para rellenar. */
export async function abrirFormularioCita(page: Page, paciente: string) {
  await page.goto(`/citas/nueva?q=${encodeURIComponent(paciente)}`);
  await page
    .getByRole('listitem')
    .filter({ hasText: paciente })
    .getByRole('link', { name: /Elegir/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Datos de la cita' })).toBeVisible();
}

/** Crea una cita por la interfaz y espera a ver el aviso «Cita guardada» en la agenda. */
export async function crearCitaPorUI(
  page: Page,
  datos: Horario & { paciente: string; fisio: string; motivo?: string },
) {
  await abrirFormularioCita(page, datos.paciente);
  await page.getByLabel('Fisioterapeuta').selectOption({ label: datos.fisio });
  await rellenarHorario(page, datos);
  if (datos.motivo) await page.getByLabel('Motivo (opcional)').fill(datos.motivo);
  await page.getByRole('button', { name: 'Guardar cita' }).click();
  await expect(page.getByText('Cita guardada')).toBeVisible();
}

/** Identificador de la cita de un paciente visible en la agenda actual (a partir del enlace al detalle). */
export async function idCitaVisible(page: Page, paciente: string) {
  const href = await page.getByRole('link', { name: paciente }).first().getAttribute('href');
  return href!.split('/').pop()!;
}
