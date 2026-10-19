import { request } from "../../services/api/http";

// Bloqueo semanal de horario: se repite cada semana el mismo día
export type Bloqueo = {
  id: string;
  barberoId: string;
  barberoNombre: string;
  diaSemana: number; // 0 = domingo … 6 = sábado
  horaInicio: string; // "12:00"
  horaFin: string; // "13:00"
  motivo: string | null;
};

export type NuevoBloqueo = {
  barberoId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  motivo?: string | null;
};

// Admin: de un profesional (barberoId); integrante: los suyos (sin barberoId)
export const listarBloqueos = (token: string, barberoId?: string) =>
  request<Bloqueo[]>(
    `/api/v1/bloqueos${barberoId ? `?barberoId=${encodeURIComponent(barberoId)}` : ""}`,
    { token },
  );

export const crearBloqueo = (token: string, datos: NuevoBloqueo) =>
  request<Bloqueo>("/api/v1/bloqueos", { method: "POST", body: datos, token });

export const eliminarBloqueo = (token: string, id: string) =>
  request<{ mensaje: string }>(`/api/v1/bloqueos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
