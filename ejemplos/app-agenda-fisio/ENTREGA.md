# Entrega: Agenda Fisio

2026-10-21 · versión v1.0 · Producida de forma autónoma con la fábrica de aplicaciones. **Pendiente de revisión humana.**

## Resumen

Agenda web (adaptada al móvil, en castellano) para una clínica de fisioterapia de Getafe con 3 fisioterapeutas y 1 recepcionista. Sustituye la agenda de papel y el Excel: registra pacientes y citas, impide citas solapadas del mismo fisioterapeuta, muestra la agenda por día y semana, permite marcar el resultado de cada cita y lista los pacientes que llevan más de 60 días sin volver. Hay dos roles (administración y usuario). Las 5 historias del brief están hechas y probadas; se añadieron cuatro piezas transversales por exigencia de protección de datos de salud. No se ha desplegado en ningún sitio (sin permiso ni credenciales).

## Cómo probarla en local

1. `npm ci`
2. Copiar `.env.example` a `.env.local` y generar `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).
3. `npm run dev` y abrir http://localhost:3000. La primera cuenta que se registra es la administradora y también atiende citas.
4. En `/usuarios`, dar de alta una recepcionista (sin «Atiende citas») y fisioterapeutas (con la marca).
5. Datos de ejemplo: no hay script de semillas (volumen bajo; ver decisiones). Se crean a mano o con los e2e.

Versión de prueba publicada: **no publicada** (sin permiso de despliegue).

## Historias de usuario

| Id  | Historia                                                                      | Estado | Prueba                                                                  |
| --- | ----------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| H1  | Alta y gestión de pacientes (búsqueda, edición, eliminar solo administración) | Hecha  | `tests/e2e/pacientes.spec.ts`, `tests/integracion/pacientes.test.ts`    |
| H2  | Crear cita sin solapes (buscador de paciente, reprogramar, concurrencia)      | Hecha  | `tests/e2e/citas.spec.ts`, `tests/integracion/citas.test.ts`            |
| H3  | Agenda del día y de la semana por fisioterapeuta                              | Hecha  | `tests/e2e/agenda.spec.ts`                                              |
| H4  | Marcar cita realizada, cancelada, no presentada (o volver a programada)       | Hecha  | `tests/e2e/citas.spec.ts` (H4), `tests/integracion/citas.test.ts`       |
| H5  | Pacientes con más de 60 días sin volver (solo administración)                 | Hecha  | `tests/e2e/sin-volver.spec.ts`, `tests/integracion/pacientes.test.ts`   |
| T1  | Cuentas del equipo y marca «atiende citas»                                    | Hecha  | `tests/e2e/usuarios.spec.ts`, `tests/integracion/profesionales.test.ts` |
| T2  | Exportar datos de un paciente (CSV) — propuesta de la fábrica por RGPD        | Hecha  | `tests/e2e/sin-volver.spec.ts` (T2)                                     |
| T3  | Registro de actividad y purga a 24 meses — propuesta de la fábrica            | Hecha  | `tests/e2e/actividad.spec.ts`, `tests/e2e/cron.spec.ts`                 |
| T4  | Privacidad adaptada y enlazada                                                | Hecha  | `tests/e2e/accesibilidad.spec.ts`                                       |

## Resultados de calidad

| Comprobación                                                                | Resultado                                                                                                                                                                                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verificar` (formato, lint, tipos, pruebas, build, e2e)             | En verde                                                                                                                                                                                           |
| Pruebas unitarias y de integración                                          | 82 superadas                                                                                                                                                                                       |
| Pruebas de extremo a extremo (escritorio y móvil, incluye 2 de preparación) | 124 superadas                                                                                                                                                                                      |
| Auditoría con sesión                                                        | APTO, 0 fallos bloqueantes (4 avisos: textos `PENDIENTE(cliente)` en `/privacidad`)                                                                                                                |
| Lighthouse móvil (mínimo de las 5 páginas medidas)                          | Rendimiento 97 · Accesibilidad 100 · Buenas prácticas 100                                                                                                                                          |
| Accesibilidad (axe, 7 rutas privadas + 2 públicas, escritorio y móvil)      | 0 graves o críticos                                                                                                                                                                                |
| Dependencias (`npm audit --omit=dev`)                                       | 0 altas o críticas; 4 moderadas en `drizzle-kit` (herramienta de desarrollo)                                                                                                                       |
| Revisión de seguridad                                                       | Sin hallazgos altos. Medios: notas clínicas visibles para todos los usuarios (decisión del cliente) y purga de 24 meses (corregida). Bajos corregidos: HSTS, validación de ids, mensajes genéricos |
| Revisión de requisitos                                                      | Todos los criterios cumplidos; mejoras de prueba aplicadas parcialmente (ver limitaciones)                                                                                                         |
| Revisión de código                                                          | Sin hallazgos altos; corregidos RN5 por calendario, interbloqueo al reprogramar, fisioterapeuta bloqueado y acotado del índice de solapes                                                          |
| Revisión visual                                                             | Mejoras aplicadas: contraste de campos, navegación activa y móvil, jerarquía de acciones en usuarios. Quedan otras (ver mejoras)                                                                   |

