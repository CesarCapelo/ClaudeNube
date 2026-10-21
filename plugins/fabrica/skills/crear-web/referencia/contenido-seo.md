# Contenido y SEO

El texto vende y posiciona; el diseño solo lo hace brillar. Escribe primero el contenido completo en `.fabrica/contenido.md` y maqueta después.

## 1. Principios de redacción

- **Claro antes que ingenioso.** El visitante debe entender en una frase qué haces, para quién y dónde.
- **Beneficio antes que característica.** «Vuelve a caminar sin dolor» antes que «Fisioterapia avanzada».
- **Concreto.** Plazos, zonas, qué incluye, cómo se trabaja. Lo vago («soluciones integrales», «calidad y profesionalidad») no dice nada.
- **Una idea por sección**, con párrafos de 2 a 4 líneas, listas cuando haya elementos paralelos y titulares que se entiendan aunque solo se lean los titulares.
- **Habla al cliente**: «tú» en marcas cercanas y «usted» o fórmulas impersonales en sectores formales (legal, financiero, premium). Elige uno y no los mezcles.
- **Responde objeciones**: precio, plazo, confianza, desplazamiento, garantía. Las preguntas frecuentes sirven para eso.

## 2. Castellano de España

- Titulares y botones en mayúscula inicial y el resto en minúscula («Reformas integrales en Valencia», nunca «Reformas Integrales En Valencia»).
- Comillas angulares «», cifras con punto de millar (1.250), horas con dos puntos (9:00–14:00) y euros detrás de la cifra con espacio (1.290 €).
- Sin anglicismos innecesarios («reserva», no «booking»; «opiniones», no «reviews»), sin exclamaciones en serie y sin puntos suspensivos de adorno.
- Signos de apertura obligatorios (¿?, ¡!).

## 3. Lo que nunca se escribe

- **Hechos no confirmados**: años, número de clientes, premios, certificaciones, colegiaciones, garantías, plazos o precios que no estén en el brief. Usa `PENDIENTE(cliente): …` o redacta sin el dato.
- **Testimonios o reseñas inventados**, ni «basados en» reseñas reales. Solo valen los reales, aportados por el cliente y con permiso.
- **Superlativos no demostrables** («el mejor de Madrid», «líderes del sector»): pueden ser publicidad engañosa.
- **Sectores regulados**: en salud, nada de promesas de curación ni de resultados garantizados (la publicidad sanitaria está regulada); en servicios legales y financieros, nada de resultados ni rentabilidades garantizados; en alimentación, nada de propiedades saludables no autorizadas. Si el sector es regulado, anótalo en los pendientes para que el cliente valide los textos.

## 4. Estructura por tipo de página

**Inicio**: la de `diseno.md` (hero, confianza, servicios, cómo trabajamos, prueba social, preguntas frecuentes, acción y contacto).

**Servicio** (una página por servicio importante):

1. H1 con el servicio y la zona («Fisioterapia deportiva en Getafe»).
2. A quién va dirigido y qué problema resuelve.
3. Qué incluye o cómo es el proceso (pasos o lista).
4. Por qué con nosotros (diferenciadores reales del brief).
5. Precio o «desde», si el brief lo permite.
6. Preguntas frecuentes específicas (de 3 a 6).
7. Llamada a la acción y enlaces a servicios relacionados.

**Sobre nosotros**: historia real (del brief), quién está detrás (nombres solo si los da el brief), cómo se trabaja y valores demostrados con hechos, no con adjetivos.

**Contacto**: todas las vías, horario, zona de servicio, cuánto se tarda en responder (si el brief lo dice), mapa diferido y formulario.

**Artículo de blog** (solo si el brief pide blog con artículos): responde a una pregunta real de los clientes; título con la pregunta o la solución; entradilla con la respuesta corta; desarrollo con subtítulos; conclusión y llamada a la acción. Entre 800 y 1.500 palabras, sin relleno. Firma real si la hay.

## 5. SEO en cada página

