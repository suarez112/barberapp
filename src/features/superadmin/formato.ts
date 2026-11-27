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

// A missing value (null/undefined/NaN, e.g. an average with an empty database) shows "—" instead of crashing.
const esNumero = (n: number | null | undefined): n is number => typeof n === "number" && !Number.isNaN(n);
export const formatearNumero = (n: number | null | undefined) => (esNumero(n) ? n.toLocaleString("es-CO") : "—");
export const formatearPesos = (n: number | null | undefined) => (esNumero(n) ? `$${n.toLocaleString("es-CO")}` : "—");

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

// Todas las acciones que el backend puede registrar en la actividad del superadmin
// (superadmin.servicio, categorias.servicio, pagos.servicio y los comandos de desarrollador "cmd_*").
export const ACCIONES: Record<string, string> = {
  inicio_sesion: "Inicio de sesión",
  cerrar_sesion: "Cierre de sesión",
  activar_plan: "Activar plan",
  extender_prueba: "Extender prueba",
  suspender: "Suspender negocio",
  reactivar: "Reactivar negocio",
  responder_pqrs: "Responder PQRS",
  pago_aprobado: "Pago aprobado",
  crear_categoria: "Crear categoría",
  editar_categoria: "Editar categoría",
};

// Acciones de los comandos de desarrollador (el backend las guarda como "cmd_<accion>")
const ACCIONES_COMANDO: Record<string, string> = {
  cmd_activar_plan: "Comando: activar plan",
  cmd_pagar_cargos: "Comando: pagar cargos",
  cmd_cifrar_contrasenas: "Comando: cifrar contraseñas",
  cmd_recifrar_2fa: "Comando: recifrar claves 2FA",
  cmd_crear_superadmin: "Comando: crear superadmin",
  cmd_reiniciar_superadmin: "Comando: reiniciar superadmin",
  cmd_restablecer_superadmin: "Comando: restablecer superadmin",
  cmd_eliminar_superadmin: "Comando: eliminar superadmin",
  cmd_optimizar_fotos: "Comando: optimizar fotos",
  cmd_simular_vencimiento: "Comando: simular vencimiento",
};

// Nombre legible de una acción. Una desconocida (o vacía) nunca muestra "undefined".
export const nombreAccion = (accion: AccionActividad | null | undefined) => {
  if (!accion) return "Acción desconocida";
  if (Object.hasOwn(ACCIONES, accion)) return ACCIONES[accion];
  if (Object.hasOwn(ACCIONES_COMANDO, accion)) return ACCIONES_COMANDO[accion];
  return accion.startsWith("cmd_") ? "Comando del sistema" : "Acción desconocida";
};

// Las acciones de comandos no se filtran desde el panel
export const FILTROS_ACCION: { id: AccionActividad | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  ...Object.keys(ACCIONES).map((id) => ({ id, label: ACCIONES[id] })),
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
      return detalle.dias == null
        ? ""
        : `${String(detalle.dias)} día(s): hasta ${formatearFecha(String(detalle.finNuevo ?? ""))}`;
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
