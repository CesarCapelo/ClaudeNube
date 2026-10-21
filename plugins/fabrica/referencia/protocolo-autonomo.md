# Protocolo de trabajo autónomo de la fábrica

Este protocolo es común a `crear-web` y `crear-app`. Explica cómo trabajar horas sin supervisión sin perder el hilo, sin parar a preguntar y sin entregar nada que no esté verificado.

## 1. Dos momentos, dos reglas

| Momento | Modo en el estado | Regla |
| --- | --- | --- |
| Entrevista (fase 0) | `entrevista` | Pregunta todo lo que haga falta, agrupado, con `AskUserQuestion`. Es la única ocasión de preguntar. |
| Producción (fase 1 hasta la entrega) | `autonomo` | No preguntes nunca. Decide, registra la decisión y sigue. |

Al terminar la entrevista, pasa a modo autónomo y **continúa en el mismo turno**, sin terminar tu respuesta ni esperar al usuario. El hook `Stop` del plugin no te dejará terminar mientras el proyecto esté en modo autónomo y sin entregar, y te recordará la siguiente tarea.

## 2. La herramienta de estado

En la preparación se copia `estado.mjs` a `.fabrica/herramientas/`. Desde la raíz del proyecto:

```bash
E=".fabrica/herramientas/estado.mjs"
node $E ver                                   # dónde estoy y qué sigue
node $E fase diseno                           # empiezo una fase (cierra las anteriores)
node $E nueva-tarea pag-inicio "Página de inicio" --fase construccion
node $E tarea pag-inicio en_curso
node $E tarea pag-inicio hecha "Auditoría sin fallos; capturas revisadas"
node $E tarea mapa bloqueada "Sin coordenadas; se deja el enlace a Google Maps"
node $E decision "Paleta verde salvia: sector bienestar y el logo es verde. Alternativa descartada: azul (demasiado corporativo)."
node $E pendiente-cliente "Confirmar el NIF y el domicilio social para el aviso legal"
node $E nota "Lighthouse móvil 98/100/100/100 en las 6 páginas"
node $E modo pausado                          # solo en caso extremo (ver sección 9)
node $E entregar                              # al final, tras la verificación completa
```

Cada comando reescribe `.fabrica/estado.json`, que es lo que leen los hooks. **Actualiza el estado cada vez que empieces o termines una tarea.** Si no lo haces, el hook interpretará que no avanzas y acabará dejándote parar con el trabajo a medias.

Ficheros de `.fabrica/`:

| Fichero | Contenido |
| --- | --- |
| `estado.json` | Fase, modo, tareas, permisos y pendientes (lo gestiona `estado.mjs`) |
| `brief.md` | Lo que dijo el cliente en la entrevista |
| `requisitos.md` | Qué se va a construir y cómo se comprobará |
| `plan.md` | Orden de trabajo y decisiones de alcance |
| `decisiones.md` | Decisiones tomadas sin preguntar, con su motivo |
| `pendientes-cliente.md` | Lo que el cliente debe aportar o confirmar |
| `bitacora.md` | Diario del trabajo |
| `auditoria/` | Informes y capturas de las auditorías (las capturas no se versionan) |

## 3. Cómo decidir sin preguntar

Cuando falte información, decide con este orden de prioridad:

1. Lo que dice `brief.md`.
2. Lo que se deduce de `requisitos.md` y del sector del cliente.
3. Las reglas y valores por defecto de la skill y de sus referencias.
4. La práctica habitual de una agencia profesional española con clientes pyme.
5. La opción más sencilla, más fácil de cambiar después y más barata de mantener.

Registra cada decisión relevante con `decision`, con este formato: qué se decidió, por qué y qué alternativa se descartó. Las decisiones triviales (el nombre de una variable, un margen) no se registran.

**Nunca inventes hechos del negocio**: precios, años de experiencia, número de clientes, premios, certificaciones, titulaciones, nombres de personas, testimonios ni reseñas. Si un texto los necesita:

- Redáctalo sin el dato («Años de experiencia en reformas» en vez de «20 años de experiencia»), o
- usa un marcador visible `PENDIENTE(cliente): descripción` y regístralo con `pendiente-cliente`.

Los testimonios y reseñas solo pueden ser reales y aportados por el cliente: publicar reseñas falsas es una práctica comercial desleal sancionable.

## 4. Ciclo de cada tarea

1. `tarea <id> en_curso`.
2. Hazla. Si toca varios ficheros independientes, valora delegarla (sección 6).
3. **Verifícala con un comando, nunca a ojo.** Compilación, tests, auditoría o captura revisada, según la tarea.
4. Haz un commit con un mensaje en castellano que diga qué cambia: `git add -A && git commit -m "Página de servicios con FAQ y datos estructurados"`.
5. `tarea <id> hecha "<cómo se verificó>"`.

Una tarea está **hecha** solo cuando su verificación ha pasado. «Debería funcionar» no es verificación.

## 5. Límites para no entrar en bucle

- Un mismo problema: como máximo 5 intentos con enfoques distintos. Antes del tercero, lee la documentación oficial (WebFetch si hay red) o el código de la dependencia en `node_modules`.
- Si al quinto sigue fallando: busca una alternativa más sencilla que cumpla el requisito (y regístrala como decisión) o marca la tarea `bloqueada` con el motivo, y sigue con otra.
- Nunca desactives un test, una regla de accesibilidad o una comprobación para que pase. Arregla la causa o documenta el bloqueo.
- Si un comando se cuelga, ponle `timeout`. Los servidores de desarrollo y de vista previa se lanzan en segundo plano y se paran al terminar.

