import { request } from "../../../services/api/http";

// Centro de notificaciones: sirve a cualquier sesión (personal, administradora o cliente
// con cuenta) y cada quien ve solo las suyas.

export type AvisoGuardado = {
  id: string;
  tipo: string;
  titulo: string;
  texto: string;
  // null si la cita se borró
  citaId: string | null;
  leida: boolean;
  leidaEn: string | null;
  creadaEn: string;
};

export type ListaAvisos = {
  total: number;
  noLeidas: number;
  pagina: number;
  limite: number;
  datos: AvisoGuardado[];
};

export const listarAvisos = (token: string, signal?: AbortSignal) =>
  request<ListaAvisos>("/api/v1/notificaciones?limite=30", { token, signal });

export const contarNoLeidas = (token: string, signal?: AbortSignal) =>
  request<{ noLeidas: number }>("/api/v1/notificaciones/no-leidas", { token, signal });

export const marcarAvisoLeido = (token: string, id: string) =>
  request<AvisoGuardado>(`/api/v1/notificaciones/${encodeURIComponent(id)}/leida`, {
    method: "PATCH",
    token,
  });

// Marca todas las del usuario como leídas (al abrir el panel de la campana)
export const marcarTodasLeidas = (token: string) =>
  request<{ mensaje: string; marcadas: number }>("/api/v1/notificaciones/leidas", {
    method: "PATCH",
    token,
  });
