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
  totalCitas: number;
  totalVentas: number;
  gananciaEquipo: number;
  gananciaNegocio: number;
  porProfesional: GananciaProfesional[];
};

// Citas completadas entre desde y hasta ("2026-10-01"), incluidas.
// Admin: todo el negocio; integrante: solo lo suyo.
export const obtenerCartera = (token: string, desde: string, hasta: string) =>
  request<Cartera>(
    `/api/v1/cartera?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`,
    { token },
  );
