#!/usr/bin/env node
// Hook PreToolUse: en proyectos de la fábrica, bloquea acciones peligrosas o irreversibles.
// - Leer o modificar secretos de producción.
// - Comandos destructivos (borrados masivos, reescritura del historial remoto).
// - Publicar en producción o subir el código sin permiso registrado en .fabrica/estado.json.
// Fuera de un proyecto de la fábrica no hace nada.
import { leerEntrada, buscarProyecto } from './comun.mjs';

const entrada = await leerEntrada();
const proyecto = buscarProyecto(entrada);
if (!proyecto) process.exit(0);

const permisos = proyecto.estado.permisos ?? {};
const herramienta = entrada.tool_name ?? '';
const datos = entrada.tool_input ?? {};

const SECRETOS = [
  /(^|\/)\.env\.(production|prod)(\.[\w-]+)?$/i,
  /(^|\/)\.env\.[\w.-]*prod[\w.-]*$/i,
  /\.(pem|p12|pfx|key|keystore|jks)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/i,
  /(^|\/)secrets?\//i,
  /(^|\/)\.fabrica\/secretos/i,
  /(^|\/)service-account[\w-]*\.json$/i,
];

function denegar(motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Bloqueado por la fábrica: ${motivo}`,
      },
    }),
  );
  process.exit(0);
}

const rutaFichero = datos.file_path ?? datos.path ?? datos.notebook_path ?? '';
if (['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(herramienta) && rutaFichero) {
  if (SECRETOS.some((re) => re.test(rutaFichero))) {
    denegar(`«${rutaFichero}» contiene secretos de producción. Usa variables de entorno de desarrollo (.env.local) o pide al usuario que configure el secreto en el proveedor.`);
  }
}

if (herramienta === 'Bash') {
  const comando = String(datos.command ?? '');
  const reglas = [
    [/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\s+(\/|~|\$HOME|\.\.|\*)(\s|$)/i, 'borrado recursivo de un directorio raíz, personal o superior'],
    [/\bgit\s+push\b[^\n]*(--force\b|--force-with-lease\b|\s-f\b)/i, 'reescritura del historial remoto (push forzado)'],
    [/\bgit\s+reset\s+--hard\s+origin/i, 'descartar el trabajo local frente al remoto'],
    [/\bgit\s+clean\s+-[a-z]*x/i, 'borrado de ficheros ignorados (incluiría .fabrica y configuraciones)'],
    [/\bnpm\s+publish\b/i, 'publicar un paquete en npm'],
    [/\b(curl|wget)\b[^|\n]*\|\s*(sudo\s+)?(ba|z)?sh\b/i, 'ejecutar un script descargado de internet'],
    [/\bsudo\b/i, 'uso de sudo'],
    [/\bdrop\s+(database|schema)\b/i, 'borrado de una base de datos'],
    [/\b(supabase\s+db\s+reset\s+--linked|prisma\s+migrate\s+reset)\b/i, 'reinicio de una base de datos remota'],
  ];
  for (const [re, motivo] of reglas) if (re.test(comando)) denegar(motivo);

  if (SECRETOS.some((re) => comando.split(/\s+/).some((parte) => re.test(parte.replace(/^['"]|['"]$/g, ''))))) {
    denegar('el comando accede a un fichero de secretos de producción');
  }

  const produccion = [
    /\bvercel\b[^\n]*\s--prod\b/i,
    /\bvercel\s+(deploy\s+)?--prod/i,
    /\bnetlify\s+deploy\b[^\n]*\s--prod\b/i,
    /\bwrangler\s+(deploy|publish)\b/i,
    /\bwrangler\s+pages\s+deploy\b(?![^\n]*--branch[ =](?!main\b|master\b|production\b))/i,
    /\beas\s+submit\b/i,
    /\bfirebase\s+deploy\b/i,
    /\bfly\s+deploy\b/i,
    /\brailway\s+up\b/i,
  ];
  if (!permisos.produccion && produccion.some((re) => re.test(comando))) {
    denegar('publicar en producción requiere permiso del usuario (registrado en la entrevista). Despliega solo una versión de prueba y deja la publicación final documentada en la entrega.');
  }

  if (!permisos.push && /\bgit\s+push\b/i.test(comando)) {
    denegar('subir el código a un repositorio remoto requiere permiso del usuario (registrado en la entrevista). Haz commits locales.');
  }
}

process.exit(0);
