# Manual técnico — Agenda Fisio

Para quien mantenga la aplicación. El histórico de decisiones está en `.fabrica/` (`brief.md`, `especificacion.md`, `arquitectura.md`, `decisiones.md`, `bitacora.md`).

## Arquitectura

Ver `.fabrica/arquitectura.md` (diagramas Mermaid del modelo y de los módulos). Resumen: Next.js 16 con renderizado dinámico (Cache Components desactivado), Drizzle sobre PostgreSQL, Better Auth con el plugin `admin`. Una sola clínica (sin organizaciones).

## Modelo de datos (`src/lib/db/esquema.ts`)

| Tabla                                        | Contenido                                                           | Notas                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `user`, `session`, `account`, `verification` | Autenticación (Better Auth, en `esquema-auth.ts`)                   | Roles `admin` y `user`                                                          |
| `profesionales`                              | Cuentas que atienden citas (fisioterapeutas)                        | Fila = marca «atiende citas»                                                    |
| `pacientes`                                  | Nombre, teléfono, correo, nacimiento, notas clínicas                | `notas_clinicas` es dato de salud                                               |
| `citas`                                      | Paciente, fisioterapeuta, `inicio`, `fin`, duración, estado, motivo | `fin` guardado; `CHECK` de duración y estado; borrado en cascada desde paciente |
| `registro_actividad`                         | Quién, qué y sobre qué id                                           | Sin datos personales; purga a 24 meses                                          |

Fechas en UTC; la conversión a Europe/Madrid está en `src/lib/fechas.ts` (hora inexistente de marzo → inválida; hora repetida de octubre → la primera).

## Permisos

`src/lib/permisos.ts` define la matriz (`puede`, `exigirPermiso`). La capa de datos (`src/lib/datos/*`) comprueba el permiso en cada función con el usuario de la sesión; la interfaz solo oculta botones. Las acciones de servidor llaman a `exigirUsuario()` / `exigirAdmin()`.

## Reglas de negocio importantes

- **RN1 (solapes)**: `src/lib/datos/citas.ts`. Transacción con `pg_advisory_xact_lock(hashtext(fisioterapeuta))`; al reprogramar entre dos fisioterapeutas los bloqueos se toman en orden de id (evita interbloqueos). Solo bloquean `programada` y `realizada`. No se usa una restricción `EXCLUDE` para no depender de `btree_gist`.
- **RN2**: `realizada` y `no_presentado` solo si la cita ya ha empezado (`ahora` inyectable en las pruebas).
- **RN5 (sin volver)**: `sinVolver` en `src/lib/datos/pacientes.ts`; «más de 60 días» en días de calendario de Madrid.
- **Primera cuenta**: el hook de `src/lib/auth.ts` la hace administradora y le crea la marca de fisioterapeuta.

## Integraciones

Ninguna. Sin correo: no hay recuperación de contraseña; la administración da de alta cuentas con contraseña inicial.

## Rutas especiales

| Ruta                                   | Función                                                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `GET /api/salud`                       | Comprobación de disponibilidad                                                                                          |
| `GET /api/exportar/paciente/[id]`      | CSV del paciente y sus citas (solo administración)                                                                      |
| `GET\|POST /api/cron/purgar-actividad` | Borra el registro de actividad de más de 24 meses; exige `Authorization: Bearer $CRON_SECRET`; semanal en `vercel.json` |

## Pruebas

| Tipo                                             | Comando                             | Dónde                                                   |
| ------------------------------------------------ | ----------------------------------- | ------------------------------------------------------- |
| Unitarias e integración (PGlite en memoria)      | `npm test`                          | `tests/unitarios`, `tests/integracion`                  |
| Extremo a extremo (escritorio y móvil)           | `npm run build && npm run test:e2e` | `tests/e2e` (puerto `PUERTO_PRUEBAS`, 3100 por defecto) |
| Todo                                             | `npm run verificar`                 |                                                         |
| Auditoría con sesión (axe, capturas, Lighthouse) | `npm run build && npm run auditar`  | `.fabrica/auditoria/informe.md`                         |

Los e2e comparten una base en memoria entre los proyectos de escritorio y móvil, que corren en paralelo: cada prueba crea sus propios datos únicos (`unico()`, helpers en `tests/e2e/ayudas.ts`) y, para citas, su propio fisioterapeuta. La preparación (`preparacion.setup.ts`) crea la administradora, una recepcionista y un fisioterapeuta de prueba.

## Migraciones

`npm run db:generar -- --name <cambio>` tras tocar `esquema.ts`; revisa el SQL. `npm run db:migrar` en despliegues con PostgreSQL real. En desarrollo (PGlite) se aplican al arrancar. La migración inicial `0000_inicial` se regeneró durante la construcción (nunca estuvo desplegada); a partir de ahora no se editan.

## Cómo añadir una entidad

Receta en `.fabrica/arquitectura.md` (sección «Receta» de la skill): esquema → migración → validación Zod → capa de datos con permisos → acciones → páginas → navegación → pruebas → privacidad.

## Decisiones técnicas

Ver `.fabrica/decisiones.md`. Destacan: transacción con bloqueo para solapes, `fin` almacenado, listados sin notas clínicas ni motivo, cuentas en tarjetas (no tabla) por un solape en móvil.

## Mantenimiento de dependencias

`npm audit --omit=dev` reporta 4 avisos moderados en la cadena de `drizzle-kit` (herramienta de desarrollo, no se ejecuta en producción). No usar `npm audit fix --force` (propone una bajada de versión); actualizar `drizzle-kit` cuando salga una versión sin `@esbuild-kit`.
