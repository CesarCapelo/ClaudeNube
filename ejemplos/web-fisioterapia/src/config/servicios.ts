// Contenido de las páginas de servicio. El texto fuente está en .fabrica/contenido.md.
import type { Pregunta } from '../lib/faq';

export interface Servicio {
  ruta: string;
  nombre: string;
  icono: 'Footprints' | 'Baby' | 'Activity';
  /** Título de la etiqueta title, sin la marca. */
  titulo: string;
  descripcion: string;
  h1: string;
  intro: string;
  resumen: string;
  interesa: string[];
  sesion: { titulo: string; texto: string }[];
  porQue: string[];
  hueco: string;
  varianteHueco: 'a' | 'b' | 'c';
  aviso?: string;
  preguntas: Pregunta[];
}

export const servicios: Servicio[] = [
  {
    ruta: '/fisioterapia-deportiva',
    nombre: 'Fisioterapia deportiva',
    icono: 'Footprints',
    titulo: 'Fisioterapia deportiva en Getafe',
    descripcion:
      'Fisioterapia deportiva en Getafe para corredores y deportistas populares: sesiones de 50 minutos, siempre con la misma fisioterapeuta.',
    h1: 'Fisioterapia deportiva en Getafe',
    intro:
      'Para corredores populares y para quien entrena por gusto. Si una molestia te frena, te ayudo a entender qué pasa y a volver a tu ritmo con criterio.',
    resumen:
      'Si corres o entrenas y una molestia te frena, te ayudo a entender qué pasa y a volver a tu ritmo con criterio.',
    interesa: [
      'Notas molestias en la rodilla, el tobillo, el gemelo o la cadera al correr.',
      'Te ha empezado a doler después de subir kilómetros o de preparar una carrera.',
      'Quieres volver a entrenar después de una lesión.',
      'Dudas si seguir corriendo con una molestia.',
    ],
    sesion: [
      {
        titulo: 'Repasamos tu actividad',
        texto: 'Cuánto entrenas, con qué calzado y qué ha cambiado en las últimas semanas.',
      },
      {
        titulo: 'Valoro tu movimiento y tu fuerza',
        texto: 'Veo cómo se mueve la zona que te molesta y cómo responde al esfuerzo.',
      },
      {
        titulo: 'Terapia manual y ejercicio',
        texto: 'Trabajo con las manos y con ejercicios pensados para tu caso.',
      },
      {
        titulo: 'Pautas para seguir entrenando',
        texto: 'Te explico cómo adaptar la carga mientras te recuperas.',
      },
    ],
    porQue: [
      'Valoro tu movimiento y tu fuerza, no solo la zona que duele.',
      'Te explico cómo adaptar el entrenamiento mientras te recuperas.',
      'Sesión individual de 50 minutos, siempre con la misma fisioterapeuta.',
    ],
    hueco: 'la sala de tratamiento',
    varianteHueco: 'a',
    preguntas: [
      {
        pregunta: '¿Puedo seguir corriendo si me duele la rodilla?',
        respuesta:
          'Depende de qué te duele y de cuánto. En la valoración vemos qué carga tolera tu cuerpo y te propongo cómo adaptar el entrenamiento. Si el dolor es intenso, llega tras un golpe o te impide apoyar, antes consulta con tu médico.',
      },
      {
        pregunta: '¿Cuánto tardaré en volver a correr?',
        respuesta:
          'Depende de la lesión y de cada persona, así que no puedo darte un plazo sin valorarte. Tras la primera sesión sabrás qué hacer y cómo iremos viendo tu evolución.',
      },
      {
        pregunta: '¿Qué hacemos en la primera sesión?',
        respuesta:
          'Hablamos de tu actividad y de lo que te pasa, valoro tu movimiento y empezamos a trabajar si procede. Te vas con pautas claras para los días siguientes.',
      },
      {
        pregunta: '¿Merece la pena venir si solo corro por afición?',
        respuesta:
          'Sí. No hace falta competir para tener una molestia que te frene. El objetivo es que puedas seguir disfrutando de correr.',
      },
    ],
  },
  {
    ruta: '/suelo-pelvico',
    nombre: 'Suelo pélvico',
    icono: 'Baby',
    titulo: 'Suelo pélvico en Getafe',
    descripcion:
      'Fisioterapia de suelo pélvico en Getafe, en embarazo y posparto: sesiones individuales de 50 minutos con trato cercano y sin prisas.',
    h1: 'Fisioterapia de suelo pélvico en Getafe',
    intro:
      'Acompañamiento en el embarazo y el posparto, con tiempo, privacidad y sin juicios. Hablamos de lo que te pasa con naturalidad.',
    resumen:
      'Embarazo y posparto: conocer cómo está tu suelo pélvico, resolver dudas y trabajar con ejercicios pensados para ti.',
    interesa: [
      'Estás embarazada y quieres prepararte y resolver dudas.',
      'Has tenido un bebé y quieres saber cómo está tu suelo pélvico.',
      'Se te escapa la orina al toser, reír o saltar.',
      'Notas pesadez o molestias en la zona.',
      'Sientes dolor en las relaciones sexuales.',
      'Quieres volver al deporte después del parto.',
    ],
    sesion: [
      {
        titulo: 'Hablamos con calma',
        texto: 'Me cuentas cómo te encuentras y qué te preocupa, sin prisas.',
      },
      {
        titulo: 'Te explico antes de empezar',
        texto:
          'Te cuento lo que voy a hacer y lo hago solo si tú quieres. Puedes parar cuando quieras.',
      },
      {
        titulo: 'Ejercicios y técnicas adaptados',
        texto: 'Trabajamos según tu momento: embarazo, posparto o vuelta al deporte.',
      },
      {
        titulo: 'Pautas para casa',
        texto: 'Te llevas ejercicios sencillos y claros para el día a día.',
      },
    ],
    porQue: [
      'Un espacio privado, sin prisas y sin juicios.',
      'Te explico antes lo que voy a hacer y decides tú en cada paso.',
      'Sesión individual de 50 minutos, siempre con la misma fisioterapeuta.',
    ],
    hueco: 'un rincón luminoso de la clínica',
    varianteHueco: 'b',
    aviso:
      'No sustituyo a tu matrona, tu ginecólogo ni tu médico. Si tienes sangrado, fiebre o dolor intenso, consulta con ellos.',
    preguntas: [
      {
        pregunta: '¿Cuándo puedo ir después del parto?',
        respuesta:
          'Depende de cada caso: de cómo fue el parto y de cómo te encuentres. Lo habitual es consultarlo con tu matrona o tu ginecólogo; si tienes dudas, escríbeme y lo vemos.',
      },
      {
        pregunta: '¿Es normal que se escape la orina después de tener un bebé?',
        respuesta:
          'Es frecuente y puedes consultarlo: lo valoramos en la sesión. Si hay sangrado, fiebre o dolor intenso, consulta antes con tu médico.',
      },
      {
        pregunta: '¿Puedo ir durante el embarazo?',
        respuesta:
          'Puede ser útil para prepararte y resolver dudas, siempre que tu embarazo lo permita. Si tienes indicación médica de reposo, consúltalo con tu médico antes.',
      },
      {
        pregunta: '¿Duele la revisión?',
        respuesta:
          'El objetivo no es que duela. Te explico antes lo que voy a hacer, vamos a tu ritmo y puedes parar cuando quieras.',
      },
    ],
  },
  {
    ruta: '/dolor-de-espalda-y-cuello',
    nombre: 'Dolor de espalda y cuello',
    icono: 'Activity',
    titulo: 'Dolor de espalda y cuello en Getafe',
    descripcion:
      'Fisioterapia para el dolor de espalda y cuello en Getafe: valoración, terapia manual y ejercicio en sesiones individuales de 50 minutos.',
    h1: 'Fisioterapia para el dolor de espalda y cuello en Getafe',
    intro:
      'Cuando el dolor te acompaña en el trabajo, al dormir o al moverte, conviene entender de dónde viene. Lo valoramos con tiempo.',
    resumen:
      'Valoración, terapia manual y ejercicio para entender de dónde viene el dolor y moverte con más tranquilidad.',
    interesa: [
      'Tienes dolor lumbar que aparece tras horas sentado o de pie.',
      'Notas rigidez o contracturas en el cuello y los hombros con el ordenador.',
      'El dolor va y viene desde hace semanas o meses.',
      'Te da miedo moverte por si empeora.',
    ],
    sesion: [
      {
        titulo: 'Me cuentas qué te pasa',
        texto: 'Cómo es el dolor, desde cuándo y cómo es tu día a día.',
      },
      {
        titulo: 'Valoro postura y movimiento',
        texto: 'Exploro la zona dolorida y cómo te mueves.',
      },
      {
        titulo: 'Terapia manual y ejercicio',
        texto: 'Trabajo con las manos y te enseño ejercicios para hacer tú.',
      },
      {
        titulo: 'Pautas para el trabajo y el descanso',
        texto: 'Pequeños cambios para tu día a día.',
      },
    ],
    porQue: [
      'Valoro postura y movimiento, no solo el punto que duele.',
      'Te enseño ejercicios sencillos para hacer en casa o en el trabajo.',
      'Sesión individual de 50 minutos, siempre con la misma fisioterapeuta.',
    ],
    hueco: 'la camilla y la luz de la clínica',
    varianteHueco: 'c',
    preguntas: [
      {
        pregunta: '¿Cuándo voy al fisioterapeuta y cuándo al médico?',
        respuesta:
          'Si el dolor es molesto pero te permite moverte, puedes empezar por una valoración de fisioterapia. Si es muy intenso, llega tras un golpe, o lo acompañan fiebre, pérdida de fuerza u hormigueo que no cede, consulta antes con tu médico.',
      },
      {
        pregunta: '¿Por qué me duele el cuello cuando trabajo con el ordenador?',
        respuesta:
          'Las posturas mantenidas durante horas suelen cargar el cuello y los hombros. En la valoración vemos qué te está pasando a ti y qué cambios te vienen bien.',
      },
      {
        pregunta: '¿Cuántas sesiones necesitaré?',
        respuesta:
          'Depende de cada persona y de cada caso. Tras la valoración te cuento qué propongo y vamos revisando cómo evolucionas, sin compromisos de número de sesiones.',
      },
      {
        pregunta: '¿Qué diferencia hay entre una sesión de 50 minutos y una más corta?',
        respuesta:
          'Con 50 minutos hay tiempo para escuchar, explorar, tratar y enseñarte ejercicios en la misma sesión, sin ir con prisa.',
      },
    ],
  },
];
