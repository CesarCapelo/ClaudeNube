# Entrega (fase 7)

La entrega va dirigida a la persona de la empresa que revisa el trabajo antes de enseñárselo al cliente. Debe poder validar la aplicación en 1 o 2 horas sin leer el código, y saber exactamente qué falta.

## 1. `ENTREGA.md`

```markdown
# Entrega: <aplicación>

<fecha> · versión v1.0 · Producida de forma autónoma con la fábrica de aplicaciones. **Pendiente de revisión humana.**

## Resumen
<4 a 6 líneas: qué problema resuelve, para quién, qué incluye y estado general>

## Cómo probarla en local
1. `npm ci`
2. Copiar `.env.example` a `.env.local` y generar `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).
3. `npm run dev` y abrir http://localhost:3000. La primera cuenta que se registra es la administradora.
4. Datos de ejemplo: <cómo cargarlos, si hay script de semillas>.

Versión de prueba publicada: <URL o «no publicada»>.

## Historias de usuario
| Id | Historia | Estado | Prueba |
| --- | --- | --- | --- |
| H1 | … | Hecha | tests/e2e/…spec.ts |

## Resultados de calidad
| Comprobación | Resultado |
| --- | --- |
| Pruebas unitarias y de integración | <n> superadas |
| Pruebas de extremo a extremo (escritorio y móvil) | <n> superadas |
| Lighthouse móvil (mínimo) | Rendimiento <n> · Accesibilidad <n> · Buenas prácticas <n> |
| Accesibilidad (axe) | <n> graves o críticos |
| Dependencias (npm audit) | <n> altas o críticas |
| Revisión de seguridad | <resumen> |

## Integraciones
| Integración | Estado (real / simulada) | Qué falta para activarla |
| --- | --- | --- |

## Decisiones tomadas sin consultar
<las más relevantes; el resto en .fabrica/decisiones.md>

## Pendientes del cliente
<de .fabrica/pendientes-cliente.md>

## Limitaciones y pruebas manuales pendientes
<lo que no se pudo verificar en automático, con pasos para hacerlo a mano>

## Mejoras propuestas (fuera del alcance de esta versión)
<ideas surgidas durante el trabajo; son oportunidades de evolución, no defectos>

## Revisión humana recomendada (1-2 horas)
- [ ] Recorrer cada historia de usuario en móvil y en escritorio con cada rol.
- [ ] Intentar hacer con un rol sin permiso lo que no debe poder hacer.
- [ ] Revisar textos, mensajes de error y avisos.
- [ ] Revisar las decisiones tomadas sin consultar.
- [ ] Revisar `/privacidad` con el cliente.
- [ ] Revisar las migraciones (`drizzle/`) si se va a desplegar sobre datos existentes.
- [ ] Si hay app móvil: instalar el APK de prueba o la exportación web y recorrerla.

## Cómo desplegar
Ver `docs/puesta-en-produccion.md`.
```

## 2. `docs/manual-usuario.md`

Para las personas que usarán la app, sin tecnicismos y por roles. Una sección por tarea habitual, con pasos numerados: entrar, cambiar la contraseña, cada historia de usuario y, para la administración, dar de alta y bloquear cuentas. Incluye preguntas frecuentes («No puedo entrar», «He borrado algo por error») y el contacto de soporte (`PENDIENTE(empresa)`).

## 3. `docs/manual-tecnico.md`

Para el equipo de mantenimiento: arquitectura (enlace a `.fabrica/arquitectura.md`), modelo de datos, permisos, integraciones y sus variables, cómo añadir una entidad (receta de `arquitectura.md`), cómo ejecutar cada tipo de prueba, cómo aplicar migraciones y decisiones técnicas relevantes.

## 4. `docs/guion-video-formacion.md`

Guion de un vídeo de 8 a 10 minutos que grabará la persona que entregue: presentación, recorrido por rol, las 3 o 4 tareas más frecuentes, administración de usuarios, dónde pedir ayuda y siguientes pasos.

## 5. `README.md`

Técnico y breve: qué es, stack, requisitos (Node 24), arranque en local, comandos (`dev`, `verificar`, `test`, `db:generar`, `db:migrar`, `auditar`), estructura, variables de entorno y enlaces a `ENTREGA.md` y `docs/`.

## 6. Cierre

1. Repite la verificación completa (puertas 1 a 6 de `calidad.md`) después de escribir los documentos.
2. `git add -A && git commit -m "Entrega v1.0" && git tag v1.0`.
3. Con permiso de push: `git push -u origin HEAD --follow-tags`.
4. `node .fabrica/herramientas/estado.mjs entregar`.
5. Mensaje final al usuario, de 6 a 10 líneas: dónde está la app, cómo arrancarla, historias hechas, resultados de pruebas y calidad, integraciones simuladas, pendientes del cliente y que el detalle está en `ENTREGA.md`.
