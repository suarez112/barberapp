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

export type PeriodoResumen = "hoy" | "semana" | "mes" | "rango";

export type ProfesionalResumen = {
  barberoId: string;
  nombre: string;
  activo: boolean;
  citas: number;
  ventas: number;
  ganancia: number; // lo que ganó el profesional en el período
};

// GET /cartera/resumen: totales de un período con fechas de Colombia
export type ResumenCartera = {
  periodo: PeriodoResumen;
  desde: string;
  hasta: string;
  barberoId: string | null;
  totalVentas: number;
  gananciaNegocio: number; // ventas − lo que ganó el equipo
  citasCompletadas: number;
  porProfesional: ProfesionalResumen[]; // de mayor a menor en ventas
} & EstadisticasResumen;

// Variación en % contra el período anterior: null = antes era 0 y ahora no (no hay % que calcular)
export type VariacionResumen = {
  ventas: number | null;
  gananciaNegocio: number | null;
  gananciaEquipo: number | null;
  citas: number | null;
};

// Campos de estadísticas del mismo GET /cartera/resumen
export type EstadisticasResumen = {
  ticketPromedio: number; // totalVentas / citasCompletadas (0 si no hubo citas)
  comparacion: {
    periodoAnterior: {
      desde: string;
      hasta: string;
      totalVentas: number;
      gananciaNegocio: number;
      gananciaEquipo: number;
      citasCompletadas: number;
    };
    variacionPorcentaje: VariacionResumen;
  };
  ventasPorDia: { fecha: string; ventas: number; citas: number }[]; // todos los días, con ceros
  serviciosMasVendidos: { servicioId: string; nombre: string; cantidad: number; ventas: number }[];
  ocupacion: {
    diasSemana: { dia: number; citas: number }[]; // 0 = domingo … 6 = sábado
    horas: { hora: string; citas: number }[]; // solo las horas con citas
    diaMasOcupado: number | null;
    horaMasOcupada: string | null;
  };
  cancelaciones: { totalCitas: number; canceladas: number; tasaPorcentaje: number };
  clientes: { nuevos: number; recurrentes: number };
  pagoProfesionales: {
    total: number;
    detalle: {
      barberoId: string;
      nombre: string;
      activo: boolean;
      porcentajeGanancia: number;
      citas: number;
      ventas: number;
      aPagar: number;
    }[];
  };
};

// hoy, semana (lunes a domingo), mes, o rango con desde y hasta ("2026-10-01")
export const obtenerResumenCartera = (
  token: string,
  periodo: PeriodoResumen,
  rango: { desde: string; hasta: string } | null,
  signal?: AbortSignal,
) => {
  const fechas =
    periodo === "rango" && rango
      ? `&desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(rango.hasta)}`
      : "";
  return request<ResumenCartera>(`/api/v1/cartera/resumen?periodo=${periodo}${fechas}`, {
    token,
    signal,
  });
};
