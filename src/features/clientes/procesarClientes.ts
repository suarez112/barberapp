import { Cita, ClienteRegistrado } from "@/types";
import { diasTranscurridos } from "@/utils/fechas";

export type FiltroEstadoCliente = "TODOS" | "ACTIVOS" | "INACTIVOS";
export type OrdenCliente = "DIAS_DESC" | "DIAS_ASC" | "CITAS_DESC" | "CITAS_ASC";

export type ClienteProcesado = ClienteRegistrado & {
  totalCitasCalculado: number;
  diasTranscurridos: number;
  estadoCliente: "ACTIVO" | "INACTIVO";
};

// Fecha fija con la que se calculan los "días sin venir" de los datos de prueba.
// TODO: usar la fecha actual cuando el historial venga del backend.
export const FECHA_REFERENCIA_CLIENTES = new Date(2026, 9, 8);

const SIN_REGISTRO = 999;

type Parametros = {
  clientes: ClienteRegistrado[];
  // Solo las citas que el usuario puede ver (las suyas o las del supervisado)
  citasVisibles: Cita[];
  filtro: FiltroEstadoCliente;
  orden: OrdenCliente;
  referencia?: Date;
};

const COMPARADORES: Record<
  OrdenCliente,
  (a: ClienteProcesado, b: ClienteProcesado) => number
> = {
  DIAS_DESC: (a, b) => b.diasTranscurridos - a.diasTranscurridos,
  DIAS_ASC: (a, b) => a.diasTranscurridos - b.diasTranscurridos,
  CITAS_DESC: (a, b) => b.totalCitasCalculado - a.totalCitasCalculado,
  CITAS_ASC: (a, b) => a.totalCitasCalculado - b.totalCitasCalculado,
};

export const procesarClientes = ({
  clientes,
  citasVisibles,
  filtro,
  orden,
  referencia = FECHA_REFERENCIA_CLIENTES,
}: Parametros): ClienteProcesado[] =>
  clientes
    .map((cliente): ClienteProcesado => {
      const citasDelCliente = citasVisibles.filter(
        (c) => c.telefono.trim() === cliente.telefono.trim(),
      );
      const total = citasDelCliente.length || cliente.totalCitas || 0;
      const esActivo = total > 1 || citasDelCliente.length > 0;
      return {
        ...cliente,
        totalCitasCalculado: total,
        diasTranscurridos: cliente.fechaUltimaCita
          ? diasTranscurridos(cliente.fechaUltimaCita, referencia)
          : SIN_REGISTRO,
        estadoCliente: esActivo ? "ACTIVO" : "INACTIVO",
      };
    })
    .filter((c) => {
      if (filtro === "ACTIVOS") return c.estadoCliente === "ACTIVO";
      if (filtro === "INACTIVOS") return c.estadoCliente === "INACTIVO";
      return true;
    })
    .sort(COMPARADORES[orden]);
