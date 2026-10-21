# Especificación: Agenda Fisio

Versión 1.0 · Basada en .fabrica/brief.md · Enfoque: MVP

## 1. Objetivo

Sustituir la agenda de papel y el Excel de pacientes de una clínica de fisioterapia (3 fisioterapeutas y 1 recepcionista) por una web adaptada al móvil que registre pacientes y citas, impida citas solapadas y avise de qué pacientes llevan más de 60 días sin volver. Funciona si las 5 historias pasan sus pruebas y una persona sin conocimientos técnicos crea un paciente y una cita en menos de 1 minuto (guion de prueba manual: entrar, «Nuevo paciente», guardar, «Nueva cita», guardar: 2 formularios).

## 2. Roles y permisos

Hay dos roles (campo `role` de Better Auth). «Fisioterapeuta» no es un rol: es una marca del perfil de una cuenta (ver `profesionales`, sección 3). La recepcionista es `user` sin la marca.

| Acción                                         | admin | user | Sin sesión |
| ---------------------------------------------- | ----- | ---- | ---------- |
| Ver, buscar y abrir pacientes (incl. notas)    | ✔     | ✔    | —          |
| Crear / editar pacientes                       | ✔     | ✔    | —          |
| Eliminar pacientes (y sus citas)               | ✔     | —    | —          |
| Exportar los datos de un paciente              | ✔     | —    | —          |
| Ver agenda (cualquier fisioterapeuta)          | ✔     | ✔    | —          |
| Crear / reprogramar citas                      | ✔     | ✔    | —          |
| Cambiar el estado de una cita                  | ✔     | ✔    | —          |
| Ver el detalle de una cita (incluye motivo)    | ✔     | ✔    | —          |
| Eliminar citas (confirmando; lo normal es cancelar) | ✔ | —  | —          |
| Ver «Pacientes sin volver»                     | ✔     | —    | —          |
| Gestionar cuentas (alta, rol, bloqueo, marca)  | ✔     | —    | —          |
| Ver el registro de actividad                   | ✔     | —    | —          |

Reglas de cuentas: una persona administradora no puede quitarse a sí misma el rol ni bloquearse (evita dejar la clínica sin administración). Cambiar o restablecer contraseñas queda fuera de esta versión salvo lo que ya trae la gestión de cuentas de la plantilla (pendiente del cliente si hace falta más).

Reglas de ámbito: es una sola clínica (sin organizaciones); toda persona con sesión activa y no bloqueada ve todos los pacientes y todas las citas. Las pantallas y acciones de solo administración devuelven «prohibido» a `user`. El registro está cerrado: la primera cuenta es administradora y crea las demás.

## 3. Entidades

### Paciente (`pacientes`)

| Campo             | Tipo                    | Obligatorio | Reglas                                                                 |
| ----------------- | ----------------------- | ----------- | ---------------------------------------------------------------------- |
| nombre            | texto (2–120)           | sí          | Se recortan espacios                                                   |
| telefono          | texto (9–20)            | sí          | Solo dígitos, espacios, `+`, `-`, `.`, paréntesis; mínimo 9 dígitos. No es único (familias comparten teléfono) |
| email             | correo (≤254)           | no          | Minúsculas                                                             |
| fechaNacimiento   | fecha                   | no          | No futura; no anterior a 1900                                          |
| notasClinicas     | texto (≤2000)           | no          | **Dato de salud**; nunca aparece en listados ni registros               |
| creadoPor, fechas | —                       | auto        |                                                                        |

Borrado: **en cascada** sobre sus citas (derecho de supresión), solo `admin`, con confirmación que indica cuántas citas se borrarán.

### Cita (`citas`)

| Campo            | Tipo                                                  | Obligatorio | Reglas                                                                                          |
| ---------------- | ----------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| paciente         | referencia                                            | sí          | Debe existir                                                                                    |
| fisioterapeuta   | referencia a cuenta                                   | sí          | Cuenta con la marca «atiende citas» y no bloqueada                                              |
| inicio           | fecha y hora (se guarda en UTC, se muestra Europe/Madrid) | sí      | Minutos múltiplo de 5                                                                           |
| duracionMin      | entero 10–180                                         | sí          | 50 por defecto                                                                                  |
| estado           | `programada` · `realizada` · `cancelada` · `no_presentado` | sí     | `programada` al crear                                                                           |
| motivo           | texto (≤300)                                          | no          | Puede contener datos de salud: no se muestra en listados de agenda, solo en el detalle de la cita |

Reglas de negocio:

