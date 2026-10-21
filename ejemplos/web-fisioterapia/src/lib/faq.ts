export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

/** Datos estructurados FAQPage; las preguntas deben coincidir con las visibles en la página. */
export const faqJsonLd = (preguntas: Pregunta[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
});
