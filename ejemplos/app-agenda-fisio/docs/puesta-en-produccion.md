# Puesta en producción

Pensada para Vercel (región de Fráncfort, `fra1`) y PostgreSQL de Neon en la UE. Nada de esto se ha ejecutado: no se concedió permiso de despliegue ni había credenciales.

## Cuentas (a nombre de la clínica)

- [ ] Alojamiento (Vercel) con la empresa como miembro del equipo.
- [ ] Base de datos PostgreSQL de Neon en región UE, con copias de seguridad diarias activadas.
- [ ] Monitor de disponibilidad externo (UptimeRobot, Better Stack).

## Configuración

- [ ] Variables de entorno de producción, con secretos nuevos:

  | Variable             | Valor                                                                               |
  | -------------------- | ----------------------------------------------------------------------------------- |
  | `DATABASE_URL`       | `postgres://…?sslmode=require` de Neon                                              |
  | `BETTER_AUTH_SECRET` | `openssl rand -base64 32`                                                           |
  | `BETTER_AUTH_URL`    | URL pública definitiva (https)                                                      |
  | `CRON_SECRET`        | `openssl rand -base64 32` (Vercel lo envía en la cabecera `Authorization` del cron) |
  | `REGISTRO_ABIERTO`   | **No definir** (el registro debe quedar cerrado)                                    |
  | `PRUEBAS_E2E`        | **No definir nunca**: desactiva el límite de intentos de acceso                     |

- [ ] Migraciones aplicadas antes de servir la versión: `DATABASE_URL=… npm run db:migrar` (o `npm run db:migrar && npm run build` como comando de compilación en Vercel).
- [ ] Región `fra1` (ya en `vercel.json`) y base de datos en la UE.
- [ ] Dominio y HTTPS; `BETTER_AUTH_URL` con el dominio definitivo.
- [ ] Cron semanal `/api/cron/purgar-actividad` activo (definido en `vercel.json`).

## Arranque (importante)

- [ ] **Registrar la cuenta de la dueña inmediatamente después del primer despliegue**, antes de dar la dirección a nadie: la primera cuenta que se registra en `/registro` es administradora. Comprobar después que `/registro` rechaza nuevas altas.
- [ ] Desde `/usuarios`, dar de alta a las fisioterapeutas (con «Atiende citas») y a la recepcionista (sin marca).
- [ ] Probar las historias H1–H5 con una cuenta de prueba y borrar después los pacientes de prueba.

## Protección de datos (antes de usar datos reales)

- [ ] Completar `configuracion.ts` con la razón social y el correo del responsable (hoy `PENDIENTE(cliente)`), y revisar `/privacidad` con su asesor.
- [ ] Contratos de encargo del tratamiento firmados con Vercel y Neon; confirmar la región UE de ambos.
- [ ] Valorar una evaluación de impacto (EIPD) por tratarse de datos de salud.
- [ ] Decidir si la recepción debe ver las notas clínicas y el motivo de las citas.
- [ ] Confirmar los plazos de conservación (la purga del registro de actividad está fijada en 24 meses).

## Operación

- [ ] Monitor sobre `/api/salud`.
- [ ] Restauración de una copia de seguridad de Neon probada al menos una vez.
- [ ] Si se escala a varias instancias, configurar un almacén compartido para el límite de intentos de acceso (hoy es en memoria por instancia).
