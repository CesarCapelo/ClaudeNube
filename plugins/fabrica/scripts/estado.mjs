#!/usr/bin/env node
// Estado persistente de un proyecto de la fábrica, guardado en .fabrica/ dentro del proyecto.
//
// Es la memoria del trabajo autónomo: si la sesión se compacta, se corta o se reanuda otro día,
// el estado dice en qué fase está el proyecto, qué tareas quedan y qué se decidió.
// Los hooks del plugin leen el mismo fichero para no dejar que Claude se pare antes de entregar.
//
// Uso: node estado.mjs <comando> [argumentos]
//   iniciar --skill <crear-web|crear-app> [--nombre "Nombre del proyecto"]
//   ver                                   Resumen: fase, progreso, siguientes tareas, bloqueos
//   modo <entrevista|autonomo|pausado>
//   fase <id>                             Pasa a la fase indicada (cierra la anterior)
//   nueva-tarea <id> "<título>" [--fase <id>]
//   tarea <id> <pendiente|en_curso|hecha|bloqueada|descartada> ["nota"]
//   decision "<texto>"                    Decisión tomada sin preguntar (queda en decisiones.md)
//   nota "<texto>"                        Entrada en la bitácora
//   pendiente-cliente "<texto>"           Algo que el cliente debe aportar o confirmar
//   permiso <produccion|push> <si|no>
//   dato <clave> "<valor>"                Dato libre del proyecto (p. ej. url-previa)
//   entregar                              Marca el proyecto como entregado
//
// El directorio del proyecto es el actual; se puede cambiar con FABRICA_DIR.

import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const FASES = {
  'crear-web': [
    ['entrevista', 'Entrevista inicial'],
    ['preparacion', 'Preparación: requisitos, plan y proyecto base'],
    ['investigacion', 'Investigación: web actual, competencia y palabras clave'],
    ['diseno', 'Diseño: dirección visual y sistema de diseño'],
    ['contenido', 'Contenido: textos y SEO de cada página'],
    ['construccion', 'Construcción de páginas y funcionalidades'],
    ['calidad', 'Calidad: auditorías, revisiones y correcciones'],
    ['publicacion', 'Publicación de la versión de prueba'],
    ['entrega', 'Entrega: documentación e informe final'],
  ],
  'crear-app': [
    ['entrevista', 'Entrevista inicial'],
    ['especificacion', 'Especificación funcional'],
    ['arquitectura', 'Arquitectura, modelo de datos y plan'],
    ['base', 'Proyecto base: autenticación, datos, CI y diseño'],
    ['construccion', 'Construcción por funcionalidades'],
    ['calidad', 'Calidad: tests, seguridad, auditorías y correcciones'],
    ['publicacion', 'Publicación de la versión de prueba'],
    ['entrega', 'Entrega: documentación e informe final'],
  ],
};

const ESTADOS_TAREA = ['pendiente', 'en_curso', 'hecha', 'bloqueada', 'descartada'];

export function rutasFabrica(dir = process.env.FABRICA_DIR ?? process.cwd()) {
  const base = path.join(dir, '.fabrica');
  return {
    base,
    estado: path.join(base, 'estado.json'),
    bitacora: path.join(base, 'bitacora.md'),
    decisiones: path.join(base, 'decisiones.md'),
    pendientes: path.join(base, 'pendientes-cliente.md'),
  };
}

export async function leerEstado(dir) {
  const { estado } = rutasFabrica(dir);
  if (!existsSync(estado)) return null;
  return JSON.parse(await readFile(estado, 'utf8'));
}

const ahora = () => new Date().toISOString();
const fechaCorta = () => new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' }).slice(0, 16);

async function guardar(estado, rutas) {
  estado.actualizado = ahora();
  const temporal = `${rutas.estado}.tmp`;
  await writeFile(temporal, JSON.stringify(estado, null, 2) + '\n');
  await rename(temporal, rutas.estado);
}