- **RN1 Sin solapes**: dos citas del mismo fisioterapeuta con estado `programada` o `realizada` no pueden solaparse. Una que empieza justo cuando otra acaba **no** se solapa. Las `cancelada` y `no_presentado` no bloquean la hora. Se comprueba al crear, al reprogramar y al devolver una cita a `programada`.
- **RN2 Estados**: `realizada` y `no_presentado` solo pueden asignarse si el inicio de la cita es anterior al momento actual. Cualquier estado puede cambiarse a otro por error humano (corrección), aplicando RN1 cuando vuelve a `programada`/`realizada`.
- **RN3 Pasado**: se pueden crear citas en el pasado (para anotar lo ocurrido), con estado `programada`.
- **RN4 Fisioterapeuta**: una cuenta es fisioterapeuta si tiene fila en `profesionales` (usuario_id). La administración marca o desmarca «atiende citas» al dar de alta o editar la cuenta. Una cuenta bloqueada no aparece en el desplegable de nuevas citas, pero conserva su historial.
- **RN5 Pacientes sin volver**: aparece en el listado quien (a) no tiene ninguna cita `programada` con inicio posterior a ahora y (b) su fecha de referencia es anterior a hoy menos 60 días, siendo la fecha de referencia el inicio de su última cita `realizada` o, si nunca tuvo una, su fecha de alta. Se ordena por antigüedad de la referencia (el que lleva más tiempo, primero).

Relaciones: Paciente 1—N Cita; Cuenta(fisioterapeuta) 1—N Cita (borrado de cuenta restringido: se bloquea, no se borra).

### Perfil profesional (`profesionales`)

`usuario_id` (clave y referencia a la cuenta), `creado_en`. Marca de que la cuenta atiende citas.

### Registro de actividad (`registro_actividad`)

Quién, cuándo, acción (`paciente.crear|editar|eliminar|exportar`, `cita.crear|reprogramar|estado`), tipo y id del registro afectado. **Sin nombres, teléfonos ni notas** (solo identificadores). Se escribe desde la capa de datos. Conservación propuesta: 24 meses, a confirmar con el cliente; la purga se documenta en el manual técnico (sin tarea automática en esta versión).

## 4. Historias de usuario

### H1. Dar de alta un paciente

Como **recepcionista (user)**, quiero dar de alta un paciente con nombre y teléfono para poder citarlo.

Criterios de aceptación:

- [ ] Con nombre y teléfono válidos, el paciente se guarda, se vuelve al listado y aparece el aviso «Paciente guardado»; el listado se ordena por nombre y el paciente nuevo es localizable buscándolo.
- [ ] Con nombre vacío o de 1 carácter, teléfono con menos de 9 dígitos o con letras, o un correo mal formado, no se guarda y cada campo muestra su error sin perder lo escrito.
- [ ] El listado permite buscar por nombre o teléfono (sin distinguir mayúsculas; los caracteres `%` y `_` se tratan como texto) y pagina de 20 en 20; sin resultados muestra un mensaje y la acción «Nuevo paciente».
- [ ] Un `user` puede editar el paciente, pero no ve el botón «Eliminar» y la acción de eliminar por llamada directa devuelve «prohibido»; un `admin` sí puede, tras confirmar.
- [ ] Una persona sin sesión que abre `/pacientes` o `/pacientes/nuevo` acaba en `/entrar`.

Prioridad: imprescindible.

### H2. Crear una cita sin solapes

Como **recepcionista (user)**, quiero crear una cita para un paciente con un fisioterapeuta, sin que se solape con otra cita suya, para no duplicar horas.

Criterios de aceptación:

- [ ] El paciente se elige con un buscador por nombre o teléfono (o llega ya elegido desde su ficha); si no existe, «Nuevo paciente» y al guardarlo se vuelve al formulario de cita con el paciente elegido. Desde la ficha del paciente o desde la agenda se abre «Nueva cita» con paciente, fisioterapeuta (solo cuentas con la marca y no bloqueadas), fecha, hora, duración (50 por defecto) y motivo opcional; al guardar, la cita aparece en la agenda de ese fisioterapeuta ese día con el aviso «Cita guardada».
- [ ] Si la franja se solapa con otra cita `programada` o `realizada` del mismo fisioterapeuta, no se guarda y se muestra «Ese fisioterapeuta ya tiene una cita de HH:MM a HH:MM» (sin nombre del otro paciente en el mensaje).
- [ ] Una cita que empieza justo cuando otra termina (p. ej. 10:00–10:50 y 10:50) sí se guarda; la misma hora con otro fisioterapeuta sí se guarda; la hora de una cita `cancelada` queda libre.
- [ ] Dos peticiones simultáneas para la misma franja no pueden dejar ambas guardadas (una falla con el mensaje de solape); lo garantiza una transacción con bloqueo por fisioterapeuta y lo prueba un test de integración concurrente.
- [ ] Se puede reprogramar (cambiar fecha, hora, duración o fisioterapeuta) aplicando las mismas reglas.
- [ ] Fecha vacía, duración fuera de 10–180, minutos no múltiplos de 5 o paciente inexistente no se guardan y muestran su error.
- [ ] Sin sesión, `/citas/nueva` lleva a `/entrar`.

