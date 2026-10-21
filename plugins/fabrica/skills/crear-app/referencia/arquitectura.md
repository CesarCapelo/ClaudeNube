# Arquitectura y patrones

Todas las aplicaciones de la fábrica comparten stack y patrones. Así cualquier persona del equipo, o Claude en una sesión de mantenimiento, entiende cualquier proyecto en minutos.

## 1. Stack

| Pieza | Elección | Notas |
| --- | --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript estricto | Cache Components desactivado (ver `next.config.ts`). Documentación local en `node_modules/next/dist/docs/` |
| Estilos | Tailwind CSS 4 con tokens en `src/app/globals.css` | Componentes propios en `src/components/ui/` |
| Base de datos | PostgreSQL con Drizzle ORM | PGlite (PostgreSQL embebido) en desarrollo y pruebas; Neon, Supabase u otro PostgreSQL en producción |
| Autenticación | Better Auth (correo y contraseña) con el plugin `admin` | Roles, bloqueo de cuentas y altas por la administración |
| Validación | Zod 4 | Esquemas compartidos en `src/lib/validacion/` |
| Pruebas | Vitest (unitarias e integración), Playwright (extremo a extremo), axe (accesibilidad) | Ver `pruebas.md` |
| Móvil | Expo (React Native) con Expo Router | Ver `movil.md` |

Antes de usar una API de Next.js, Better Auth, Drizzle o Expo que no aparezca ya en la plantilla, lee su documentación: la local (`node_modules/<paquete>/`, `AGENTS.md`) o la oficial vigente con WebFetch. Las tres cambian a menudo.

## 2. Estructura

```text
src/
  app/
    (auth)/            entrar, registro (páginas públicas de acceso)
    (app)/             todo lo que exige sesión; layout con navegación
      <modulo>/        page.tsx (listado), nuevo/, [id]/, acciones.ts, formulario-<entidad>.tsx
    api/
      auth/[...all]/   Better Auth
      salud/           comprobación para el monitor de disponibilidad
      v1/              API para la app móvil o integraciones (si las hay)
      cron/            tareas programadas protegidas
    privacidad/        información de protección de datos
  components/ui/       Boton, Campo, Aviso… (añade aquí los reutilizables)
  lib/
    db/                esquema.ts, esquema-auth.ts (generado), index.ts, migrar.ts
    datos/             capa de acceso a datos por entidad (con permisos)
    validacion/        esquemas Zod por entidad
    auth.ts, auth-cliente.ts, sesion.ts, configuracion.ts, permisos.ts
drizzle/               migraciones SQL generadas (versionadas)
tests/
  unitarios/  integracion/  e2e/
```

## 3. Receta para una entidad nueva

Copia el patrón de `clientes`. Para una entidad `Cita`:

1. **Esquema** en `src/lib/db/esquema.ts`: tabla `citas` con `id` (texto, `crypto.randomUUID()`), claves foráneas con `onDelete` explícito, `creado_en` y `actualizado_en` con zona horaria, e índices en las columnas de búsqueda y en las claves foráneas. Tipos `Cita` y `NuevaCita`.
2. **Migración**: `npm run db:generar -- --name citas`. Revisa el SQL generado. Nunca edites una migración ya confirmada en git; crea otra.
3. **Validación** en `src/lib/validacion/citas.ts`: esquema Zod con mensajes en castellano y normalización (recortar espacios, vacíos a `null`, minúsculas en correos).
4. **Capa de datos** en `src/lib/datos/citas.ts`: `listar`, `obtener`, `crear`, `actualizar`, `eliminar`, con paginación y búsqueda (escapando `%` y `_`), y **las comprobaciones de permisos y de ámbito dentro de cada función**.
5. **Acciones** en `src/app/(app)/citas/acciones.ts`: exigir sesión, validar, capa de datos, `revalidatePath` y `redirect`.
6. **Páginas**: listado (búsqueda, paginación, estado vacío y avisos), alta, edición y borrado con confirmación (patrón `<details>` de clientes).
7. **Navegación**: enlace en `src/app/(app)/layout.tsx`, visible solo para los roles que pueden entrar.
8. **Pruebas**: unitarias de la validación, de integración de la capa de datos (incluidos los permisos) y de extremo a extremo de cada historia (`pruebas.md`).
9. **Privacidad**: si guarda datos personales nuevos, actualiza el inventario de la especificación y `/privacidad`.

