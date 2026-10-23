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

// Con qué se compara el período (parámetro "comparar" del backend)
export type TipoComparacion = "anterior" | "mes_pasado" | "anio_pasado" | "personalizado";

export type Comparar = {
  tipo: TipoComparacion;
  // Solo se usan con "personalizado"
  desde: string;
  hasta: string;
};

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
    tipo: TipoComparacion;
    // Texto si el rango de comparación empieza antes del registro del negocio
    aviso: string | null;
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

// hoy, semana (lunes a domingo), mes, o rango con desde y hasta ("2026-10-01").
// comparar: con qué período se compara
export const obtenerResumenCartera = (
  token: string,
  periodo: PeriodoResumen,
  rango: { desde: string; hasta: string } | null,
  comparar: Comparar,
  signal?: AbortSignal,
) => {
  const fechas =
    periodo === "rango" && rango
      ? `&desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(rango.hasta)}`
      : "";
  const con =
    comparar.tipo === "personalizado"
      ? `&comparar=personalizado&compararDesde=${encodeURIComponent(comparar.desde)}&compararHasta=${encodeURIComponent(comparar.hasta)}`
      : `&comparar=${comparar.tipo}`;
  return request<ResumenCartera>(`/api/v1/cartera/resumen?periodo=${periodo}${fechas}${con}`, {
    token,
    signal,
  });
};

// Reportes del administrador (/api/v1/reportes): mismos filtros de período que la cartera
export type OcupacionProfesional = {
  barberoId: string;
  nombre: string;
  horasDisponibles: number;
  horasOcupadas: number;
  porcentajeOcupacion: number;
};

export type ReporteOcupacion = {
  desde: string;
  hasta: string;
  // Solo se mide hasta hoy; null si el período aún no empieza
  calculadoHasta: string | null;
  total: { horasDisponibles: number; horasOcupadas: number; porcentajeOcupacion: number };
  porProfesional: OcupacionProfesional[];
};

export type ServicioRentable = {
  servicioId: string;
  nombre: string;
  citas: number;
  ingresos: number;
  horasTrabajadas: number;
  ingresoPorHora: number;
  ticketPromedio: number;
};

export type ReporteServiciosRentables = {
  total: { citas: number; ingresos: number; horasTrabajadas: number; ingresoPorHora: number };
  // Ids de los servicios destacados; null si no hubo citas completadas
  servicioMayorIngreso: string | null;
  servicioMayorIngresoPorHora: string | null;
  servicios: ServicioRentable[]; // de mayor a menor ingreso
};

export type CeldaDemanda = { dia: number; hora: string; citas: number }; // dia: 0 = domingo

export type ReporteDemanda = {
  totalCitas: number;
  mapa: CeldaDemanda[];
  diaMasDemandado: number | null;
  horaMasDemandada: string | null;
  pico: CeldaDemanda | null;
};

export type ReportesCartera = {
  ocupacion: ReporteOcupacion;
  serviciosRentables: ReporteServiciosRentables;
  demanda: ReporteDemanda;
};

// Los tres reportes de un período (semana, mes o rango) a la vez
export const obtenerReportesCartera = async (
  token: string,
  periodo: PeriodoResumen,
  rango: { desde: string; hasta: string } | null,
  signal?: AbortSignal,
): Promise<ReportesCartera> => {
  const fechas =
    periodo === "rango" && rango
      ? `&desde=${encodeURIComponent(rango.desde)}&hasta=${encodeURIComponent(rango.hasta)}`
      : "";
  const pedir = <T>(ruta: string) =>
    request<T>(`/api/v1/reportes/${ruta}?periodo=${periodo}${fechas}`, { token, signal });
  const [ocupacion, serviciosRentables, demanda] = await Promise.all([
    pedir<ReporteOcupacion>("ocupacion"),
    pedir<ReporteServiciosRentables>("servicios-rentables"),
    pedir<ReporteDemanda>("demanda"),
  ]);
  return { ocupacion, serviciosRentables, demanda };
};
