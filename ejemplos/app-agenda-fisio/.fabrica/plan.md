# Plan de construcción: Agenda Fisio

Orden por dependencias (esquema y piezas compartidas primero, hechas por mí; módulos independientes después).

1. `base` — Proyecto base: plantilla, entorno, identidad (verde salvia), navegación, `permisos.ts`, `errores.ts`, `fechas.ts`.
2. `equipo` — T1 Cuentas y marca «atiende citas» (`profesionales`); hook de la primera cuenta.
3. `h1-pacientes` — H1 Pacientes (esquema, validación, datos, acciones, páginas, pruebas). Sustituye al ejemplo de clientes.
4. `h2-citas` — H2 Citas con RN1 sin solapes (esquema, bloqueo, pruebas de concurrencia).
5. `h3-agenda` — H3 Agenda día/semana.
6. `h4-estados` — H4 Estados de cita (RN2).
7. `h5-sin-volver` — H5 Pacientes sin volver (RN5).
8. `t2-exportar` — Exportación y supresión de datos de un paciente.
9. `t3-actividad` — Registro de actividad.
10. `t4-privacidad` — Privacidad, navegación final, semillas.
11. Calidad (verificar, auditoría, revisores), publicación (solo guía: sin permisos) y entrega.