## 4. Permisos

Con roles más allá de `admin` y `user`, centraliza las reglas en `src/lib/permisos.ts`:

```ts
import 'server-only';
import { ErrorPermiso } from './datos/errores';

const REGLAS = {
  'clientes:ver': ['admin', 'user', 'comercial'],
  'clientes:eliminar': ['admin'],
  'informes:ver': ['admin', 'direccion'],
} as const satisfies Record<string, readonly string[]>;

export type Permiso = keyof typeof REGLAS;

export function puede(usuario: { role?: string | null }, permiso: Permiso) {
  return (REGLAS[permiso] as readonly string[]).includes(usuario.role ?? '');
}

export function exigirPermiso(usuario: { role?: string | null }, permiso: Permiso) {
  if (!puede(usuario, permiso)) throw new ErrorPermiso();
}
```

(Mueve `ErrorPermiso` a `src/lib/datos/errores.ts` cuando haya más de una entidad.) La capa de datos llama a `exigirPermiso`; la interfaz usa `puede` solo para ocultar botones, nunca como única protección. Los roles nuevos se asignan con `auth.api.setRole` desde la gestión de usuarios.

## 5. Varias organizaciones (SaaS y portales multicuenta)

- Usa el plugin `organization` de Better Auth (miembros, invitaciones y organización activa en la sesión). Lee sus tipos en `node_modules/better-auth/dist/plugins/organization/` y su documentación vigente antes de configurarlo, y regenera `esquema-auth.ts` con el CLI (`npx auth@latest generate …`, ver la cabecera del fichero).
- Toda tabla de negocio lleva `organizacion_id` (no nulo, con índice) y **toda** consulta de la capa de datos filtra por la organización activa de la sesión. Nunca aceptes el identificador de organización desde el formulario.
- Pruebas obligatorias de aislamiento: un usuario de la organización A no puede ver, editar ni borrar datos de la B, ni por la interfaz ni llamando a la acción con un identificador ajeno.

En un portal de clientes sin organizaciones, el patrón es el mismo con `cliente_id`: el rol `cliente` solo ve sus propios registros.

## 6. Formularios y acciones de servidor

- Formulario con `useActionState` y `noValidate`: la validación de verdad es la del servidor, y los errores se devuelven por campo (`z.flattenError`) junto con los valores enviados para no perderlos.
- Componente `Campo` para todos los campos: etiqueta asociada y errores con `aria-describedby`.
- Tras guardar, `redirect` con un aviso en la URL (`?aviso=guardado`) que la página traduce a un mensaje.
- Lee `node_modules/next/dist/docs/01-app/02-guides/forms.md` y `server-actions.md` si necesitas algo que la plantilla no muestre (subida de archivos, estados optimistas…).

## 7. Integraciones mediante adaptadores

Toda dependencia externa va detrás de una interfaz con dos implementaciones: la real y una simulada para desarrollo y pruebas. Una variable de entorno decide cuál se usa. Así la app funciona y se prueba sin credenciales, y para pasar a la real basta con configurar las variables.

```ts
// src/lib/correo.ts
import 'server-only';

export type Correo = { para: string; asunto: string; texto: string; html?: string };

const proveedores = {
  consola: async (c: Correo) => console.info(`[correo simulado] Para: ${c.para} · ${c.asunto}`),
  brevo: async (c: Correo) => {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: process.env.CORREO_REMITENTE },
        to: [{ email: c.para }],
        subject: c.asunto,
        textContent: c.texto,
        htmlContent: c.html,
      }),
    });
    if (!r.ok) throw new Error(`Brevo respondió ${r.status}`);
  },
};

export async function enviarCorreo(correo: Correo) {
  const proveedor = (process.env.CORREO_PROVEEDOR ?? 'consola') as keyof typeof proveedores;
  await proveedores[proveedor](correo);
}
```

