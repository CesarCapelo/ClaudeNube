# Agenda Fisio

Agenda de citas y pacientes para una clínica de fisioterapia (3 fisioterapeutas y 1 recepcionista). Web adaptada al móvil, en castellano, con dos roles (administración y usuario).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM + PostgreSQL (PGlite en desarrollo), Better Auth, Zod, Vitest y Playwright.

## Requisitos

Node 22.23 o superior (recomendado 24 LTS) y npm.

## Arranque en local

```bash
npm ci
cp .env.example .env.local   # y rellena BETTER_AUTH_SECRET con: openssl rand -base64 32
npm run dev                  # http://localhost:3000
```

La primera cuenta que se registra en `/registro` es la administradora (y atiende citas); después el registro se cierra y las demás cuentas las crea la administración en `/usuarios`. En desarrollo la base de datos es PostgreSQL embebido en `.datos/` y las migraciones se aplican solas.

## Comandos

| Comando                                 | Qué hace                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                           | Desarrollo                                                               |
| `npm run verificar`                     | Formato, lint, tipos, pruebas unitarias e integración, compilación y e2e |
| `npm test`                              | Pruebas unitarias y de integración (PGlite en memoria)                   |
| `npm run test:e2e`                      | Pruebas de extremo a extremo (escritorio y móvil) sobre la app compilada |
| `npm run db:generar -- --name <cambio>` | Genera una migración tras cambiar `src/lib/db/esquema.ts`                |
| `npm run db:migrar`                     | Aplica migraciones a la base de `DATABASE_URL` (PostgreSQL real)         |
| `npm run build && npm run auditar`      | Auditoría con sesión: accesibilidad, capturas y Lighthouse               |

## Estructura

```text
src/app/(app)/        agenda, pacientes, citas, usuarios, actividad (exigen sesión)
src/app/(auth)/       entrar y registro
src/app/api/          salud, exportar paciente (CSV) y cron de purga
src/lib/datos/        capa de datos con permisos (pacientes, citas, profesionales, actividad)
src/lib/validacion/   esquemas Zod
src/lib/              permisos, fechas (Europe/Madrid), sesión, autenticación
drizzle/              migraciones
tests/                unitarios, integración y e2e
.fabrica/             brief, especificación, arquitectura, decisiones y bitácora
```

## Variables de entorno

Ver `.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `REGISTRO_ABIERTO` (vacío) y `CRON_SECRET`.

## Más información

- `ENTREGA.md`: estado de la entrega, resultados de calidad y pendientes.
- `docs/manual-usuario.md`, `docs/manual-tecnico.md`, `docs/puesta-en-produccion.md`, `docs/guion-video-formacion.md`.
