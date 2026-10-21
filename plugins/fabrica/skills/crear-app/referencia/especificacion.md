# Especificación funcional (fase 1)

La especificación convierte el brief en algo que se pueda construir y comprobar. Cada historia de usuario acaba siendo una prueba de extremo a extremo, así que **un criterio que no se pueda comprobar no es un criterio**.

## Plantilla de `.fabrica/especificacion.md`

```markdown
# Especificación: <aplicación>

Versión 1.0 · Basada en .fabrica/brief.md · Enfoque: <MVP | completo>

## 1. Objetivo
<2-3 frases: qué problema resuelve y cómo se medirá que funciona>

## 2. Roles y permisos
| Acción | admin | user | <otro rol> | Sin sesión |
| --- | --- | --- | --- | --- |
| Ver clientes | ✔ | ✔ | — | — |
| Crear / editar clientes | ✔ | ✔ | — | — |
| Eliminar clientes | ✔ | — | — | — |
| Gestionar cuentas | ✔ | — | — | — |

Reglas de ámbito: <p. ej. «cada usuario de una organización solo ve los datos de su organización»>.

## 3. Entidades
### Cliente
| Campo | Tipo | Obligatorio | Reglas |
| --- | --- | --- | --- |
| nombre | texto (2–120) | sí | |
| email | correo | no | único por organización |

Relaciones: <Cliente 1—N Cita>. Borrado: <restringido si tiene citas | en cascada | lógico (archivado)>.

## 4. Historias de usuario
### H1. Dar de alta un cliente
Como **user**, quiero registrar un cliente nuevo para tener sus datos a mano.

Criterios de aceptación:
- [ ] Con nombre válido, el cliente se guarda y aparece el primero del listado con el aviso «Cliente guardado».
- [ ] Sin nombre, o con un correo mal formado, no se guarda y cada campo muestra su error.
- [ ] Una persona sin sesión que abre /clientes/nuevo acaba en /entrar.

Prioridad: <imprescindible | importante | deseable>

## 5. Flujos principales
<pasos de los 2-4 flujos más importantes, con lo que ve el usuario en cada paso>

## 6. Integraciones
| Integración | Para qué | Real o simulada | Variables de entorno |
| --- | --- | --- | --- |

## 7. Requisitos no funcionales
- Rendimiento: listados paginados de 20 en 20; respuesta de página por debajo de 1 s con 10.000 registros.
- Accesibilidad: WCAG 2.2 AA.
- Seguridad: <la lista de datos-seguridad.md que aplique>.
- Navegadores: últimas versiones de Chrome, Safari, Firefox y Edge, en móvil y escritorio.
- Disponibilidad y copias: <según el alojamiento>.

## 8. Inventario de datos personales
| Dato | De quién | Para qué | Base jurídica | Conservación |
| --- | --- | --- | --- | --- |

## 9. Fuera de alcance
- …

## 10. Supuestos y decisiones
- <todo lo decidido sin preguntar, también registrado en decisiones.md>
```

## Buenas historias de usuario

- Una acción con valor para un rol concreto, que se pueda probar de principio a fin en la interfaz.
- Criterios en positivo y en negativo: qué pasa si todo va bien, si los datos son incorrectos y si alguien sin permiso lo intenta.
- Números concretos donde importen (paginación, límites, plazos).
- En un MVP, cada historia imprescindible debe ser necesaria para resolver el problema del brief. Si no, va a «deseable» o fuera de alcance.

## Revisión

Antes de dar la especificación por buena, pásala por `fabrica:revisor-requisitos` con este encargo:

```text
Compara .fabrica/especificacion.md con .fabrica/brief.md. Busca historias que falten para resolver el problema
del brief, historias que no se pidieron, criterios que no se puedan comprobar, permisos sin definir (quién puede
ver, crear, editar y borrar cada entidad), datos personales sin finalidad y contradicciones.
Responde con una lista priorizada de cambios concretos.
```
