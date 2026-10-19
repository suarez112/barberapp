import { request } from "../../services/api/http";
import { BloqueoHorario, Cita, HorarioOcupado } from "../../types";

export type NuevaCita = {
  empresaId: string;
  barberoId: string;
  servicioId: string;
  fecha: string;
  hora: string;
  nombre: string;
  telefono: string;
  indicativo: string;
};

// Horas ya tomadas en el negocio (sin datos personales)
export const listarHorasOcupadas = (empresaId: string) =>
  request<HorarioOcupado[]>(
    `/api/v1/citas/ocupadas?empresaId=${encodeURIComponent(empresaId)}`,
  );

// Horarios en que el equipo no atiende (sin el motivo)
export const listarBloqueosPublicos = (empresaId: string) =>
  request<BloqueoHorario[]>(
    `/api/v1/citas/bloqueos?empresaId=${encodeURIComponent(empresaId)}`,
  );

export const crearCita = (cita: NuevaCita) =>
  request<{ cita: Cita }>("/api/v1/citas", { method: "POST", body: cita });

// Citas reales del negocio. Requiere el token del inicio de sesión
export const listarAgenda = (token: string) =>
  request<Cita[]>("/api/v1/citas/agenda", { token });

export const completarCita = (id: string, token: string) =>
  request<{ completadaEn: string; completadaPor: string }>(
    `/api/v1/citas/${id}/completar`,
    { method: "PATCH", token },
  );

export const cancelarCita = (id: string, token: string) =>
  request<{ canceladaEn?: string; canceladaPor?: string }>(
    `/api/v1/citas/${id}/cancelar`,
    { method: "PATCH", token },
  );
