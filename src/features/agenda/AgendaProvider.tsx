import { ReactNode, useState } from "react";
import { BloqueoHorario, Cita, HorarioOcupado } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { listarBloqueosPublicos, listarHorasOcupadas } from "./api";

type ValorAgenda = {
  // Citas del panel (vienen de /citas/agenda con el token)
  citas: Cita[];
  setCitas: (citas: Cita[]) => void;
  agregarCita: (cita: Cita) => void;
  actualizarCita: (id: string, cambios: Partial<Cita>) => void;
  // Para reservar: horas tomadas y horarios bloqueados del equipo
  // (vienen del servidor, sin datos personales)
  citasOcupadas: HorarioOcupado[];
  bloqueos: BloqueoHorario[];
  cargarOcupacion: (empresaId: string) => Promise<void>;
};

const [AgendaContext, useAgenda] = crearContexto<ValorAgenda>("Agenda");
export { useAgenda };

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasOcupadas, setCitasOcupadas] = useState<HorarioOcupado[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoHorario[]>([]);

  const agregarCita = (cita: Cita) => setCitas((prev) => [...prev, cita]);

  const actualizarCita = (id: string, cambios: Partial<Cita>) =>
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));

  const cargarOcupacion = async (empresaId: string) => {
    const [ocupadas, bloqueados] = await Promise.allSettled([
      listarHorasOcupadas(empresaId),
      listarBloqueosPublicos(empresaId),
    ]);
    if (ocupadas.status === "fulfilled") setCitasOcupadas(ocupadas.value);
    else console.error("Error al cargar horas ocupadas:", ocupadas.reason);
    if (bloqueados.status === "fulfilled") setBloqueos(bloqueados.value);
    else console.error("Error al cargar horarios bloqueados:", bloqueados.reason);
  };

  return (
    <AgendaContext
      value={{
        citas,
        setCitas,
        agregarCita,
        actualizarCita,
        citasOcupadas,
        bloqueos,
        cargarOcupacion,
      }}
    >
      {children}
    </AgendaContext>
  );
}
