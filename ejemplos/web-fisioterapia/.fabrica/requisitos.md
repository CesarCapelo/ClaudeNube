# Requisitos: Fisioterapia Lucía Martín

## Objetivo
- Objetivo de negocio: conseguir que particulares de Getafe y alrededores pidan cita en la clínica.
- Acción principal del visitante: escribir por WhatsApp o llamar (secundaria: formulario).
- Público: particulares de Getafe y alrededores; muchas mujeres en embarazo y posparto y corredores populares.

## Mapa del sitio
| Ruta | Página | Objetivo | Secciones | Palabra clave principal |
| --- | --- | --- | --- | --- |
| / | Inicio | Presentar la clínica y llevar a pedir cita | Hero, 3 servicios, cómo trabajo (50 min, misma fisioterapeuta), preguntas, CTA | fisioterapia en Getafe |
| /fisioterapia-deportiva | Fisioterapia deportiva | Captar corredores y deportistas populares | Hero, a quién ayuda, cómo es la sesión, preguntas, CTA | fisioterapeuta deportivo Getafe |
| /suelo-pelvico | Suelo pélvico | Captar embarazadas y mujeres en posparto | Hero, a quién ayuda, cómo es la sesión, preguntas, CTA | fisioterapia suelo pélvico Getafe |
| /dolor-de-espalda-y-cuello | Dolor de espalda y cuello | Captar personas con dolor de espalda/cuello | Hero, a quién ayuda, cómo es la sesión, preguntas, CTA | fisioterapia dolor de espalda Getafe |
| /sobre-mi | Sobre mí | Dar confianza: quién es Lucía y cómo trabaja | Presentación, forma de trabajar, hueco de foto, CTA | fisioterapeuta Getafe Sector III |
| /contacto | Contacto | Facilitar WhatsApp, llamada y formulario | Datos, horario, mapa diferido, formulario | — |
| /gracias | Gracias | Confirmación del formulario | — | — |
| /aviso-legal, /politica-privacidad, /politica-cookies, /accesibilidad | Legales | Cumplimiento LSSI y RGPD | — | — |
| /404 | Error | Reconducir | — | — |

## Funcionalidades
| Id | Funcionalidad | Criterio de aceptación |
| --- | --- | --- |
| F1 | Formulario de contacto | Nombre, correo, teléfono opcional, mensaje; casilla de privacidad obligatoria; modo Netlify Forms; página /gracias |
| F2 | Botón de WhatsApp | Visible en todas las páginas; abre wa.me/34600123456 con mensaje predefinido |
| F3 | Mapa | En /contacto, carga diferida (sin cookies hasta que la persona lo pide) y enlace a Google Maps |
| F4 | Llamada | Enlace tel: en cabecera/hero/contacto con el 600 123 456 |
| F5 | Datos estructurados | Physiotherapy en inicio; FAQPage en las páginas de servicio con preguntas |

## Requisitos no funcionales
- Lighthouse móvil de 90 o más en rendimiento, accesibilidad, buenas prácticas y SEO en todas las páginas.
- WCAG 2.2 AA: 0 fallos graves o críticos en axe y navegación completa con teclado.
- Sin desbordamiento horizontal desde 360 px de ancho.
- Textos legales conformes con la LSSI y el RGPD; sin cookies no exentas sin consentimiento (sin analítica).
- Sin errores en consola ni recursos rotos.
- Textos sanitarios sin promesas de curación ni resultados garantizados.

## Fuera de alcance
- Blog, tienda, reservas online, idiomas distintos del castellano, precios, testimonios, analítica.
- Fotos reales (se marcan los huecos), logotipo profesional (se crea un monograma).
- Compra del dominio, subida a remoto y publicación (sin permiso).

## Pendientes del cliente
- Fotos de la clínica y de Lucía; número de colegiada y colegio; razón social/nombre completo, NIF y domicilio del titular.
