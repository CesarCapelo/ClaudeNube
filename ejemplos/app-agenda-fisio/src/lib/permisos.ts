import 'server-only';
import { ErrorPermiso } from './datos/errores';

// Matriz de permisos de la especificación (sección 2). La capa de datos llama a `exigirPermiso`;
// la interfaz usa `puede` solo para ocultar botones, nunca como única protección.
const REGLAS = {
  'pacientes:ver': ['admin', 'user'],
  'pacientes:editar': ['admin', 'user'],
  'pacientes:eliminar': ['admin'],
  'pacientes:exportar': ['admin'],
  'pacientes:sin-volver': ['admin'],
  'citas:ver': ['admin', 'user'],
  'citas:editar': ['admin', 'user'],
  'citas:eliminar': ['admin'],
  'actividad:ver': ['admin'],
  'cuentas:gestionar': ['admin'],
} as const satisfies Record<string, readonly string[]>;

export type Permiso = keyof typeof REGLAS;
export type UsuarioPermisos = { id: string; role?: string | null; banned?: boolean | null };

export function puede(usuario: UsuarioPermisos, permiso: Permiso) {
  if (usuario.banned) return false;
  return (REGLAS[permiso] as readonly string[]).includes(usuario.role ?? '');
}

export function exigirPermiso(usuario: UsuarioPermisos, permiso: Permiso) {
  if (!puede(usuario, permiso)) throw new ErrorPermiso();
}