## Integraciones

| Integración | Estado | Qué falta para activarla |
| ----------- | ------ | ------------------------ |
| Ninguna     | —      | —                        |

No hay correo: no existe recuperación de contraseña. La administración da de alta cuentas con contraseña inicial.

## Decisiones tomadas sin consultar

- El brief completo se tomó como alcance aprobado, sin ronda de confirmación.
- «Fisioterapeuta» es una marca de la cuenta (`profesionales`), no un rol; la dueña (admin) la tiene.
- Cualquier usuario puede cambiar el estado de cualquier cita; solo la administración elimina citas.
- «Sin volver»: sin cita programada futura y última cita realizada (o alta) hace más de 60 días de calendario (Madrid). Solo administración, como pide el brief.
- `realizada` y `no_presentado` solo si la cita ya empezó; se pueden crear citas en el pasado.
- Solapes controlados con transacción y bloqueo por fisioterapeuta, no con restricción `EXCLUDE`.
- Sin script de semillas (4 usuarios, volumen bajo). La tabla de cuentas pasó a tarjetas por un solape en móvil.
- Detalle completo en `.fabrica/decisiones.md`.

## Pendientes del cliente

- Razón social y datos del responsable del tratamiento (`PENDIENTE(cliente)` en `/privacidad` y `src/lib/configuracion.ts`).
- Decidir si la recepción debe ver las notas clínicas y el motivo de las citas (hoy los ven todos los usuarios).
- Decidir si «Sin volver» debe verlo también la recepción y si hace falta anotar que ya se llamó al paciente.
- Confirmar plazos de conservación y valorar una EIPD (datos de salud) con su asesor o DPD.
- Contratos de encargo con Vercel y Neon y región UE de ambos.
- Antes de producción: registrar la cuenta de administración nada más desplegar (la primera que se registra es administradora) y configurar `CRON_SECRET`.
- Contacto de soporte para el manual de usuario (`PENDIENTE(empresa)`).

## Limitaciones y pruebas manuales pendientes

- **No se ha desplegado ni probado en Vercel/Neon.** Las pruebas usan PostgreSQL embebido (PGlite); conviene probar una vez con un PostgreSQL real (migraciones, `pg_advisory_xact_lock` y concurrencia).
- Lighthouse solo cubre 5 páginas y se midió con la base casi vacía; las capturas de la auditoría muestran estados vacíos, así que la revisión visual no vio la agenda con muchas citas. Recorrer a mano agenda (día y semana), «Sin volver» con filas y los estados de error en móvil.
- «Sin volver» con datos reales de 61, 60 y 59 días está cubierto por pruebas de integración, no por e2e (no hay forma de sembrar fechas antiguas desde la interfaz).
- El motivo de una cita no se puede editar después de crearla.
- Seguridad: no hay CSP (requiere nonces de Next); el límite de intentos de acceso es en memoria por instancia (en serverless es más débil); no se registran las lecturas de fichas clínicas.
- La ficha de paciente lista todas sus citas sin paginar.
- El borrado de un paciente elimina sus citas sin entradas individuales en el registro de actividad.
- Un fisioterapeuta bloqueado conserva sus citas; la administración las reasigna reprogramándolas.

## Mejoras propuestas (fuera del alcance de esta versión)

- Recordatorios por SMS o WhatsApp, y reserva online (fuera de alcance por el brief).
- Ocultar notas clínicas y motivo a la recepción con un permiso propio.
- Marcar «paciente llamado» en «Sin volver» y abrirlo a la recepción.
- Vista de citas pasadas aún sin cerrar y citas recurrentes o bloqueos de agenda (vacaciones).
- Buscador de pacientes en vivo; selector de fisioterapeuta que se aplique al cambiarlo; controles de la agenda más compactos en móvil.
- Edición del motivo de la cita; recuperación de contraseña por correo.
- CSP, límite de intentos en base de datos y registro de lecturas de datos de salud.

## Revisión humana recomendada (1-2 horas)

- [ ] Recorrer cada historia en móvil y en escritorio con administración, un fisioterapeuta y la recepcionista.
- [ ] Intentar con la recepcionista lo que no debe poder (eliminar paciente, ver «Sin volver», `/usuarios`, `/actividad`, exportar).
- [ ] Revisar textos, mensajes de error y avisos.
- [ ] Revisar las decisiones tomadas sin consultar.
- [ ] Revisar `/privacidad` con el cliente.
- [ ] Revisar la migración `drizzle/0000_inicial.sql` antes de desplegar.

## Cómo desplegar

Ver `docs/puesta-en-produccion.md`.
