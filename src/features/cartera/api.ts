import { request } from "../../services/api/http";

export type GananciaProfesional = {
  barberoId: string;
  nombre: string;
  activo: boolean;
  porcentajeGanancia: number; // porcentaje actual (informativo)
  citas: number;
  ventas: number;
  ganancia: number; // con el porcentaje que tenía cada cita al completarse
};

export type Cartera = {
  desde: string;
  hasta: string;
  barberoId: string | null; // filtro aplicado; null = todo el negocio
  totalCitas: number;
  totalVentas: number;
  gananciaEquipo: number;
  gananciaNegocio: number;
  porProfesional: GananciaProfesional[];
};

// Citas completadas entre desde y hasta ("2026-10-01"), incluidas.
// Admin: todo el negocio; integrante: solo lo suyo.
// barberoId: un integrante (solo admin); sin él, todo el negocio
export const obtenerCartera = (
  token: string,
  desde: string,
  hasta: string,
  barberoId?: string | null,
  signal?: AbortSignal,
) => {
  const filtro = barberoId ? `&barberoId=${encodeURIComponent(barberoId)}` : "";
  return request<Cartera>(
    `/api/v1/cartera?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}${filtro}`,
    { token, signal },
  );
};