| Integración | Real | Simulada | Notas |
| --- | --- | --- | --- |
| Correo | Brevo o Resend | Consola | Avisos, recordatorios y recuperación de contraseña |
| Archivos | Almacenamiento compatible con S3 (Cloudflare R2, Supabase Storage) | Disco en `.datos/archivos` | Valida tipo y tamaño; nunca públicos por defecto; descarga a través de una ruta que compruebe permisos |
| Pagos | Stripe Checkout o Billing, con webhook verificado por firma | Adaptador que marca el pago como hecho | Nunca se guardan datos de tarjetas. Claves de prueba hasta producción |
| Calendario | API de Google o Microsoft (OAuth del cliente) | Fichero .ics descargable | La sincronización real suele quedar como pendiente del cliente por las credenciales |
| IA | SDK oficial `@anthropic-ai/sdk` con la clave del cliente (`ANTHROPIC_API_KEY`) | Respuesta fija de ejemplo | Comprueba los identificadores de modelo vigentes en la documentación de Claude. Registra el uso, limita la longitud y avisa al usuario de que interactúa con una IA (Reglamento de IA, art. 50). No envíes datos personales innecesarios |
| Contabilidad o facturación | API del programa del cliente | Exportación CSV | |

## 8. Piezas frecuentes

- **Exportar a Excel**: ruta `GET /api/exportar/<entidad>` que exige sesión y permiso y devuelve CSV con separador `;`, BOM UTF-8 (para que Excel en español lo abra bien) y fechas en formato español.
- **Importar desde Excel o CSV**: subida → análisis → validación fila a fila con el esquema Zod → vista previa con errores por fila → confirmación → inserción en una transacción.
- **Tareas programadas**: ruta `POST /api/cron/<tarea>` protegida con la cabecera `Authorization: Bearer ${CRON_SECRET}`; en Vercel, `vercel.json` con `crons`. Han de poder repetirse sin efectos duplicados.
- **API para móvil o terceros** (`/api/v1/…`): rutas que validan con Zod, comprueban la sesión (cookie o token Bearer; plugin `bearer` o `@better-auth/expo`) y devuelven errores JSON coherentes `{ error: { codigo, mensaje } }` con su estado HTTP.
- **Fechas y números**: guarda en UTC (`timestamp with time zone`); muestra con `Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid' })` e `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- **Auditoría de cambios** (si el brief la pide o hay datos sensibles): tabla `registro_actividad` (quién, qué, cuándo, sobre qué registro), escrita desde la capa de datos.

## 9. Interfaz

- Patrones de pantalla: listado (título, acción principal, búsqueda, tabla o tarjetas, paginación, estado vacío útil), formulario (una columna en móvil, agrupación lógica, acción principal a la izquierda) y detalle (datos y acciones; el borrado, separado y con confirmación).
- En móvil, las tablas anchas se desplazan dentro de un contenedor enfocable (`role="region"`, `aria-label` y `tabIndex={0}`) o se convierten en tarjetas.
- Textos en castellano de España, con mayúscula solo inicial. Los botones dicen qué hacen («Guardar cliente», no «Enviar»).
- Estados de carga en los botones (`pendiente` de `useActionState`) y mensajes de éxito y de error siempre visibles.
- Usa la rúbrica visual de la skill de webs (está en el plugin: `skills/crear-web/referencia/diseno.md`, sección 8) adaptada a aplicación: claridad, consistencia, legibilidad, móvil y acabado.

## 10. Rendimiento

- Listados siempre paginados (20 por página) y consultas con índices.
- Evita el patrón N+1: usa `join` o consultas relacionales de Drizzle para traer datos relacionados.
- Selecciona solo las columnas necesarias en listados grandes.
- Mide con la auditoría (Lighthouse con sesión) y con 1.000 a 10.000 registros ficticios generados por un script de semillas (`scripts/semillas.ts`) si el volumen previsto es grande.
