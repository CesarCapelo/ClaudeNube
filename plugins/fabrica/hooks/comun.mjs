// Utilidades compartidas por los hooks de la fábrica.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export async function leerEntrada() {
  let texto = '';
  for await (const trozo of process.stdin) texto += trozo;
  try {
    return JSON.parse(texto || '{}');
  } catch {
    return {};
  }
}

// Busca el proyecto activo: primero en la raíz de la sesión y luego un nivel por debajo
// (la skill crea el proyecto en una subcarpeta si la raíz ya tenía otros ficheros).
export function buscarProyecto(entrada) {
  const raiz = process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
  const candidatos = [raiz, entrada.cwd].filter(Boolean);
  try {
    for (const nombre of readdirSync(raiz)) {
      if (nombre.startsWith('.') || nombre === 'node_modules') continue;
      const ruta = path.join(raiz, nombre);
      if (statSync(ruta).isDirectory()) candidatos.push(ruta);
    }
  } catch {}

  let mejor = null;
  for (const dir of new Set(candidatos)) {
    const fichero = path.join(dir, '.fabrica', 'estado.json');
    if (!existsSync(fichero)) continue;
    try {
      const estado = JSON.parse(readFileSync(fichero, 'utf8'));
      if (!mejor || estado.actualizado > mejor.estado.actualizado) mejor = { dir, fichero, estado };
    } catch {}
  }
  return mejor;
}

export const activo = (estado) => estado && estado.modo === 'autonomo';
