'use client';

import { useActionState } from 'react';
import { Aviso } from '@/components/ui/aviso';
import { Boton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import { crearCitaAccion, reprogramarCitaAccion, type EstadoFormulario } from './acciones';

type Valores = {
  fisioterapeutaId: string;
  fecha: string;
  hora: string;
  duracionMin: string;
  motivo: string;
};

type Props = {
  fisioterapeutas: { id: string; nombre: string }[];
  inicial: Valores;
} & ({ modo: 'crear'; pacienteId: string } | { modo: 'reprogramar'; citaId: string });

/** Formulario de cita: alta (con paciente ya elegido) o reprogramación (fecha, hora, duración y fisioterapeuta). */
export function FormularioCita(props: Props) {
  const { fisioterapeutas, inicial } = props;
  const accion = props.modo === 'crear' ? crearCitaAccion : reprogramarCitaAccion.bind(null, props.citaId);
  const [estado, enviar, pendiente] = useActionState<EstadoFormulario, FormData>(accion, {});
  const valor = (campo: keyof Valores) => estado.valores?.[campo] ?? inicial[campo];
  const errores = estado.errores ?? {};
  const errorFisio = errores.fisioterapeutaId;
  const idErrorFisio = errorFisio?.length ? 'campo-fisioterapeutaId-error' : undefined;

  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}
      {props.modo === 'crear' && <input type="hidden" name="pacienteId" value={props.pacienteId} />}
      {errores.pacienteId && <Aviso tono="error">{errores.pacienteId.join(' ')}</Aviso>}

      <div>
        <label htmlFor="campo-fisioterapeutaId" className="block text-sm font-semibold">
          Fisioterapeuta
          <span aria-hidden="true"> *</span>
        </label>
        <select
          id="campo-fisioterapeutaId"
          name="fisioterapeutaId"
          defaultValue={valor('fisioterapeutaId')}
          aria-invalid={errorFisio?.length ? true : undefined}
          aria-describedby={idErrorFisio}
          className="mt-1.5 block w-full rounded-lg border border-tinta-suave/60 bg-white px-3 py-2 text-base aria-[invalid=true]:border-peligro"
        >
          {!fisioterapeutas.some((f) => f.id === valor('fisioterapeutaId')) && (
            <option value="">Elige un fisioterapeuta</option>
          )}
          {fisioterapeutas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
        {idErrorFisio && (
          <p id={idErrorFisio} className="mt-1 text-sm font-medium text-peligro">
            {errorFisio!.join(' ')}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          etiqueta="Fecha"
          nombre="fecha"
          type="date"
          required
          defaultValue={valor('fecha')}
          error={errores.fecha}
        />
        <Campo
          etiqueta="Hora"
          nombre="hora"
          type="time"
          step={300}
          required
          defaultValue={valor('hora')}
          error={errores.hora}
        />
        <Campo
          etiqueta="Duración (minutos)"
          nombre="duracionMin"
          type="number"
          inputMode="numeric"
          min={10}
          max={180}
          step={5}
          required
          defaultValue={valor('duracionMin')}
          error={errores.duracionMin}
        />
      </div>

      {props.modo === 'crear' && (
        <Campo
          etiqueta="Motivo (opcional)"
          nombre="motivo"
          multilinea
          defaultValue={valor('motivo')}
          ayuda="Máximo 300 caracteres. Solo se ve en el detalle de la cita, no en la agenda."
          error={errores.motivo}
        />
      )}

      <Boton type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando…' : props.modo === 'crear' ? 'Guardar cita' : 'Reprogramar cita'}
      </Boton>
    </form>
  );
}
