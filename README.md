# ClaudeNube: la fábrica de webs y aplicaciones

Plugin de Claude Code con dos skills que producen un producto completo de forma autónoma:

| Comando | Qué entrega |
| --- | --- |
| `/fabrica:crear-web` | Una web profesional para una pyme o un autónomo (Astro 7 + Tailwind 4): diseño, textos SEO, páginas legales (RGPD y LSSI), formulario, accesibilidad WCAG 2.2 AA, Lighthouse de 90 o más, documentación y guía de publicación |
| `/fabrica:crear-app` | Una aplicación a medida (Next.js 16 + PostgreSQL + Better Auth), como una herramienta interna, un portal de clientes, un SaaS o MVP, y app móvil con Expo si se pide: especificación, arquitectura, autenticación con roles, pruebas unitarias, de integración y de extremo a extremo, revisión de seguridad y documentación |

Las dos funcionan igual:

1. **Entrevista**: te hacen todas las preguntas al principio, en 4 o 5 rondas. Si les das un brief ya relleno, solo preguntan lo que falte.
2. **Trabajo autónomo**: a partir de tu confirmación no vuelven a preguntar. Deciden con criterios documentados, registran cada decisión y siguen hasta entregar. Puedes cerrar la ventana.
3. **Entrega**: el proyecto queda en un repositorio git con `ENTREGA.md`, un informe para la persona que revisa con resultados de calidad, decisiones, pendientes del cliente y una checklist de revisión.

## Qué hay dentro

```text
.claude-plugin/marketplace.json     Marketplace «fabrica-ia» con el plugin
plugins/fabrica/
  skills/crear-web/                 Skill de webs: SKILL.md, referencias y plantilla Astro probada
  skills/crear-app/                 Skill de apps: SKILL.md, referencias y plantilla Next.js probada
  agents/                           Revisores independientes: requisitos, visual, código y seguridad
  hooks/                            Trabajo continuo, recuperación de contexto y protecciones
  scripts/                          estado.mjs (memoria del proyecto), auditar-ui.mjs (auditoría), paleta.mjs (colores accesibles)
  referencia/protocolo-autonomo.md  Reglas comunes del trabajo sin supervisión
plantillas/                         Briefs para rellenar tras la reunión con el cliente
instalar.mjs                        Instalación dentro de un proyecto (para sesiones en la nube)
```

### Cómo se garantiza la calidad sin supervisión

- **Plantillas probadas.** Cada proyecto parte de una base que ya pasa todas las comprobaciones: la web, con Lighthouse 100 en las cuatro categorías y 17 pruebas en móvil y escritorio; la app, con 8 pruebas unitarias y de integración y 27 de extremo a extremo.
- **Auditoría automática** (`auditar-ui.mjs`): recorre todas las páginas, hace capturas en móvil, tableta y escritorio, pasa axe (accesibilidad), comprueba SEO, enlaces rotos, errores de consola, desbordamientos y textos de relleno, y ejecuta Lighthouse, también con sesión iniciada en las apps.
- **Revisores con ojos limpios**: cuatro agentes que no han visto la construcción revisan los requisitos, el diseño, el código y la seguridad.
- **Verificar es ejecutar**: una tarea solo está hecha cuando su comprobación pasa. Hay como máximo 5 intentos por problema; después se registra el bloqueo, sin entrar en bucles.
- **Nada inventado**: nunca se inventan datos del negocio, testimonios ni reseñas. Lo que falta se marca como `PENDIENTE(cliente)` y se lista en la entrega.

### Hooks de seguridad y continuidad

Solo actúan en proyectos creados por la fábrica (los que tienen una carpeta `.fabrica/`):

- **Stop**: mientras el proyecto está en modo autónomo y sin entregar, no deja que Claude termine el turno y le indica la siguiente tarea. Si no hay avance en 3 intentos seguidos, o si hay tareas en segundo plano, le deja parar para no entrar en bucle.
- **SessionStart**: al reanudar o tras compactar el contexto, recuerda en qué fase estaba el proyecto.
- **PreToolUse**: bloquea leer secretos de producción, borrados masivos, push forzado, publicar en producción y subir el código sin el permiso dado en la entrevista.

## Instalación

Requisitos en el ordenador: **Node.js 24 LTS** (mínimo 22.23), git y conexión a internet. La primera vez, para las pruebas en navegador: `npx playwright install chromium`.

### En tu ordenador (CLI, escritorio o extensiones de editor)

```bash
claude plugin marketplace add CesarCapelo/ClaudeNube
claude plugin install fabrica@fabrica-ia
```

Si el repositorio es privado, tu git tiene que poder clonarlo (por ejemplo, con sesión iniciada en `gh`). Para actualizar: `claude plugin marketplace update fabrica-ia`.

Para que todo el equipo lo tenga en un repositorio de cliente, añade a su `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "fabrica-ia": { "source": { "source": "github", "repo": "CesarCapelo/ClaudeNube" } }
  },
  "enabledPlugins": { "fabrica@fabrica-ia": true }
}
```

### En sesiones en la nube (claude.ai/code y app móvil)

Las sesiones en la nube no cargan plugins de un marketplace, pero sí las skills, los agentes y los hooks que vienen en el repositorio. Instala la fábrica dentro del repositorio del cliente y súbela:

```bash
node instalar.mjs ../repositorio-del-cliente
cd ../repositorio-del-cliente && git add .claude && git commit -m "Fábrica de Claude Code" && git push
```