Prioridad: imprescindible.

### H3. Ver mi agenda del día y de la semana

Como **fisioterapeuta**, quiero ver mi agenda del día y de la semana para organizarme.

Criterios de aceptación:

- [ ] `/agenda` muestra por defecto el día de hoy (hora de Madrid) del fisioterapeuta con sesión; si la cuenta no atiende citas, el primer fisioterapeuta activo.
- [ ] Hay vistas «Día» y «Semana» (lunes a domingo) con navegación anterior/siguiente y «Hoy», y un selector para ver la agenda de otro fisioterapeuta.
- [ ] Cada cita muestra hora de inicio y fin, nombre del paciente y estado (con texto, no solo color); las citas `canceladas` se ven atenuadas; una cita `programada` cuya hora ya pasó muestra la etiqueta «Pendiente de marcar»; no se muestran motivo ni notas clínicas.
- [ ] Las citas salen ordenadas por hora; un día sin citas muestra «Sin citas este día» con enlace a «Nueva cita».
- [ ] Las horas se muestran en horario de Madrid también en las semanas de cambio horario (probado con el 29 de marzo y el 25 de octubre de 2026).
- [ ] Sin sesión, `/agenda` lleva a `/entrar`.

Prioridad: imprescindible.

### H4. Marcar el resultado de una cita

Como **fisioterapeuta**, quiero marcar una cita como realizada, cancelada o no presentada para llevar el control.

Criterios de aceptación:

- [ ] Desde la agenda o la ficha de la cita se puede cambiar el estado a `programada`, `realizada`, `cancelada` o `no_presentado` y se ve el nuevo estado con el aviso «Cita actualizada».
- [ ] `realizada` y `no_presentado` se rechazan con «Solo se puede marcar así una cita que ya ha empezado» si el inicio es futuro; `cancelada` se admite siempre.
- [ ] Al cancelar, la franja queda libre para otra cita del mismo fisioterapeuta.
- [ ] Devolver una cita a `programada` o `realizada` que ahora se solaparía con otra se rechaza con el mensaje de solape.
- [ ] Cualquier `user` o `admin` puede hacerlo. Solo `admin` puede eliminar una cita (con confirmación); a `user` no se le muestra y la llamada directa devuelve «prohibido».
- [ ] Sin sesión, la acción no se ejecuta (la capa de datos rechaza y la página redirige a `/entrar`).

Prioridad: imprescindible.

### H5. Ver pacientes que no han vuelto

Como **dueña (admin)**, quiero ver qué pacientes llevan más de 60 días sin cita para llamarlos.

Criterios de aceptación:

- [ ] `/pacientes/sin-volver` lista a los pacientes según RN5 con nombre, teléfono (enlace `tel:`), fecha de su última cita realizada (o «Sin citas realizadas» y su fecha de alta) y días transcurridos, del más antiguo al más reciente, paginado de 20 en 20.
- [ ] Un paciente con última cita realizada hace 61 días aparece; con 60 o 59 días no (más de 60); con 61 días pero con una cita programada futura no aparece; un paciente dado de alta hace 10 días sin citas no aparece.
- [ ] Las citas `canceladas` y `no_presentado` no cuentan como última visita.
- [ ] Un `user` que abre la URL ve «prohibido» y el enlace no aparece en su navegación; sin sesión va a `/entrar`.
- [ ] Sin pacientes en esta situación se muestra «Nadie lleva más de 60 días sin volver».

Prioridad: imprescindible.

### Piezas transversales (no son historias; tienen pruebas propias)

- **T1 Cuentas del equipo** (plantilla): la administración da de alta cuentas (nombre, correo, contraseña ≥10, rol y marca «atiende citas»), cambia rol, bloquea y marca/desmarca «atiende citas».
- **T2 Exportar datos de un paciente** (propuesta de la fábrica, exigida por RGPD para datos de personas; RGPD, acceso/portabilidad): `admin` descarga un CSV (separador `;`, BOM UTF-8) con los datos del paciente y sus citas desde su ficha. `user` recibe 403.
- **T3 Registro de actividad** (propuesta de la fábrica por tratarse de datos de salud; art. 32 RGPD): página `/actividad` (solo admin) con las últimas 100 acciones; sin datos personales.
- **T4 Privacidad y acceso**: `/privacidad` adaptada (datos de salud, responsable, encargados); aviso en pantalla de entrada; cierre de sesión.

## 5. Flujos principales