| Elemento | Regla |
| --- | --- |
| Etiqueta title | 50–60 caracteres: `<Servicio o tema> en <Zona> \| <Marca>`. La plantilla añade la marca, así que la prop `titulo` va sin ella |
| Meta descripción | 120–155 caracteres, con beneficio, zona y llamada a la acción. Única por página |
| H1 | Exactamente uno, con la palabra clave principal escrita de forma natural |
| H2 y H3 | Estructura lógica sin saltos de nivel; incluyen variantes de la palabra clave cuando encajen |
| URL | Corta, en minúsculas, sin tildes ni eñes, con guiones: `/servicios/fisioterapia-deportiva` |
| Enlaces internos | Cada página enlaza al menos a otras dos relevantes, con anclas descriptivas (nunca «haz clic aquí») |
| Imágenes | `alt` que describe la imagen (no una lista de palabras clave); `alt=""` en las decorativas; nombres de fichero descriptivos |
| Datos estructurados | El inicio ya lleva LocalBusiness (del tipo más específico posible en `sitio.tipoSchema`). Añade `Service` en las páginas de servicio, `FAQPage` donde haya preguntas frecuentes, `BreadcrumbList` en páginas de segundo nivel y `BlogPosting` en artículos (ya incluido) |
| Idiomas | Con más de un idioma: rutas `/en/…`, etiquetas `hreflang` recíprocas y `x-default` (ver `funcionalidades.md`) |

Ejemplo de datos estructurados de preguntas frecuentes, que se pasan por la prop `jsonLd` del layout:

```ts
const preguntas = [{ pregunta: '¿Cuánto dura una sesión?', respuesta: 'Entre 45 y 60 minutos…' }];
const jsonLd = [{
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
}];
```

Las preguntas del JSON-LD deben coincidir con las visibles en la página.

## 6. SEO local

- **NAP idéntico** (nombre, dirección y teléfono) en la web, en la ficha de Google Business Profile y en los directorios. `sitio.ts` es la fuente; recomienda en la entrega revisar la ficha de Google.
- Una página por servicio, **no una página por ciudad** con el mismo texto cambiando el nombre: Google las trata como páginas puerta y las penaliza. Si el negocio atiende varias zonas, nómbralas en una sección de «Zona de servicio».
- Menciona referencias locales reales cuando aporten (barrio, cómo llegar, aparcamiento).
- En la entrega, recomienda pedir reseñas a clientes reales y responderlas.

## 7. Mapa de palabras clave

Añade esta tabla a `.fabrica/contenido.md` antes de redactar:

| Página | Palabra clave principal | Secundarias | Intención |
| --- | --- | --- | --- |
| / | fisioterapeuta en Getafe | clínica de fisioterapia Getafe, fisio Getafe centro | Encontrar un sitio de confianza cerca |
| /servicios/suelo-pelvico | fisioterapia de suelo pélvico Getafe | suelo pélvico posparto | Resolver un problema concreto |

Sin herramientas de volumen de búsqueda, razona la intención y usa el lenguaje del cliente final: cómo lo buscaría por teléfono o en el móvil. Si hay red, las búsquedas relacionadas y las preguntas de WebSearch ayudan.

## 8. Microtextos

- Botones con verbo y resultado: «Pide tu presupuesto sin compromiso», «Reserva tu primera cita», «Llámanos al 600 000 000». Evita «Enviar» o «Saber más» a secas.
- Junto al formulario, dile al usuario qué pasará después («Te respondemos en menos de 24 horas laborables», solo si el brief lo confirma).
- Mensajes de error que digan cómo arreglarlo («Escribe un correo válido, por ejemplo nombre@dominio.es»).

## 9. Checklist antes de dar el contenido por terminado

- [ ] Cada página tiene title, meta descripción, h1 y una palabra clave asignada, sin duplicados.
- [ ] Ningún dato inventado; todos los `PENDIENTE(cliente)` están registrados como pendientes.
- [ ] Se usa el tratamiento elegido (tú o usted) en toda la web.
- [ ] Titulares en mayúscula inicial, comillas angulares y formato de cifras de España.
- [ ] Cada servicio responde a quién, qué problema resuelve, qué incluye y cómo empezar.
- [ ] Preguntas frecuentes reales del sector, sin promesas reguladas.
- [ ] Llamadas a la acción claras y coherentes con el objetivo del brief.
- [ ] Textos alternativos escritos para todas las imágenes con información.
