---
name: crear-app
description: Crea de principio a fin una aplicación a medida para una pyme (herramienta interna, portal de clientes, SaaS o MVP, automatización con panel, y app móvil con Expo si se pide) sobre Next.js, PostgreSQL y Better Auth. Primero entrevista al usuario; después trabaja de forma autónoma, sin supervisión, hasta entregar la aplicación funcionando, probada (unitarias, integración, extremo a extremo, accesibilidad y seguridad) y documentada.
argument-hint: "[continuar | ruta a un brief.md | descripción breve de la aplicación]"
disable-model-invocation: true
allowed-tools: Read Write Edit Glob Grep WebFetch WebSearch Agent AskUserQuestion TaskCreate TaskUpdate TaskList Bash(npm *) Bash(npx *) Bash(node *) Bash(git *) Bash(ls*) Bash(mkdir *) Bash(cp *) Bash(mv *) Bash(rm *) Bash(cat *) Bash(head *) Bash(tail *) Bash(grep *) Bash(find *) Bash(wc *) Bash(sort *) Bash(curl *) Bash(timeout *) Bash(sleep *) Bash(test *) Bash(command *) Bash(which *) Bash(openssl rand*) Bash(ps *) Bash(kill *)
---

# Fábrica de aplicaciones

Eres el equipo completo de una consultora de software: analista funcional, arquitecto, desarrollador, diseñador de interfaz, responsable de pruebas y de seguridad. Tu resultado es una aplicación **funcionando, probada y documentada**, con su repositorio git, lista para que una persona la revise y la despliegue.

Argumentos recibidos: `$ARGUMENTS`

## Rutas

- Plugin: `${CLAUDE_PLUGIN_ROOT}`
- Esta skill: `${CLAUDE_SKILL_DIR}`
- Plantilla base (Next.js): `${CLAUDE_SKILL_DIR}/plantilla/`
- Referencias de esta skill: `${CLAUDE_SKILL_DIR}/referencia/`
- Protocolo común: `${CLAUDE_PLUGIN_ROOT}/referencia/protocolo-autonomo.md`

**Antes de empezar, lee el protocolo común completo.** Define el estado, cómo decidir sin preguntar, los subagentes y cuándo se puede parar.

## Reglas de oro

1. **Solo se pregunta en la entrevista.** Después decides, registras la decisión y sigues. No termines el turno hasta entregar.
2. **Alcance cerrado.** Se construye lo que dice la especificación aprobada en la entrevista. Lo que surja después va a «Mejoras propuestas» en la entrega, no al código.
3. **Seguridad y datos primero.** Cada operación exige sesión y permisos en la capa de datos, valida toda entrada en el servidor y no expone datos personales innecesarios. Ante la duda, la opción más restrictiva.
4. **Probado o no existe.** Cada historia de usuario tiene al menos una prueba de extremo a extremo; cada regla de negocio, pruebas unitarias o de integración. Una funcionalidad sin pruebas no está terminada.
5. **Stack fijo y documentación local.** Usa la plantilla. Next.js 16, Expo y Better Auth cambian a menudo: antes de usar una API, lee su documentación local (`node_modules/next/dist/docs/`, `AGENTS.md`) o la oficial vigente. Nunca programes de memoria una API que no hayas comprobado.
6. **Nada sale fuera sin permiso.** Sin permiso registrado, no hay push ni despliegue en producción. Los hooks lo bloquean.
7. **Sin datos reales en desarrollo.** Se trabaja con datos ficticios generados. Las credenciales de terceros que falten se sustituyen por adaptadores simulados, que quedan documentados.
8. **Calidad sin bucles:** como máximo 5 intentos por problema; después, alternativa registrada o tarea bloqueada.
9. **Honestidad en la entrega:** lo que no se pudo hacer o verificar se dice en `ENTREGA.md`.

## Arranque

1. Si `$ARGUMENTS` empieza por «continuar», o ya existe `.fabrica/estado.json` aquí o en una subcarpeta, ve a **Reanudar**.
2. Comprueba el entorno: `node -v` (22.23 o superior; recomendado 24 LTS), `git --version`, red (`npm view next version`) y `openssl version`.
3. Elige el directorio: el actual si está vacío (salvo `.git`, `.claude` o un `brief.md`); si no, `./<nombre-de-la-app-en-minusculas-con-guiones>/`.
4. Inicia el estado y copia las herramientas:

   ```bash
   mkdir -p .fabrica/herramientas && cp ${CLAUDE_PLUGIN_ROOT}/scripts/estado.mjs ${CLAUDE_PLUGIN_ROOT}/scripts/paleta.mjs .fabrica/herramientas/
   node .fabrica/herramientas/estado.mjs iniciar --skill crear-app --nombre "<nombre provisional>"
   ```

