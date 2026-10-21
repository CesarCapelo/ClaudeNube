# Entrevista inicial (fase 0)

En una aplicación, lo caro no es programar: es construir lo que no se necesitaba o descubrir tarde a quién se le escapaba un permiso. La entrevista debe dejar claros **quién usa la app, qué hace cada rol, qué datos se manejan y qué queda fuera**.

## Cómo preguntar

- Aprovecha antes lo que ya hay (`$ARGUMENTS`, `brief.md`, `.fabrica/brief.md`) y no preguntes lo que ya sabes.
- Usa `AskUserQuestion` en rondas de hasta 4 preguntas, con la opción recomendada en primer lugar y marcada «(Recomendado)».
- Las respuestas libres (descripciones, entidades, roles, rutas de ficheros) se escriben en «Otro»: indícalo en la pregunta.
- Si el usuario responde «decide tú», aplica el valor por defecto y regístralo como decisión.
- No termines el turno durante la entrevista.

## Rondas

### Ronda 1 — Problema y usuarios

1. **El problema** (libre): «Describe el negocio, qué problema debe resolver la aplicación y cómo se hace hoy (Excel, papel, WhatsApp, otra herramienta). Escríbelo en «Otro».» Opciones: «Está en el brief» y «Te paso un documento» (ruta en «Otro»).
2. **Tipo de aplicación**: herramienta interna para el equipo (Recomendado si no está claro); portal para los clientes del negocio; producto SaaS o MVP para vender a terceros; automatización con un panel de control.
3. **Plataformas**: solo web adaptada al móvil (Recomendado); web y app móvil para iOS y Android; app móvil con panel web de administración.
4. **Usuarios**: hasta 10 personas del equipo; entre 10 y 100; cientos o miles de usuarios externos.

### Ronda 2 — Funcionalidad y permisos

1. **Qué gestiona** (libre): «¿Qué "cosas" gestiona la app? Por ejemplo: clientes, citas, pedidos, productos, tareas, incidencias, presupuestos. Para cada una, los datos importantes. Escríbelo en «Otro».»
2. **Funcionalidades** (multiselección): listados con búsqueda y filtros; agenda o calendario; avisos por correo; informes y exportación a Excel o CSV. En la descripción indica que en «Otro» puede añadir subida de archivos, pagos o suscripciones, firma de documentos, mapas, etc.
3. **Roles y permisos**:
   - Administración y equipo con el mismo acceso a los datos (Recomendado para herramientas internas).
   - Varios roles con permisos distintos (descríbelos en «Otro»).
   - Cada cliente u organización ve solo lo suyo (multicuenta, típico de SaaS y portales).
4. **Lo imprescindible** (libre): «Escribe de 3 a 6 frases con lo más importante que debe poder hacer cada rol, por ejemplo "La recepcionista da de alta una cita en menos de 30 segundos".»

### Ronda 3 — Datos e integraciones

1. **Datos de partida**: se empieza de cero (Recomendado); importar desde Excel o CSV (ruta en «Otro»); migrar desde otra herramienta (cuál, en «Otro»).
2. **Integraciones** (multiselección): envío de correos (avisos, recordatorios); calendario (Google o Microsoft); facturación o contabilidad (Holded, Sage, etc.); inteligencia artificial para clasificar, resumir o redactar. En «Otro», cualquier API concreta.
3. **Datos especialmente protegidos**: ninguno especial (Recomendado si aplica); datos de salud; datos de menores; datos bancarios o financieros. Si hay alguno, avisa en la descripción de que exigirá medidas adicionales y revisión legal.
4. **Idiomas de la interfaz**: castellano (Recomendado); castellano e inglés; otro.

### Ronda 4 — Marca, técnica y permisos

1. **Identidad visual**: colores y logotipo (rutas en «Otro»); sin identidad, diseño sobrio y neutro (Recomendado).
2. **Alojamiento**: Vercel con PostgreSQL gestionado en la UE (Neon o Supabase) (Recomendado); servidor propio o VPS; lo decidirá el cliente más adelante.
3. **Permisos durante el trabajo autónomo** (multiselección): subir el código al repositorio remoto; desplegar una versión de prueba (requiere credenciales en variables de entorno); desplegar en producción (desaconsejado sin revisión humana).
4. **Enfoque**: MVP con lo mínimo imprescindible, para validar rápido (Recomendado); versión completa según todo lo hablado.

### Ronda final — Alcance y confirmación

1. Escribe `.fabrica/brief.md` con la plantilla de abajo.
2. Redacta el **resumen de alcance** dentro del brief:
   - Historias de usuario numeradas (H1, H2…) con el formato «Como <rol>, quiero <acción> para <beneficio>».
   - Lo que queda fuera de esta versión.
   - Integraciones reales y simuladas.
3. Muéstralo en 10 a 15 líneas y pregunta: «¿Empiezo? A partir de aquí trabajaré de forma autónoma hasta entregar, sin hacerte más preguntas.» Opciones: «Sí, empieza» y «Quiero cambiar algo» (qué, en «Otro»).
4. Registra los permisos con `estado.mjs permiso push si|no` y `estado.mjs permiso produccion si|no`.

## Valores por defecto

| Tema | Valor por defecto |
| --- | --- |
| Tipo | Herramienta interna |
| Plataforma | Web adaptada al móvil |
| Roles | `admin` (gestiona usuarios y borra datos) y `user` (trabaja con los datos) |
| Registro | Cerrado: la primera cuenta es administradora y crea las demás |
| Enfoque | MVP |
| Datos de partida | De cero, con un importador CSV si el brief menciona Excel |
| Correos | Adaptador que escribe en consola en desarrollo; pendiente del cliente el proveedor (Brevo o Resend) |
| Alojamiento | Vercel (región de Fráncfort) con PostgreSQL de Neon o Supabase en la UE |
| Idioma | Castellano de España |
| Diseño | Sobrio, paleta azul neutra de la plantilla |
| Permisos | Sin push ni despliegues |

## Plantilla de `.fabrica/brief.md`

```markdown
# Brief: <nombre de la aplicación>

Fecha: <AAAA-MM-DD> · Fuente: <entrevista | brief del comercial | mixto>

## Contexto
- Negocio:
- Problema que resuelve:
- Cómo se hace hoy:
- Tipo de aplicación: <interna | portal | SaaS/MVP | automatización>
- Plataformas: <web | web + móvil | móvil + panel web>
- Usuarios previstos:

## Roles
| Rol | Quién es | Qué puede hacer |
| --- | --- | --- |

## Entidades principales
| Entidad | Datos importantes | Notas |
| --- | --- | --- |

## Historias de usuario (alcance de esta versión)
- H1. Como <rol>, quiero <acción> para <beneficio>.
- H2. …

## Fuera de alcance
- …

## Datos e integraciones
- Datos de partida:
- Integraciones (real / simulada):
- Datos especialmente protegidos:

## Marca y técnica
- Identidad visual:
- Idiomas:
- Alojamiento:
- Enfoque: <MVP | completo>

## Permisos
- Subir el código a un remoto: <sí | no>
- Desplegar versión de prueba: <sí | no>
- Desplegar en producción: <sí | no>

## Pendientes del cliente
- …
```