## 6. Subagentes: trabajo en paralelo y revisiones con ojos limpios

Delegar mantiene limpio tu contexto y permite trabajar en paralelo. Úsalos para:

- **Construir piezas independientes**, como páginas distintas o módulos sin ficheros en común. Primero construye tú las piezas compartidas (componentes, estilos, tipos); después lanza en paralelo un subagente por pieza.
- **Revisar** con los agentes revisores del plugin (`fabrica:revisor-requisitos`, `fabrica:revisor-visual`, `fabrica:revisor-codigo`, `fabrica:revisor-seguridad`). No han visto cómo se construyó el producto, así que no heredan tus suposiciones.
- **Investigar** (web actual, competencia, documentación de una librería) sin llenar tu contexto.

Encargo tipo para un subagente constructor (rellena todos los apartados):

```text
Contexto: proyecto <tipo> para <cliente>. Lee .fabrica/brief.md, .fabrica/requisitos.md (sección <X>) y <referencias>.
Tu tarea: <qué construir>, cumpliendo estos criterios de aceptación: <lista>.
Ficheros que te pertenecen (solo puedes crear o modificar estos): <lista>.
Ficheros que NO debes tocar: <componentes compartidos, configuración, otros módulos>.
Reglas: <las 3-5 reglas de la skill más relevantes para esta pieza>.
Verificación obligatoria antes de terminar: <comandos exactos> deben pasar.
No hagas commits. No preguntes nada: si falta información, decide según el brief y anótalo en tu respuesta.
Respuesta: lista de ficheros cambiados, cómo lo verificaste (con la salida resumida) y decisiones tomadas.
```

Después de cada subagente, revisa su resultado (diff y verificación), integra, haz el commit tú y actualiza el estado. No lances en paralelo dos subagentes que puedan tocar el mismo fichero.

**Cómo lanzarlos en paralelo y esperar:** pon varias llamadas a la herramienta Agent en el mismo mensaje, cada una con `run_in_background: false`. Se ejecutan a la vez y recibes todos los resultados juntos. No los lances en segundo plano para luego esperarlos con `sleep` o bucles: en sesiones no interactivas, terminar el turno con tareas en segundo plano puede cerrar la sesión y perder sus resultados.

## 7. Cuidar el contexto en sesiones largas

- No vuelques ficheros enteros grandes (lockfiles, HTML compilado, registros largos). Usa `head`, `tail`, `grep` o delega en un subagente la lectura.
- Lee las capturas de pantalla de forma selectiva: primero móvil y escritorio de cada página, y la tableta solo si algo falla.
- Al terminar cada fase, escribe en la bitácora un resumen de 2 a 4 líneas: qué se hizo, qué se decidió y qué queda.
- Si el contexto se compacta o la sesión se reanuda, el hook `SessionStart` te recordará el proyecto. Entonces relee `node $E ver`, `.fabrica/plan.md`, las últimas 30 líneas de `.fabrica/bitacora.md` y `git log --oneline -15`, y continúa con la primera tarea sin terminar.

## 8. Problemas de entorno frecuentes

| Problema | Qué hacer |
| --- | --- |
| Node más antiguo que el requerido | Si existe `nvm`, `nvm install 24 && nvm use 24`. Si no, regístralo como bloqueo y pausa (sin Node no se puede construir). |
| Sin red | Sin instalar dependencias no se puede construir: comprueba la caché (`npm ci --offline`). Si tampoco hay caché, pausa y explícalo. La investigación web se omite y se registra. |
| `npm install` falla | Reintenta una vez; luego `npm cache verify`, borra `node_modules` y reintenta. Lee el error: suele ser una versión de Node o un conflicto de dependencias entre pares. |
| Falta el navegador de Playwright | `npx playwright install chromium`. Si no se puede, busca un Chrome o Chromium del sistema y exporta `PW_CHROMIUM_PATH=<ruta>` en cada comando de pruebas. Si no hay ninguno, regístralo: los tests de navegador y la auditoría visual quedarán sin hacer, y se dice en la entrega. |
| Puerto ocupado | Usa otro puerto (`--port 4322`) o para el servidor anterior. |
| Astro lanza el servidor en segundo plano | Astro detecta que lo ejecuta un agente. Usa `npx astro preview --background` y `npx astro preview stop`, o `--ignore-lock` para mantenerlo en primer plano. |
| Límite de uso de la cuenta | El estado ya está guardado. Al reanudar: `/fabrica:<skill> continuar`. |

## 9. Cuándo se puede parar

Solo hay tres salidas legítimas:

1. **Entregado**: todas las fases hechas, verificación final en verde, `ENTREGA.md` escrito y `node $E entregar`.
2. **Pausa justificada**: falta algo imprescindible que solo el usuario puede dar (por ejemplo, no hay forma de instalar dependencias) y no queda ninguna otra tarea que avanzar. Ejecuta `node $E modo pausado`, escribe el motivo en la bitácora y explícalo al usuario en 3 líneas: qué falta, por qué bloquea y cómo reanudar.
3. **Petición del usuario**: si el usuario escribe pidiendo parar, ejecuta `node $E modo pausado` y para.

No son motivos para parar: una tarea difícil (divídela), un error que no entiendes (investiga y reintenta), un dato del cliente que falta (marcador `PENDIENTE(cliente)`) ni una duda de diseño (decide y registra).

## 10. Mensajes al usuario durante el modo autónomo

El usuario puede no estar mirando. Al empezar cada fase, escribe una sola línea de progreso, por ejemplo: «Fase 4/8 — Contenido: redactando los textos de las 6 páginas». No hagas preguntas, no pidas confirmaciones y no resumas lo que ya está en la bitácora.