async function bitacora(rutas, estado, texto) {
  await appendFile(rutas.bitacora, `- ${fechaCorta()} · ${estado.fase} · ${texto}\n`);
}

export function resumen(estado) {
  const tareas = estado.tareas ?? [];
  const hechas = tareas.filter((t) => ['hecha', 'descartada'].includes(t.estado)).length;
  const siguientes = tareas.filter((t) => ['en_curso', 'pendiente'].includes(t.estado)).slice(0, 6);
  const bloqueadas = tareas.filter((t) => t.estado === 'bloqueada');
  const faseActual = estado.fases.find((f) => f.id === estado.fase);
  const lineas = [
    `Proyecto: ${estado.nombre} (${estado.skill})`,
    `Modo: ${estado.modo} · Fase: ${estado.fase} — ${faseActual?.titulo ?? ''}`,
    `Fases: ${estado.fases.map((f) => `${f.estado === 'hecha' ? '✔' : f.id === estado.fase ? '▶' : '·'} ${f.id}`).join('  ')}`,
    `Tareas: ${hechas}/${tareas.length} terminadas`,
  ];
  if (siguientes.length) {
    lineas.push('Siguientes tareas:');
    for (const t of siguientes) lineas.push(`  - [${t.estado}] ${t.id}: ${t.titulo}`);
  }
  if (bloqueadas.length) {
    lineas.push('Bloqueadas:');
    for (const t of bloqueadas) lineas.push(`  - ${t.id}: ${t.titulo}${t.nota ? ` (${t.nota})` : ''}`);
  }
  if (estado.pendientesCliente?.length) {
    lineas.push(`Pendientes del cliente: ${estado.pendientesCliente.length} (ver .fabrica/pendientes-cliente.md)`);
  }
  return lineas.join('\n');
}

