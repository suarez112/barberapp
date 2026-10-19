import { request } from "../../services/api/http";

// Bloqueo de horario de un profesional:
// - "semanal": se repite cada semana el mismo día (diaSemana, fecha null)
// - "fecha": solo ese día (fecha "2026-10-21", diaSemana null)
// todoElDia llega como "00:00"–"24:00".
export type Bloqueo = {
  id: string;
  barberoId: string;
  barberoNombre: string;
  tipo: "semanal" | "fecha";
  diaSemana: number | null; // 0 = domingo … 6 = sábado
  fecha: string | null;
  todoElDia: boolean;
  horaInicio: string; // "12:00"
  horaFin: string; // "13:00"
  motivo: string | null;
};

// Uno de los dos: diaSemana (cada semana) o fecha (solo ese día).
// Con todoElDia el backend ignora las horas.
export type NuevoBloqueo = { barberoId: string; motivo?: string | null } & (
  | { diaSemana: number; fecha?: never }
  | { fecha: string; diaSemana?: never }
) &
  ({ horaInicio: string; horaFin: string; todoElDia?: never } | { todoElDia: true });

// Admin: de un profesional (barberoId); integrante: los suyos (sin barberoId).
// Trae los semanales y los de fecha de hoy en adelante.
export const listarBloqueos = (token: string, barberoId?: string) =>
  request<Bloqueo[]>(
    `/api/v1/bloqueos${barberoId ? `?barberoId=${encodeURIComponent(barberoId)}` : ""}`,
    { token },
  );

// Solo la administradora crea y borra bloqueos
export const crearBloqueo = (token: string, datos: NuevoBloqueo) =>
  request<Bloqueo>("/api/v1/bloqueos", { method: "POST", body: datos, token });

export const eliminarBloqueo = (token: string, id: string) =>
  request<{ mensaje: string }>(`/api/v1/bloqueos/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
