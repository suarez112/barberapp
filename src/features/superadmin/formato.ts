import { COLORES } from "../../theme/paleta";
import { AccionActividad, EstadoNegocio, EstadoPqrs, FiltroEstado } from "./api";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-10-20" -> "20 oct 2026". Una fecha sin hora se lee tal cual (sin pasar por Date,
// que la correría un día por la zona horaria); una con hora se muestra en hora de Colombia.
export const formatearFecha = (valor: string | null | undefined, conHora = false) => {
  if (!valor) return "—";
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) return `${Number(soloFecha[3])} ${MESES[Number(soloFecha[2]) - 1]} ${soloFecha[1]}`;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  const dia = fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  });
  if (!conHora) return dia;
  const hora = fecha.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  return `${dia}, ${hora}`;
};

// "2026-09" -> "sep 26"
export const formatearMes = (mes: string) => {
  const [anio, numero] = mes.split("-");
  return `${MESES[Number(numero) - 1] ?? mes} ${anio?.slice(2) ?? ""}`.trim();
};

// "2026-09-21" -> "21 sep"
export const formatearDiaMes = (dia: string) => {
  const [, mes, numero] = dia.split("-");
  return `${Number(numero)} ${MESES[Number(mes) - 1] ?? ""}`.trim();
};

export const formatearNumero = (n: number) => n.toLocaleString("es-CO");
export const formatearPesos = (n: number) => `$${n.toLocaleString("es-CO")}`;

export const ESTADOS_NEGOCIO: Record<EstadoNegocio, { texto: string; color: string }> = {
  prueba: { texto: "EN PRUEBA", color: COLORES.azul },
  activo: { texto: "ACTIVO", color: COLORES.verde },
  vencido: { texto: "VENCIDO", color: COLORES.rojo },
  suspendido: { texto: "SUSPENDIDO", color: COLORES.neutro },
};

export const FILTROS_ESTADO: { id: FiltroEstado | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "prueba", label: "En prueba" },
  { id: "activo", label: "Activos" },
  { id: "por_vencer", label: "Por vencer" },
  { id: "vencido", label: "Vencidos" },
  { id: "suspendido", label: "Suspendidos" },
];

export const ESTADOS_PQRS: Record<EstadoPqrs, { texto: string; color: string }> = {
  recibida: { texto: "RECIBIDA", color: COLORES.azul },
  en_proceso: { texto: "EN PROCESO", color: COLORES.naranja },
  resuelta: { texto: "RESUELTA", color: COLORES.verde },
  cerrada: { texto: "CERRADA", color: COLORES.neutro },
};

export const FILTROS_PQRS: { id: EstadoPqrs | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "recibida", label: "Recibidas" },
  { id: "en_proceso", label: "En proceso" },
  { id: "resuelta", label: "Resueltas" },
  { id: "cerrada", label: "Cerradas" },
];

export const ACCIONES: Record<AccionActividad, string> = {
  inicio_sesion: "Inicio de sesión",
  activar_plan: "Activar plan",
  extender_prueba: "Extender prueba",
  suspender: "Suspender negocio",
  reactivar: "Reactivar negocio",
  responder_pqrs: "Responder PQRS",
};

export const FILTROS_ACCION: { id: AccionActividad | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  ...(Object.keys(ACCIONES) as AccionActividad[]).map((id) => ({ id, label: ACCIONES[id] })),
];

export const TIPOS_PQRS: Record<string, string> = {
  peticion: "Petición",
  queja: "Queja",
  reclamo: "Reclamo",
  sugerencia: "Sugerencia",
};

// Resumen corto del campo `detalle` de una acción (ej. "Días: 7")
export const resumirDetalle = (accion: AccionActividad, detalle: Record<string, unknown> | null) => {
  if (!detalle) return "";
  switch (accion) {
    case "inicio_sesion":
      return detalle.ip ? `IP ${String(detalle.ip)}` : "";
    case "extender_prueba":
      return `${String(detalle.dias)} día(s): hasta ${formatearFecha(String(detalle.finNuevo ?? ""))}`;
    case "activar_plan": {
      const despues = detalle.despues as { planEquipo?: string; plan?: string } | undefined;
      return [despues?.plan, despues?.planEquipo].filter(Boolean).join(" · ");
    }
    case "responder_pqrs":
      return `Estado: ${String(detalle.estadoNuevo ?? "")}`;
    default:
      return "";
  }
};