async function main() {
  const [comando, ...resto] = process.argv.slice(2);
  const rutas = rutasFabrica();
  const flag = (nombre) => {
    const i = resto.indexOf(`--${nombre}`);
    return i === -1 ? undefined : resto[i + 1];
  };
  const salir = (mensaje, codigo = 1) => {
    console.error(mensaje);
    process.exit(codigo);
  };

  if (comando === 'iniciar') {
    const skill = flag('skill');
    if (!FASES[skill]) salir(`--skill debe ser uno de: ${Object.keys(FASES).join(', ')}`);
    await mkdir(rutas.base, { recursive: true });
    const existente = await leerEstado();
    if (existente) {
      console.log('Ya existe un proyecto en este directorio. Estado actual:\n');
      console.log(resumen(existente));
      return;
    }
    const estado = {
      version: 1,
      skill,
      nombre: flag('nombre') ?? path.basename(process.cwd()),
      creado: ahora(),
      actualizado: ahora(),
      modo: 'entrevista',
      fase: 'entrevista',
      fases: FASES[skill].map(([id, titulo], i) => ({
        id,
        titulo,
        estado: i === 0 ? 'en_curso' : 'pendiente',
      })),
      tareas: [],
      permisos: { produccion: false, push: false },
      pendientesCliente: [],
      datos: {},
    };
    await guardar(estado, rutas);
    await writeFile(rutas.bitacora, `# Bitácora de ${estado.nombre}\n\n`);
    await writeFile(
      rutas.decisiones,
      `# Decisiones tomadas durante el trabajo autónomo\n\nCada decisión se tomó sin preguntar, con el criterio indicado. Revísalas en la entrega.\n\n`,
    );
    await writeFile(rutas.pendientes, `# Pendientes del cliente\n\nDatos o materiales que el cliente debe aportar o confirmar antes de publicar.\n\n`);
    await bitacora(rutas, estado, 'Proyecto iniciado');
    console.log(resumen(estado));
    return;
  }

  const estado = await leerEstado();
  if (!estado) salir('No hay proyecto en este directorio. Ejecuta primero: estado.mjs iniciar --skill <crear-web|crear-app>');

  switch (comando) {
    case 'ver':
      console.log(resumen(estado));
      return;

    case 'modo': {
      const modo = resto[0];
      if (!['entrevista', 'autonomo', 'pausado'].includes(modo)) salir('Modo: entrevista | autonomo | pausado');
      estado.modo = modo;
      await bitacora(rutas, estado, `Modo ${modo}`);
      break;
    }

    case 'fase': {
      const id = resto[0];
      const fase = estado.fases.find((f) => f.id === id);
      if (!fase) salir(`Fase desconocida. Fases: ${estado.fases.map((f) => f.id).join(', ')}`);
      for (const f of estado.fases) {
        if (f.id === id) break;
        if (f.estado !== 'hecha') f.estado = 'hecha';
      }
      fase.estado = 'en_curso';
      estado.fase = id;
      await bitacora(rutas, estado, `Comienza la fase: ${fase.titulo}`);
      break;
    }

    case 'nueva-tarea': {
      const [id, titulo] = resto;
      if (!id || !titulo) salir('Uso: nueva-tarea <id> "<título>" [--fase <id>]');
      if (estado.tareas.some((t) => t.id === id)) salir(`Ya existe la tarea ${id}`);
      estado.tareas.push({ id, titulo, fase: flag('fase') ?? estado.fase, estado: 'pendiente', actualizado: ahora() });
      break;
    }

    case 'tarea': {
      const [id, nuevoEstado, nota] = resto;
      const tarea = estado.tareas.find((t) => t.id === id);
      if (!tarea) salir(`No existe la tarea ${id}`);
      if (!ESTADOS_TAREA.includes(nuevoEstado)) salir(`Estado: ${ESTADOS_TAREA.join(' | ')}`);
      tarea.estado = nuevoEstado;
      tarea.actualizado = ahora();
      if (nota) tarea.nota = nota;
      await bitacora(rutas, estado, `Tarea ${id} → ${nuevoEstado}${nota ? `: ${nota}` : ''}`);
      break;
    }

    case 'decision': {
      const texto = resto.join(' ');
      if (!texto) salir('Uso: decision "<texto>"');
      estado.contadorDecisiones = (estado.contadorDecisiones ?? 0) + 1;
      await appendFile(rutas.decisiones, `${estado.contadorDecisiones}. (${fechaCorta()}, fase ${estado.fase}) ${texto}\n`);
      break;
    }

    case 'nota':
      await bitacora(rutas, estado, resto.join(' '));
      break;

    case 'pendiente-cliente': {
      const texto = resto.join(' ');
      if (!texto) salir('Uso: pendiente-cliente "<texto>"');
      if (!estado.pendientesCliente.includes(texto)) {
        estado.pendientesCliente.push(texto);
        await appendFile(rutas.pendientes, `- [ ] ${texto}\n`);
      }
      break;
    }

    case 'permiso': {
      const [clave, valor] = resto;
      if (!['produccion', 'push'].includes(clave) || !['si', 'no'].includes(valor)) salir('Uso: permiso <produccion|push> <si|no>');
      estado.permisos[clave] = valor === 'si';
      await bitacora(rutas, estado, `Permiso ${clave}: ${valor}`);
      break;
    }

    case 'dato': {
      const [clave, ...valor] = resto;
      if (!clave) salir('Uso: dato <clave> "<valor>"');
      estado.datos[clave] = valor.join(' ');
      break;
    }

    case 'entregar':
      for (const f of estado.fases) f.estado = 'hecha';
      estado.fase = 'entrega';
      estado.modo = 'entregado';
      await bitacora(rutas, estado, 'Proyecto entregado');
      break;

    default:
      salir('Comando desconocido. Comandos: iniciar, ver, modo, fase, nueva-tarea, tarea, decision, nota, pendiente-cliente, permiso, dato, entregar');
  }

  await guardar(estado, rutas);
  console.log(resumen(estado));
}

// Solo se ejecuta como programa; los hooks lo importan como módulo.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('estado.mjs')) {
  await main();
}
