#!/usr/bin/env node
// Hook Stop: mientras un proyecto de la fábrica esté en modo autónomo y sin entregar,
// impide que Claude termine el turno y le indica la siguiente tarea.
//
// Salvaguardas para no crear bucles:
// - Si hay tareas en segundo plano en marcha (subagentes, comandos), deja parar: la sesión
//   se reanudará sola cuando terminen.
// - Si Claude intenta parar 3 veces seguidas sin que el estado avance, deja parar y lo anota.
// - Claude Code limita además las continuaciones consecutivas por su cuenta.
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { leerEntrada, buscarProyecto, activo } from './comun.mjs';

const MAX_SIN_PROGRESO = 3;

const entrada = await leerEntrada();
const proyecto = buscarProyecto(entrada);
if (!proyecto || !activo(proyecto.estado)) process.exit(0);

const enMarcha = (entrada.background_tasks ?? []).filter((t) => t.status === 'running');
if (enMarcha.length > 0) process.exit(0);

const { estado, dir } = proyecto;
const guardia = path.join(dir, '.fabrica', '.guardia-parada.json');
let registro = { actualizado: null, intentos: 0 };
if (existsSync(guardia)) {
  try {
    registro = JSON.parse(readFileSync(guardia, 'utf8'));
  } catch {}
}

registro.intentos = registro.actualizado === estado.actualizado ? registro.intentos + 1 : 1;
registro.actualizado = estado.actualizado;
writeFileSync(guardia, JSON.stringify(registro));

if (registro.intentos > MAX_SIN_PROGRESO) {
  appendFileSync(
    path.join(dir, '.fabrica', 'bitacora.md'),
    `- ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' }).slice(0, 16)} · ${estado.fase} · Parada permitida: ${MAX_SIN_PROGRESO} intentos seguidos sin avance del estado. Reanudar con «continuar».\n`,
  );
  process.exit(0);
}

const siguientes = (estado.tareas ?? [])
  .filter((t) => t.estado === 'en_curso' || t.estado === 'pendiente')
  .slice(0, 4)
  .map((t) => `${t.id} (${t.titulo})`);

const motivo = [
  `El proyecto «${estado.nombre}» sigue en modo autónomo y no está entregado (fase: ${estado.fase}).`,
  'No esperes respuesta del usuario ni le hagas preguntas: continúa trabajando.',
  siguientes.length
    ? `Siguientes tareas: ${siguientes.join('; ')}.`
    : 'No quedan tareas registradas en esta fase: registra las de la fase siguiente o avanza de fase.',
  'Actualiza el estado con estado.mjs cada vez que avances.',
  'Si una tarea es imposible, márcala como bloqueada con su motivo y sigue con otra.',
  'Si de verdad necesitas parar (por ejemplo, falta algo que solo el usuario puede dar y no queda ninguna otra tarea), ejecuta «estado.mjs modo pausado» y explica el motivo.',
].join(' ');

process.stdout.write(JSON.stringify({ decision: 'block', reason: motivo }));
