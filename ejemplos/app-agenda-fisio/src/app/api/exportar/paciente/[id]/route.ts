import { ErrorPermiso } from '@/lib/datos/errores';
import { exportar } from '@/lib/datos/pacientes';
import { formatearFecha, formatearHora } from '@/lib/fechas';
import { obtenerSesion } from '@/lib/sesion';

// T2: exportación de los datos de un paciente en CSV (separador «;», BOM UTF-8 para Excel).

/** Escapa una celda: comillas si hace falta y apóstrofo previo contra la inyección de fórmulas. */
function celda(valor: string | number | null | undefined) {
  let texto = valor == null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const fila = (celdas: (string | number | null | undefined)[]) => celdas.map(celda).join(';');
const fechaEsp = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

const ESTADOS = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_presentado: 'No presentado',
} as const;

export async function GET(_peticion: Request, contexto: RouteContext<'/api/exportar/paciente/[id]'>) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.user.banned) {
    return Response.json({ error: { codigo: 'no_autenticado', mensaje: 'Inicia sesión.' } }, { status: 401 });
  }
  const { id } = await contexto.params;

  let datos;
  try {
    datos = await exportar(sesion.user, id);
  } catch (error) {
    if (error instanceof ErrorPermiso) {
      return Response.json(
        { error: { codigo: 'prohibido', mensaje: 'No tienes permiso.' } },
        { status: 403 },
      );
    }
    throw error;
  }
  if (!datos) {
    return Response.json(
      { error: { codigo: 'no_encontrado', mensaje: 'Paciente no encontrado.' } },
      { status: 404 },
    );
  }

  const { paciente: p, citas } = datos;
  const lineas = [
    fila(['Paciente']),
    fila(['Nombre', 'Teléfono', 'Correo', 'Fecha de nacimiento', 'Notas clínicas', 'Fecha de alta']),
    fila([
      p.nombre,
      p.telefono,
      p.email,
      fechaEsp(p.fechaNacimiento),
      p.notasClinicas,
      formatearFecha(p.creadoEn),
    ]),
    '',
    fila(['Citas']),
    fila(['Fecha', 'Hora', 'Duración (min)', 'Fisioterapeuta', 'Estado', 'Motivo']),
    ...citas.map((c) =>
      fila([
        formatearFecha(c.inicio),
        formatearHora(c.inicio),
        c.duracionMin,
        c.fisioterapeuta,
        ESTADOS[c.estado],
        c.motivo,
      ]),
    ),
  ];

  return new Response(`\uFEFF${lineas.join('\r\n')}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="paciente-${p.id}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
