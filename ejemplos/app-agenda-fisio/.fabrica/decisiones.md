# Decisiones tomadas durante el trabajo autónomo

Cada decisión se tomó sin preguntar, con el criterio indicado. Revísalas en la entrega.

1. (2026-10-21 20:14, fase entrevista) Brief del comercial completo (roles, entidades, H1-H5, fuera de alcance, permisos): se toma como alcance aprobado sin nueva entrevista. Alternativa descartada: ronda de confirmación, que bloquearía el trabajo autónomo.
2. (2026-10-21 20:17, fase base) Revisión de requisitos aplicada: admin puede eliminar citas (el brief le da borrado de datos); H4 incluye volver a programada; etiqueta 'Pendiente de marcar' en citas pasadas; admin no puede degradarse ni bloquearse. Descartado por alcance: registrar llamadas a pacientes, vista de citas pasadas sin cerrar, reasignación automática.
3. (2026-10-21 20:55, fase construccion) Semillas de volumen (scripts/semillas.ts) descartadas en el MVP: 4 usuarios y volumen bajo; la tabla de cuentas pasa a tarjetas por un solape detectado en móvil.
4. (2026-10-21 21:09, fase calidad) Revisores aplicados: RN5 en días de calendario de Madrid; bloqueos de fisioterapeuta en orden; reprogramar cita de fisio bloqueado; purga de actividad a 24 meses por cron con CRON_SECRET; HSTS; validación de ids en acciones de cuentas; contraste de campos y navegación. Descartado/Pendiente: CSP (requiere nonces de Next), rate limit en base de datos, registro de lecturas (paciente.ver), ocultar notas clínicas a recepción (decisión del cliente), búsqueda en vivo, rediseño de controles de agenda móvil.
