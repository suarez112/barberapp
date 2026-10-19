import { diasTranscurridos } from "@/utils/fechas";
import { Cliente } from "./api";

export type FiltroEstadoCliente = "TODOS" | "ACTIVOS" | "INACTIVOS";
export type OrdenCliente = "DIAS_DESC" | "DIAS_ASC" | "CITAS_DESC" | "CITAS_ASC";

export type ClienteProcesado = Cliente & {
  diasTranscurridos: number;
  estadoCliente: "ACTIVO" | "INACTIVO";
};

const SIN_REGISTRO = 999;
// Un cliente es frecuente si ha venido al menos dos veces
const CITAS_FRECUENTE = 2;

type Parametros = {
  clientes: Cliente[];
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
  CITAS_DESC: (a, b) => b.totalCitas - a.totalCitas,
  CITAS_ASC: (a, b) => a.totalCitas - b.totalCitas,
};

export const procesarClientes = ({
  clientes,
  filtro,
  orden,
  referencia = new Date(),
}: Parametros): ClienteProcesado[] =>
  clientes
    .map(
      (cliente): ClienteProcesado => ({
        ...cliente,
        diasTranscurridos: cliente.fechaUltimaCita
          ? diasTranscurridos(cliente.fechaUltimaCita, referencia)
          : SIN_REGISTRO,
        estadoCliente: cliente.totalCitas >= CITAS_FRECUENTE ? "ACTIVO" : "INACTIVO",
      }),
    )
    .filter((c) => {
      if (filtro === "ACTIVOS") return c.estadoCliente === "ACTIVO";
      if (filtro === "INACTIVOS") return c.estadoCliente === "INACTIVO";
      return true;
    })
    .sort(COMPARADORES[orden]);
