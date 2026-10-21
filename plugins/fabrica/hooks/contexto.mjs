#!/usr/bin/env node
// Hook SessionStart: al iniciar, reanudar o tras compactar el contexto, recuerda a Claude
// el proyecto de la fábrica en curso y dónde estaba, para que retome sin perder el hilo.
import { leerEntrada, buscarProyecto } from './comun.mjs';
import { resumen } from '../scripts/estado.mjs';

const entrada = await leerEntrada();
const proyecto = buscarProyecto(entrada);
if (!proyecto || ['entregado'].includes(proyecto.estado.modo)) process.exit(0);

const { estado, dir } = proyecto;
const skill = estado.skill;
const texto = [
  `Hay un proyecto de la fábrica en curso en ${dir} (skill ${skill}).`,
  resumen(estado),
  estado.modo === 'autonomo'
    ? `Está en modo autónomo: relee .fabrica/plan.md, las últimas líneas de .fabrica/bitacora.md y la skill /fabrica:${skill}, y continúa con la siguiente tarea sin preguntar al usuario.`
    : `Para retomarlo, el usuario puede ejecutar /fabrica:${skill} continuar.`,
].join('\n');

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: texto } }),
);