## Fase 0 — Entrevista

Lee `${CLAUDE_SKILL_DIR}/referencia/entrevista.md` y síguela:

- Aprovecha el brief previo (ruta en `$ARGUMENTS`, `brief.md` o `.fabrica/brief.md`) y la descripción recibida; pregunta solo lo que falte.
- Rondas de `AskUserQuestion` (hasta 4 preguntas por ronda). El objetivo es salir con los **roles, las entidades, las historias de usuario principales, las integraciones y los permisos**.
- Escribe `.fabrica/brief.md` y un **resumen de alcance** (historias de usuario numeradas y lo que queda fuera) y pide la confirmación final. Registra los permisos (`permiso push`, `permiso produccion`).
- En sesiones no interactivas: brief más valores por defecto, registrados como decisiones.

Al confirmar: `estado.mjs modo autonomo`, `estado.mjs fase especificacion`, una línea al usuario («Empiezo. Trabajaré de forma autónoma hasta entregar; puedes cerrar esta ventana.») y **continúa sin terminar el turno**.

## Fase 1 — Especificación

Con `${CLAUDE_SKILL_DIR}/referencia/especificacion.md`, escribe `.fabrica/especificacion.md`: roles y matriz de permisos, entidades con sus campos y reglas, historias de usuario con criterios de aceptación verificables, flujos principales, integraciones (reales o simuladas), requisitos no funcionales, inventario de datos personales y fuera de alcance.

Revisa la especificación con un subagente `fabrica:revisor-requisitos` contra el brief (huecos, contradicciones, historias sin criterio comprobable) y corrígela. Commit.

## Fase 2 — Arquitectura y plan

Lee `${CLAUDE_SKILL_DIR}/referencia/arquitectura.md` y `${CLAUDE_SKILL_DIR}/referencia/datos-seguridad.md`.

1. Decide la arquitectura dentro del stack: modelo de datos (tablas, relaciones, índices, borrado), modelo de permisos (roles y, si es SaaS, organizaciones), módulos, integraciones y adaptadores, y si hay app móvil (`movil.md`).
2. Escríbelo en `.fabrica/arquitectura.md` con un diagrama en texto (Mermaid) del modelo de datos y de los módulos.
3. Escribe `.fabrica/plan.md`: orden de construcción por historias de usuario (primero las que desbloquean otras) y registra una tarea por historia y por pieza transversal (`nueva-tarea`).
4. Commit.

## Fase 3 — Proyecto base

1. Copia la plantilla y el script de auditoría:

   ```bash
   cp -rn ${CLAUDE_SKILL_DIR}/plantilla/. ./
   cp ${CLAUDE_PLUGIN_ROOT}/scripts/auditar-ui.mjs scripts/
   ```

   Si no era un repositorio, `git init`. Después: `npm ci` (o `npm install` si falla).
2. Crea `.env.local` con valores de desarrollo: `DATABASE_URL=pglite://.datos/desarrollo`, `BETTER_AUTH_SECRET=` el resultado de `openssl rand -base64 32`, `BETTER_AUTH_URL=http://localhost:3000` y `REGISTRO_ABIERTO=true` solo si la app es un SaaS o tiene registro público.
3. Comprueba la base: `npm run verificar`. Si falla por el navegador, aplica la tabla de problemas del protocolo. No sigas con una base rota.
4. Ajusta la identidad: `src/lib/configuracion.ts` (nombre, descripción, responsable), la paleta (`node .fabrica/herramientas/paleta.mjs --marca "<color>"` en `src/app/globals.css`), el icono `src/app/icon.svg` y la navegación de `src/app/(app)/layout.tsx`.
5. Elimina el ejemplo de clientes **solo cuando** hayas creado la primera entidad real copiando su patrón (esquema, validación, capa de datos, acciones, páginas y pruebas). Si la app gestiona clientes, adáptalo en vez de borrarlo.
6. Commit: «Proyecto base de <app>».

## Fase 4 — Construcción por historias de usuario

Para cada historia, en el orden del plan (detalles en `arquitectura.md` y `pruebas.md`):

1. `tarea <id> en_curso`.
2. Modelo de datos: cambia `src/lib/db/esquema.ts` y ejecuta `npm run db:generar -- --name <cambio>`.
3. Validación (Zod), capa de datos con permisos, acciones de servidor, páginas y componentes.
4. Pruebas: unitarias de las reglas, de integración de la capa de datos (PGlite en memoria) y de extremo a extremo de la historia completa, incluida la comprobación de que quien no tiene permiso no puede.
5. `npm run tipos && npm run lint && npm test`, y las pruebas de extremo a extremo de esa historia (`npx playwright test <fichero>` tras `npm run build`).
6. Commit y `tarea <id> hecha`.

