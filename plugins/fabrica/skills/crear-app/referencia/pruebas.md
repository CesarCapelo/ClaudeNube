# Pruebas

Las pruebas son la red de seguridad de un equipo que supervisa en lugar de programar: si pasan, la persona revisora puede confiar en que lo prometido funciona. Tres niveles, todos obligatorios.

| Nivel | Herramienta | Qué prueba | Dónde |
| --- | --- | --- | --- |
| Unitarias | Vitest | Reglas puras: validaciones, cálculos, formatos, permisos (`puede`) | `tests/unitarios/` |
| Integración | Vitest con PGlite en memoria | Capa de datos contra PostgreSQL real: consultas, filtros, paginación, permisos y aislamiento | `tests/integracion/` |
| Extremo a extremo | Playwright (escritorio y móvil) con axe | Cada historia de usuario en el navegador, con la app compilada | `tests/e2e/` |

`npm run verificar` ejecuta todo. `npm test` lanza las unitarias y de integración (segundos); las de extremo a extremo necesitan `npm run build` antes.

## Qué escribir por cada historia de usuario

1. **Una prueba de extremo a extremo por criterio de aceptación**, con el nombre de la historia: `test('H3 · la recepción reprograma una cita y el cliente recibe el aviso', …)`.
2. **El camino feliz y los errores**: datos inválidos (mensaje por campo y nada guardado) y acceso sin permiso (otro rol, otra organización o sin sesión).
3. **Pruebas de integración** de cada función nueva de la capa de datos, incluidas sus reglas de permisos.
4. **Pruebas unitarias** de cada regla con casos límite (vacíos, máximos, formatos, fechas en cambio de hora).
5. **Accesibilidad**: añade cada página nueva a `PRIVADAS` o `PUBLICAS` de `tests/e2e/accesibilidad.spec.ts`.

## Patrones (ver los ejemplos de la plantilla)

- **Sesiones**: el proyecto `preparacion` crea la cuenta administradora y guarda su sesión en `tests/e2e/.auth/admin.json`, que usan las pruebas por defecto. Para otro rol, créalo desde la administración dentro de la prueba y entra con él en un contexto nuevo (`usuarios.spec.ts`).
- **Sin sesión**: `test.use({ storageState: { cookies: [], origins: [] } })`.
- **Datos únicos**: las pruebas se ejecutan en paralelo sobre la misma base de datos en memoria. Usa `unico('Cliente')` para que no choquen y no dependas del número total de registros.
- **Localizadores accesibles**: `getByRole`, `getByLabel` y `getByText`, nunca clases CSS. Si un elemento no se puede localizar por su rol o su etiqueta, probablemente tiene un problema de accesibilidad.
- **Avisos**: Next.js añade su propio `role="alert"` para anunciar las navegaciones. Comprueba los mensajes con `getByText('…')`, no con `getByRole('alert')` sin filtrar.
- **Integraciones simuladas**: comprueba su efecto. Por ejemplo, el adaptador de correo simulado puede guardar los envíos en memoria y exponerlos a las pruebas de integración.
- **Integración con base de datos**: `beforeAll(migrar)` e inserción directa de los usuarios necesarios (`clientes.test.ts`). `vitest.config.ts` ya sustituye `server-only` y usa `pglite://memoria`.

## Cuando una prueba falla

1. Lee el error y `test-results/<prueba>/error-context.md` (incluye una instantánea accesible de la página).
2. Decide si falla el código o la prueba. Una prueba solo se cambia si el criterio estaba mal expresado, nunca para que pase.
3. Si la causa es la configuración del entorno (servidor reutilizado con otros datos, puerto ocupado, navegador), arréglala: los servidores que dejes encendidos se reutilizan (`reuseExistingServer`). Búscalos con `ps aux | grep next-server` y páralos con `kill <pid>`.
4. Nunca uses `test.skip`, `.only` ni esperas fijas (`waitForTimeout`) para ocultar un problema.
