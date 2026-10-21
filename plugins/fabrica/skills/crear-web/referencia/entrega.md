# Entrega

La entrega se dirige a la persona de la empresa que revisa el trabajo antes de enseñárselo al cliente. Debe poder validar la web en una hora sin leer el código. Escribe con datos, no con adjetivos, y sé honesto con lo que falta.

## 1. `ENTREGA.md` (raíz del proyecto)

```markdown
# Entrega: web de <cliente>

<fecha> · versión v1.0 · Producida de forma autónoma con la fábrica de webs. **Pendiente de revisión humana.**

## Resumen
<3 a 5 líneas: qué web es, para qué sirve, páginas, funcionalidades y estado general (lista para revisar / con limitaciones)>

## Cómo verla
- En local: `npm ci && npm run build && npx astro preview` y abrir http://localhost:4321
- Versión de prueba: <URL o «no publicada»>

## Qué incluye
| Página | Ruta | Objetivo |
| --- | --- | --- |

Funcionalidades: <formulario (modo), WhatsApp, mapa diferido, blog, reservas, tienda, idiomas…>

## Resultados de calidad
| Comprobación | Resultado |
| --- | --- |
| Tests de navegador (escritorio y móvil) | <n> superados de <n> |
| Lighthouse móvil (mínimo de todas las páginas) | Rendimiento <n> · Accesibilidad <n> · Buenas prácticas <n> · SEO <n> |
| Accesibilidad (axe) | <n> fallos graves o críticos · <n> avisos |
| Enlaces rotos | <n> |
| Revisión visual (media de la rúbrica) | <n>/5 |
| Requisitos cumplidos | <n> de <n> |

Informe completo: `.fabrica/auditoria/informe.md` (se regenera con `npm run auditar`).

## Decisiones tomadas sin consultar
<las 5 a 10 más relevantes en una línea cada una; el resto en .fabrica/decisiones.md>

## Pendientes del cliente
<lista de .fabrica/pendientes-cliente.md con lo que hay que pedir o confirmar antes de publicar>

## Limitaciones y lo que no se pudo verificar
<honesto: p. ej. «El envío real del formulario no se ha probado: requiere desplegar en Netlify»>

## Revisión humana recomendada (unos 60 minutos)
- [ ] Recorrer todas las páginas en un móvil real y en un ordenador.
- [ ] Leer los textos completos buscando tono, errores o afirmaciones que el cliente no haya confirmado.
- [ ] Comprobar datos de contacto, horario y dirección contra el brief.
- [ ] Revisar las decisiones tomadas sin consultar y cambiar las que no convenzan.
- [ ] Navegar solo con teclado (Tab, Mayús+Tab, Intro, Esc) por inicio y contacto.
- [ ] Revisar los textos legales con los datos del titular.
- [ ] Probar el formulario en la versión de prueba (si está publicada).
- [ ] Decidir con el cliente los pendientes y la fecha de publicación.

## Cómo publicar
Ver `docs/puesta-en-produccion.md`.

## Mantenimiento recomendado
<plan sugerido según la web: actualizaciones, informe mensual, artículos, revisión SEO>
```

## 2. `docs/manual-cliente.md`

Para el cliente final, en lenguaje sencillo, sin tecnicismos:

1. Tu web en dos líneas: qué páginas tiene y para qué sirve cada una.
2. Cómo te llegan los mensajes del formulario y qué hacer si no llegan.
3. Cómo pedir cambios (dentro del plan de mantenimiento) y qué información enviar.
4. Si hay CMS: cómo entrar, crear o editar un artículo y publicarlo, paso a paso.
5. Cómo ver las estadísticas de visitas (si hay analítica).
6. Buenas prácticas: pedir reseñas en Google, mantener actualizada la ficha de Google Business y no cambiar el DNS sin avisar.
7. Seguridad: quién tiene acceso a las cuentas y cómo activar la verificación en dos pasos.
8. Contacto de soporte: `PENDIENTE(empresa)`.

## 3. `docs/guion-video-formacion.md`

Guion de un vídeo de 5 a 7 minutos que grabará la persona que entregue la web:

| Minuto | Pantalla | Qué decir |
| --- | --- | --- |
| 0:00 | Inicio en el móvil | Bienvenida y objetivo de la web |
| 0:45 | Recorrido por cada página | Qué hay en cada una y por qué |
| 2:30 | Formulario y WhatsApp | Cómo te llegan los contactos |
| 3:30 | CMS o petición de cambios | Cómo se actualiza la web |
| 5:00 | Estadísticas y ficha de Google | Cómo seguir los resultados |
| 6:00 | Cierre | Pendientes, siguientes pasos y soporte |

## 4. `README.md` del proyecto

Técnico y breve: stack, requisitos (Node 24), comandos (`npm ci`, `dev`, `build`, `verificar`, `auditar`, `imagenes`), estructura de carpetas, dónde se cambian los datos del negocio (`src/config/sitio.ts`) y los colores (`src/styles/global.css`), cómo se despliega y un enlace a `ENTREGA.md`.

## 5. Cierre

1. Repite la verificación final (fase 6, pasos 1 y 2) después de escribir los documentos.
2. `git add -A && git commit -m "Entrega v1.0" && git tag v1.0`.
3. Si hay permiso de push: `git push -u origin HEAD --follow-tags`.
4. `node .fabrica/herramientas/estado.mjs entregar`.
5. Mensaje final al usuario, de 6 a 10 líneas: dónde está la web, cómo verla, resultados clave de calidad, número de pendientes del cliente, limitaciones importantes y que el detalle está en `ENTREGA.md`.
