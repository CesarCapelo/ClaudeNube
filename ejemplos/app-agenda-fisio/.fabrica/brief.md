# Brief: Agenda Fisio

Fecha: 2026-10-21 · Fuente: brief del comercial

## Contexto
- Negocio: clínica de fisioterapia en Getafe con 3 fisioterapeutas y una recepcionista.
- Problema que resuelve: hoy llevan las citas en una agenda de papel y un Excel de pacientes; se pierden citas y no saben qué pacientes no han vuelto.
- Cómo se hace hoy: agenda de papel en recepción y un Excel compartido.
- Tipo de aplicación: herramienta interna
- Plataformas: web adaptada al móvil
- Usuarios previstos: 4 personas

## Roles
| Rol | Quién es | Qué puede hacer |
| --- | --- | --- |
| admin | La dueña (también fisioterapeuta) | Todo, incluido gestionar cuentas y borrar datos |
| user | Fisioterapeutas y recepcionista | Gestionar pacientes y citas; no pueden borrar pacientes |

## Entidades principales
| Entidad | Datos importantes | Notas |
| --- | --- | --- |
| Paciente | nombre, teléfono, correo (opcional), fecha de nacimiento (opcional), notas clínicas breves | Las notas clínicas son datos de salud |
| Cita | paciente, fisioterapeuta (usuario), fecha y hora de inicio, duración (50 min por defecto), estado (programada, realizada, cancelada, no se presentó), motivo | No puede haber dos citas solapadas del mismo fisioterapeuta |

## Historias de usuario (alcance de esta versión)
- H1. Como recepcionista, quiero dar de alta un paciente con nombre y teléfono para poder citarlo.
- H2. Como recepcionista, quiero crear una cita para un paciente con un fisioterapeuta, sin que se solape con otra cita suya.
- H3. Como fisioterapeuta, quiero ver mi agenda del día y de la semana para organizarme.
- H4. Como fisioterapeuta, quiero marcar una cita como realizada, cancelada o no presentada.
- H5. Como dueña, quiero ver qué pacientes llevan más de 60 días sin cita para llamarlos.

## Fuera de alcance
- Recordatorios automáticos por WhatsApp o SMS.
- Facturación.
- Reserva online por los pacientes.

## Datos e integraciones
- Datos de partida: de cero.
- Integraciones (real / simulada): ninguna.
- Datos especialmente protegidos: sí, notas clínicas (datos de salud).

## Marca y técnica
- Identidad visual: verde salvia (#5f8f74).
- Idiomas: castellano
- Alojamiento: Vercel + Neon (UE)
- Enfoque: MVP

## Permisos
- Subir el código a un remoto: no
- Desplegar versión de prueba: no
- Desplegar en producción: no

## Pendientes del cliente
- Razón social y datos del responsable del tratamiento.
