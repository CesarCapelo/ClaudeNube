import type { Metadata } from 'next';
import { configuracion } from '@/lib/configuracion';

export const metadata: Metadata = { title: 'Privacidad' };

// Información de protección de datos (RGPD, art. 13). Los datos del responsable son PENDIENTE(cliente)
// hasta que la clínica los facilite: no se inventan.
export default function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 leading-relaxed">
      <h1 className="text-3xl font-bold">Información sobre protección de datos</h1>
      <div className="mt-8 space-y-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
        <h2>Responsable del tratamiento</h2>
        <p>
          {configuracion.responsable}. Contacto: {configuracion.emailContacto}.
        </p>
        <h2>Qué datos tratamos y para qué</h2>
        <ul>
          <li>
            <strong>Pacientes:</strong> nombre, teléfono, correo y fecha de nacimiento (opcionales), notas
            clínicas y motivo de las citas, para identificar y contactar a los pacientes, gestionar sus citas
            y garantizar la continuidad de la asistencia.
          </li>
          <li>
            <strong>Equipo de la clínica:</strong> nombre, correo y contraseña cifrada, para dar acceso a la
            aplicación y asignar citas.
          </li>
          <li>
            <strong>Seguridad:</strong> dirección IP y navegador de las sesiones, y un registro de actividad
            con identificadores (sin datos personales) de las acciones sobre datos de pacientes.
          </li>
        </ul>
        <h2>Datos de salud</h2>
        <p>
          Las notas clínicas y el motivo de las citas son datos de salud, una categoría especial de datos. Se
          tratan para la asistencia sanitaria por profesionales sujetos al deber de secreto (art. 9.2.h del
          RGPD), solo son accesibles con sesión iniciada y no se muestran en listados ni en la agenda.
        </p>
        <h2>Base jurídica</h2>
        <p>
          Ejecución del contrato de asistencia sanitaria con el paciente (art. 6.1.b), cumplimiento de
          obligaciones legales de la historia clínica (art. 6.1.c), la relación laboral o contractual del
          equipo y el interés legítimo en la seguridad de la aplicación.
        </p>
        <h2>Conservación</h2>
        <p>
          Los datos de pacientes se conservan durante los plazos legales de la documentación clínica. El
          registro de actividad se conserva 24 meses. PENDIENTE(cliente): confirmar los plazos con su asesor.
        </p>
        <h2>Destinatarios</h2>
        <p>
          Proveedores de alojamiento y base de datos que actúan como encargados del tratamiento, con contrato
          conforme al artículo 28 del RGPD y servidores en la Unión Europea. PENDIENTE(cliente): confirmar los
          proveedores contratados y su región. No se ceden datos a terceros salvo obligación legal.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y
          portabilidad escribiendo a {configuracion.emailContacto}, y reclamar ante la Agencia Española de
          Protección de Datos (www.aepd.es).
        </p>
        <h2>Cookies</h2>
        <p>
          La aplicación solo usa cookies técnicas imprescindibles para mantener la sesión iniciada, que no
          requieren consentimiento.
        </p>
      </div>
    </main>
  );
}
