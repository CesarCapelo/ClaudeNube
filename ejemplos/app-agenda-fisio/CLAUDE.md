# Agenda Fisio — guía para Claude Code

Aplicación web hecha con Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM sobre PostgreSQL y Better Auth. Producida por la fábrica de software; el histórico del proyecto está en `.fabrica/` (brief, especificación, decisiones y bitácora).

**Next.js 16 no es el Next.js que conoces:** antes de usar una API, lee la guía correspondiente en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Comandos

- `npm run dev`: desarrollo en http://localhost:3000 con PostgreSQL embebido (PGlite) en `.datos/`; las migraciones se aplican solas al arrancar.
- `npm run verificar`: formato, lint, tipos, pruebas unitarias y de integración, compilación y pruebas de extremo a extremo. Debe pasar antes de cada commit.
- `npm run db:generar -- --name <nombre>`: genera la migración tras cambiar `src/lib/db/esquema.ts`. Nunca edites a mano una migración ya aplicada.
- `npm run build && npm run auditar`: auditoría con sesión de administración (capturas, accesibilidad y Lighthouse) en `.fabrica/auditoria/informe.md`.

## Arquitectura y reglas

- **Capa de datos** (`src/lib/datos/`): toda consulta pasa por aquí, y aquí se comprueban los permisos de cada operación. Las páginas y acciones nunca consultan la base de datos para modificarla saltándose esta capa.
- **Sesión** (`src/lib/sesion.ts`): `exigirUsuario()` y `exigirAdmin()` al principio de cada página, acción y ruta privada.
- **Validación** (`src/lib/validacion/`): esquemas de Zod compartidos; toda entrada se valida en el servidor.
- **Acciones de servidor**: exigir sesión → validar → capa de datos → `revalidatePath` → `redirect`. Patrón en `src/app/(app)/pacientes/acciones.ts`.
- **Nueva entidad**: copia el patrón de pacientes (esquema, migración, validación, capa de datos, acciones, páginas y pruebas unitarias, de integración y de extremo a extremo).
- Interfaz en castellano de España; mensajes de error que digan cómo arreglar el problema.
- Accesibilidad WCAG 2.2 AA: etiquetas en todos los campos (`Campo`), errores enlazados con `aria-describedby`, foco visible, tablas con desplazamiento enfocables.
- Secretos solo en variables de entorno (`.env.local` en desarrollo; en el proveedor en producción). Nunca en el código.
- Datos personales: solo los necesarios, sin registrarlos en logs, y con su tratamiento descrito en `/privacidad`.