1. **Recepción**: entra → `/agenda` → «Nueva cita» → busca o crea paciente (si no existe, «Nuevo paciente» y vuelve) → elige fisio, día y hora → guarda → ve la cita en la agenda.
2. **Fisioterapeuta**: entra → ve su agenda de hoy → al terminar una sesión pulsa «Realizada» → fin de día revisa la semana.
3. **Dueña**: entra → «Sin volver» → llama a los pacientes por teléfono → desde su ficha crea una cita nueva.

## 6. Integraciones

| Integración | Para qué | Real o simulada | Variables de entorno |
| ----------- | -------- | --------------- | -------------------- |
| Ninguna     | —        | —               | —                    |

Fuera de las integraciones: el correo no se usa en esta versión (no hay recuperación de contraseña por correo; la administración restablece contraseñas).

## 7. Requisitos no funcionales

- Rendimiento: listados paginados de 20 en 20; agenda de semana en una sola consulta con índice (fisioterapeuta, inicio); respuesta por debajo de 1 s con 10.000 citas.
- Accesibilidad: WCAG 2.2 AA, estados con texto, formularios con errores asociados, objetivos táctiles ≥ 44 px en móvil.
- Móvil primero: agenda y formularios usables a 360 px de ancho sin desplazamiento horizontal de página.
- Seguridad: lista completa de `datos-seguridad.md`; sesión y permisos en cada acción y en la capa de datos; salud tratada como categoría especial.
- Navegadores: últimas versiones de Chrome, Safari, Firefox y Edge.
- Zona horaria: todo en Europe/Madrid para el usuario, UTC en base de datos.
- Disponibilidad y copias: las del proveedor (Neon, copias diarias); ubicación UE.

## 8. Inventario de datos personales

| Dato                               | De quién                | Para qué                                       | Base jurídica                                                         | Conservación                                                   |
| ---------------------------------- | ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| Nombre y teléfono                  | Pacientes               | Identificar y contactar para citas             | Ejecución del contrato de asistencia sanitaria (art. 6.1.b RGPD)       | Según la normativa de historia clínica; lo fija el responsable |
| Correo (opcional)                  | Pacientes               | Contacto alternativo                           | Ídem                                                                  | Ídem                                                           |
| Fecha de nacimiento (opcional)     | Pacientes               | Distinguir homónimos y adaptar la atención     | Ídem                                                                  | Ídem                                                           |
| Notas clínicas y motivo de la cita | Pacientes               | Continuidad de la atención (salud, art. 9.2.h) | Asistencia sanitaria por profesionales sujetos a secreto (art. 9.2.h)   | Ídem; la historia clínica tiene plazos legales propios         |
| Nombre, correo, rol de las cuentas | Equipo de la clínica    | Acceso a la aplicación y asignación de citas   | Ejecución del contrato laboral / interés legítimo                      | Mientras dure la relación                                      |
| Registro de actividad (solo ids)   | Equipo y pacientes      | Seguridad y trazabilidad de accesos a datos de salud | Obligación de seguridad (art. 32 RGPD)                           | 24 meses (propuesto)                                           |

Pendientes legales del cliente: razón social y responsable del tratamiento, valorar una EIPD por datos de salud, revisar con su asesor/DPD plazos de conservación, contrato de encargo con Vercel y Neon, y si la recepción debe ver las notas clínicas.

## 9. Fuera de alcance

- Recordatorios automáticos por WhatsApp o SMS.
- Facturación.
- Reserva online por los pacientes.
- Recuperación de contraseña por correo, importación desde Excel, historia clínica estructurada, horarios de apertura o bloqueos de agenda (vacaciones), citas recurrentes y vista de agenda de todos los fisioterapeutas a la vez.

## 10. Supuestos y decisiones

- Los fisioterapeutas son cuentas `user` o `admin` con la marca «atiende citas» (la dueña también es fisioterapeuta). La recepcionista es `user` sin marca.
- Cualquier `user` puede cambiar el estado de cualquier cita, no solo las suyas (la recepción cancela por teléfono).
- Las citas no se borran: se cancelan. El borrado se produce solo al eliminar al paciente (admin).
- «Sin volver» lo ve solo la administración, como pide el brief; ampliarlo a recepción queda como mejora propuesta.
- Referencia de «más de 60 días»: última cita `realizada` o fecha de alta, y sin cita programada futura.
- Marca verde salvia #5f8f74: se usa en fondos y acentos; los textos y botones usan tonos derivados que cumplen contraste AA (4,5:1), comprobado por la auditoría.
- El responsable del tratamiento se muestra como `PENDIENTE(cliente)` en /privacidad hasta recibir los datos.
- Citas de un fisioterapeuta bloqueado: se conservan; la administración las reasigna reprogramándolas (sin automatismo).
- Los minutos de inicio son múltiplos de 5; la duración, de 10 a 180.
