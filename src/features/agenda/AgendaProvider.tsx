import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { CITAS_INICIALES } from "../../data/mocks";
import { BloqueoHorario, Cita, HorarioOcupado } from "../../types";
import { crearContexto } from "../../utils/crearContexto";
import { listarHorasOcupadas } from "./api";

type ValorAgenda = {
  citas: Cita[];
  setCitas: (citas: Cita[]) => void;
  agregarCita: (cita: Cita) => void;
  actualizarCita: (id: string, cambios: Partial<Cita>) => void;
  // Horas tomadas por otros clientes (vienen del servidor, sin datos personales)
  citasOcupadas: HorarioOcupado[];
  cargarHorasOcupadas: (empresaId: string) => Promise<void>;
  bloqueos: BloqueoHorario[];
  setBloqueos: Dispatch<SetStateAction<BloqueoHorario[]>>;
};

const [AgendaContext, useAgenda] = crearContexto<ValorAgenda>("Agenda");
export { useAgenda };

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [citas, setCitas] = useState<Cita[]>(CITAS_INICIALES);
  const [citasOcupadas, setCitasOcupadas] = useState<HorarioOcupado[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoHorario[]>([]);

  const agregarCita = (cita: Cita) => setCitas((prev) => [...prev, cita]);

  const actualizarCita = (id: string, cambios: Partial<Cita>) =>
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));

  const cargarHorasOcupadas = async (empresaId: string) => {
    try {
      setCitasOcupadas(await listarHorasOcupadas(empresaId));
    } catch (error) {
      console.error("Error al cargar horas ocupadas:", error);
    }
  };

  return (
    <AgendaContext
      value={{
        citas,
        setCitas,
        agregarCita,
        actualizarCita,
        citasOcupadas,
        cargarHorasOcupadas,
        bloqueos,
        setBloqueos,
      }}
    >
      {children}
    </AgendaContext>
  );
}