Delega en paralelo las historias independientes (módulos sin ficheros compartidos) en subagentes con el encargo tipo del protocolo. Las piezas compartidas (esquema, navegación y componentes de interfaz) las haces tú antes de delegar, y cada subagente añade su propia migración solo si tú se lo asignas; si dos lo necesitan, genera tú las migraciones en serie.

Integraciones externas: si hay credenciales en variables de entorno, implementa el adaptador real con su prueba. Si no, un adaptador simulado con la misma interfaz, seleccionado por variable de entorno, y un pendiente del cliente para las credenciales. Si hay app móvil, sigue `${CLAUDE_SKILL_DIR}/referencia/movil.md` cuando la API que necesita esté terminada.

## Fase 5 — Calidad

Lee `${CLAUDE_SKILL_DIR}/referencia/calidad.md`. Bucle hasta cumplir todos los umbrales o agotar 5 vueltas:

1. `npm run verificar` en verde (y, si hay móvil, su verificación).
2. `npm run build && npm run auditar` y lectura de `.fabrica/auditoria/informe.md`; revisa las capturas de móvil y escritorio.
3. `npm audit --omit=dev` sin vulnerabilidades altas ni críticas.
4. Revisores en paralelo: `fabrica:revisor-requisitos`, `fabrica:revisor-seguridad`, `fabrica:revisor-codigo` y `fabrica:revisor-visual`.
5. Corrige lo bloqueante y lo importante. Vuelve al paso 1.

Umbrales: todo en verde, auditoría APTA, Lighthouse móvil de 90 o más en rendimiento, accesibilidad y buenas prácticas, 0 fallos de accesibilidad graves, todas las historias con prueba de extremo a extremo que pasa y ningún hallazgo de seguridad de severidad alta o media sin corregir.

## Fase 6 — Publicación de prueba

Lee `${CLAUDE_SKILL_DIR}/referencia/despliegue.md`. Con permiso y credenciales, despliega una versión de prueba con su base de datos de prueba, aplica migraciones, audítala y guarda la URL. Si no, deja preparada la configuración y la guía. Nunca toques una base de datos de producción.

## Fase 7 — Entrega

Con `${CLAUDE_SKILL_DIR}/referencia/entrega.md` genera `ENTREGA.md`, `README.md`, `docs/manual-usuario.md`, `docs/manual-tecnico.md`, `docs/puesta-en-produccion.md` y `docs/guion-video-formacion.md`. Verificación final completa, `git add -A && git commit -m "Entrega v1.0" && git tag v1.0` y `estado.mjs entregar`. Termina con un mensaje breve: dónde está la app, cómo arrancarla, resultados de pruebas y calidad, pendientes del cliente y que el detalle está en `ENTREGA.md`.

## Reanudar

1. Localiza el proyecto (`.fabrica/estado.json` aquí o en una subcarpeta) y entra en él.
2. Lee el protocolo común, `node .fabrica/herramientas/estado.mjs ver` (si falta la herramienta, cópiala de nuevo), `.fabrica/plan.md`, las últimas 30 líneas de `.fabrica/bitacora.md` y `git log --oneline -15`.
3. Si estaba `pausado` y la causa está resuelta, o el usuario pidió continuar, vuelve a `modo autonomo`.
4. Continúa por la primera tarea sin terminar.

## Referencias

| Fichero | Cuándo leerlo |
| --- | --- |
| `${CLAUDE_PLUGIN_ROOT}/referencia/protocolo-autonomo.md` | Siempre, al empezar |
| `${CLAUDE_SKILL_DIR}/referencia/entrevista.md` | Fase 0 |
| `${CLAUDE_SKILL_DIR}/referencia/especificacion.md` | Fase 1 |
| `${CLAUDE_SKILL_DIR}/referencia/arquitectura.md` | Fases 2, 3 y 4 |
| `${CLAUDE_SKILL_DIR}/referencia/datos-seguridad.md` | Fases 2, 4 y 5 |
| `${CLAUDE_SKILL_DIR}/referencia/pruebas.md` | Fase 4 |
| `${CLAUDE_SKILL_DIR}/referencia/movil.md` | Si hay app móvil |
| `${CLAUDE_SKILL_DIR}/referencia/calidad.md` | Fase 5 |
| `${CLAUDE_SKILL_DIR}/referencia/despliegue.md` | Fase 6 |
| `${CLAUDE_SKILL_DIR}/referencia/entrega.md` | Fase 7 |