En ese repositorio, los comandos son `/crear-web` y `/crear-app` (sin el prefijo `fabrica:`).

## Uso

1. Crea una carpeta vacía (o un repositorio vacío) para el proyecto y abre Claude Code en ella.
2. Ejecuta `/fabrica:crear-web` o `/fabrica:crear-app`. Opcionalmente pásale un brief: `/fabrica:crear-web brief-panaderia.md` (plantillas en `plantillas/`) o una descripción: `/fabrica:crear-web panadería artesana en Getafe con encargos por WhatsApp`.
3. Responde a la entrevista y confirma.
4. Déjalo trabajar. Puedes cerrar la ventana si la sesión sigue viva (en la nube) o dejar el terminal abierto (en local).
5. Cuando termine, abre `ENTREGA.md` y sigue su checklist de revisión.

Si se interrumpe (por cerrar el terminal o por el límite de uso de la cuenta), retómalo en la misma carpeta con `/fabrica:crear-web continuar` (o `crear-app`). El estado completo está en `.fabrica/`.

### Trabajar sin que Claude pida permisos

Para dejarlo trabajando sin mirar, Claude no debe quedarse esperando a que apruebes un comando:

- **En la nube** (recomendado para dejarlo horas): la sesión corre en una máquina aislada. Elige un modo de permisos que no pregunte al crear la sesión.
- **En local, dentro de un contenedor o máquina virtual**: `claude --dangerously-skip-permissions`. Los hooks de la fábrica siguen bloqueando las acciones peligrosas.
- **En local, en tu ordenador de trabajo**: `claude --permission-mode acceptEdits`. Las plantillas incluyen en `.claude/settings.json` una lista de comandos permitidos (npm, npx, node, git sin push…) que evita la mayoría de preguntas. Claude Code solo la aplica cuando has aceptado el aviso de confianza de la carpeta; ábrela una vez en modo interactivo y acéptalo.

Mantén el ordenador encendido y sin suspensión mientras trabaja. Como referencia, en la prueba real de este repositorio una web profesional de 6 páginas, con todas sus fases (investigación, diseño, textos, construcción, dos vueltas de calidad con revisores y documentación), tardó 32 minutos. Las aplicaciones tardan varias horas según el número de historias de usuario.

### Qué queda en cada proyecto

| Fichero | Para qué |
| --- | --- |
| `ENTREGA.md` | Informe para la persona que revisa: resultados, decisiones, pendientes y checklist |
| `docs/` | Manual del cliente o de usuario, manual técnico, guía de puesta en producción y guion del vídeo de formación |
| `.fabrica/brief.md`, `requisitos.md` o `especificacion.md` | Lo acordado |
| `.fabrica/decisiones.md` | Cada decisión tomada sin preguntar, con su motivo |
| `.fabrica/pendientes-cliente.md` | Lo que el cliente debe aportar o confirmar |
| `.fabrica/bitacora.md` | El diario del trabajo |
| `CLAUDE.md` | Guía para que Claude Code mantenga el proyecto después |

## Flujo de trabajo de la empresa

1. **Comercial**: tras la reunión, rellena `plantillas/brief-web.md` o `plantillas/brief-app.md`.
2. **Supervisor**: crea el repositorio del proyecto, lanza la skill con el brief, responde a lo que falte y la deja trabajar. Puede llevar varios proyectos en paralelo, con una sesión por proyecto.
3. **Supervisor**: revisa con la checklist de `ENTREGA.md`, corrige con Claude lo que haga falta y, en las puertas de calidad, pide la revisión cruzada al otro supervisor.
4. **Comercial**: presenta al cliente, recoge los pendientes y los cambios, y se publica con `docs/puesta-en-produccion.md`.

## Mantenimiento de la fábrica

- **Plantillas**: `plugins/fabrica/skills/*/plantilla/`. Tras cambiarlas, en cada una: `npm ci && npm run verificar` (en la de apps, con un `.env.local` como el de `.env.example`). Actualiza las dependencias cada 2 o 3 meses y vuelve a verificar.
- **Validación del plugin**: `claude plugin validate ./plugins/fabrica` y `claude plugin validate .`.
- **Versiones**: sube `version` en `plugins/fabrica/.claude-plugin/plugin.json` en cada cambio para que los equipos reciban la actualización.
- **Mejora continua**: cuando una revisión humana encuentre un defecto repetido, añade la regla a la referencia correspondiente, a la checklist de calidad o a una comprobación automática, para que no vuelva a pasar.

## Limitaciones conocidas

- **Imágenes**: Claude no genera fotografías. Sin fotos del cliente, la web usa composiciones gráficas e iconos, y lista las fotos reales que faltan.
- **Integraciones reales** (correo, pagos, calendarios, publicación): necesitan credenciales del cliente. Sin ellas, la app usa adaptadores simulados y lo documenta.
- **Apps móviles**: se verifican en su versión web. Las pruebas en dispositivo real y la publicación en las tiendas de Apple y Google se hacen a mano, con la guía que genera la skill.
- **Textos legales**: plantillas sólidas basadas en la normativa española, pero el cliente o su asesor debe revisarlas antes de publicar.
- **Frameworks**: Astro, Next.js, Expo y Better Auth cambian a menudo. Las skills obligan a leer su documentación vigente, pero conviene revisar las plantillas trimestralmente.
