import { request } from "../../services/api/http";

const BASE = "/api/v1/superadmin";

export type EstadoNegocio = "prueba" | "activo" | "vencido" | "suspendido";
// "por_vencer" solo existe como filtro de la lista
export type FiltroEstado = EstadoNegocio | "por_vencer";
export type PlanEquipoId = "emprendedor" | "equipo" | "pro";
export type Periodo = "mensual" | "anual";

export type Pagina<T> = { total: number; pagina: number; limite: number; datos: T[] };

export type SesionSuperadmin = {
  token: string;
  expiraEnSegundos: number;
  // Minutos sin actividad tras los que el servidor cierra la sesión
  inactividadMinutos?: number;
  superadmin: { id: string; correo: string };
};

export type ResumenPlataforma = {
  totalNegocios: number;
  enPrueba: number;
  activos: number;
  vencidos: number;
  suspendidos: number;
  nuevosEsteMes: number;
  porVencerEn7Dias: number;
  citasHoy: number;
};

export type NegocioPorVencer = {
  id: string;
  nombre: string;
  codigoAcceso: string;
  estado: EstadoNegocio;
  diasRestantes: number;
  fechaFin: string | null;
};

// Cifras agregadas para los gráficos del Inicio (nunca datos de clientes)
export type EstadisticasPlataforma = {
  negociosNuevosPorMes: { mes: string; total: number }[];
  negociosPorEstado: { estado: EstadoNegocio; total: number }[];
  negociosPorPlan: { plan: PlanEquipoId; nombre: string; total: number; activos: number }[];
  citasPorDia: { dia: string; total: number }[];
  topDepartamentos: { departamento: string; total: number }[];
  conversionPruebaAPlan: { pruebasTerminadas: number; convertidos: number; tasaPorcentaje: number | null };
  vencenEn7Dias: { total: number; negocios: NegocioPorVencer[] };
  ingresoMensualEstimado: {
    estimado: boolean;
    moneda: string;
    total: number;
    detalle: { plan: PlanEquipoId; periodo: Periodo; negocios: number; ingreso: number }[];
    nota: string;
  };
};

// GET /superadmin/ingresos: suma del precio del plan en cada activación. NO son pagos reales.
export type IngresosPlataforma = {
  estimado: boolean;
  moneda: string;
  total: number;
  activaciones: number;
  porMes: { mes: string; total: number; activaciones: number }[]; // últimos 12, el actual al final
  porAnio: { anio: number; total: number; activaciones: number }[];
  mejorMes: { mes: string; total: number; activaciones: number } | null;
  mejorAnio: { anio: number; total: number; activaciones: number } | null;
  nota: string;
};

export type NegocioResumen = {
  id: string;
  nombre: string;
  codigoAcceso: string;
  planEquipo: { id: string; nombre: string; cupo: number };
  plan: Periodo | null;
  estado: EstadoNegocio;
  diasRestantes: number | null;
  cupoUsado: number;
  municipio: string | null;
  departamento: string | null;
  fechaRegistro: string;
};

export type ActividadItem = {
  id: string;
  superadmin: string;
  accion: AccionActividad;
  negocio: { id: string; codigoAcceso: string; nombre: string } | null;
  referencia: string | null;
  detalle: Record<string, unknown> | null;
  motivo: string | null;
  fecha: string;
};

export type NegocioDetalle = NegocioResumen & {
  categoria: string | null;
  direccion: string | null;
  administradora: { nombre: string; correo: string | null };
  suscripcion: {
    estadoGuardado: string;
    fechaPago: string | null;
    fechaFin: string | null;
    finDePrueba: string | null;
    diasPruebaSumados: number;
  };
  suspension: { desde: string; motivo: string | null } | null;
  equipo: { activos: number; cupo: number; administradores: number; empleados: number };
  cifras: {
    clientes: number;
    servicios: number;
    productos: number;
    citas: {
      total: number;
      confirmadas: number;
      completadas: number;
      canceladas: number;
      esteMes: number;
      ultima: string | null;
    };
    ventas: { total: number; esteMes: number };
  };
  actividadReciente: ActividadItem[];
};

export type EstadoPqrs = "recibida" | "en_proceso" | "resuelta" | "cerrada";

export type PqrsAdmin = {
  radicado: string;
  tipo: string;
  estado: EstadoPqrs;
  mensaje: string;
  nombre: string;
  contacto: string;
  conCuenta: boolean;
  respuesta: string | null;
  respondidaEn: string | null;
  creadaEn: string;
  actualizadaEn: string;
};

export type AccionActividad =
  | "inicio_sesion"
  | "activar_plan"
  | "extender_prueba"
  | "suspender"
  | "reactivar"
  | "responder_pqrs";

// Arma "?a=1&b=2" sin los valores vacíos
const consulta = (params: Record<string, string | number | undefined>) => {
  const partes = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return partes.length ? `?${partes.join("&")}` : "";
};

export const iniciarSesionSuperadmin = (correo: string, clave: string, codigo: string) =>
  request<SesionSuperadmin>(`${BASE}/login`, { method: "POST", body: { correo, clave, codigo } });

export const obtenerResumen = (token: string, signal?: AbortSignal) =>
  request<ResumenPlataforma>(`${BASE}/resumen`, { token, signal });

export const obtenerEstadisticas = (token: string, signal?: AbortSignal) =>
  request<EstadisticasPlataforma>(`${BASE}/estadisticas`, { token, signal });

export const obtenerIngresos = (token: string, signal?: AbortSignal) =>
  request<IngresosPlataforma>(`${BASE}/ingresos`, { token, signal });

// Cierra la sesión también en el servidor: el token deja de servir
export const cerrarSesionSuperadmin = (token: string) =>
  request<{ mensaje: string }>(`${BASE}/logout`, { method: "POST", token, tiempoLimiteMs: 5000 });

export const listarNegocios = (
  token: string,
  filtros: { buscar?: string; estado?: FiltroEstado | ""; pagina: number; limite: number },
  signal?: AbortSignal,
) => request<Pagina<NegocioResumen>>(`${BASE}/negocios${consulta(filtros)}`, { token, signal });

export const obtenerNegocio = (token: string, id: string, signal?: AbortSignal) =>
  request<NegocioDetalle>(`${BASE}/negocios/${encodeURIComponent(id)}`, { token, signal });

type RespuestaAccion = { mensaje: string; negocio: NegocioResumen };

const accion = (token: string, id: string, ruta: string, body: object) =>
  request<RespuestaAccion>(`${BASE}/negocios/${encodeURIComponent(id)}/${ruta}`, {
    method: "POST",
    body,
    token,
  });

export const activarPlan = (
  token: string,
  id: string,
  datos: { periodo: Periodo; planEquipo?: PlanEquipoId; motivo?: string },
) => accion(token, id, "plan", datos);

export const extenderPrueba = (token: string, id: string, datos: { dias: number; motivo?: string }) =>
  accion(token, id, "extender-prueba", datos);

export const suspenderNegocio = (token: string, id: string, motivo: string) =>
  accion(token, id, "suspender", { motivo });

export const reactivarNegocio = (token: string, id: string, motivo: string) =>
  accion(token, id, "reactivar", { motivo });

export const listarPqrs = (
  token: string,
  filtros: { estado?: EstadoPqrs | ""; tipo?: string; pagina: number; limite: number },
  signal?: AbortSignal,
) => request<Pagina<PqrsAdmin>>(`${BASE}/pqrs${consulta(filtros)}`, { token, signal });

export const obtenerPqrs = (token: string, radicado: string, signal?: AbortSignal) =>
  request<PqrsAdmin>(`${BASE}/pqrs/${encodeURIComponent(radicado)}`, { token, signal });

export const responderPqrs = (
  token: string,
  radicado: string,
  datos: { estado: EstadoPqrs; respuesta?: string },
) =>
  request<{ mensaje: string; pqrs: PqrsAdmin }>(`${BASE}/pqrs/${encodeURIComponent(radicado)}`, {
    method: "PATCH",
    body: datos,
    token,
  });

export const listarActividad = (
  token: string,
  filtros: { accion?: AccionActividad | ""; desde?: string; hasta?: string; pagina: number; limite: number },
  signal?: AbortSignal,
) => request<Pagina<ActividadItem>>(`${BASE}/actividad${consulta(filtros)}`, { token, signal });

export type CategoriaAdmin = { id: string; nombre: string; activa: boolean };

export const listarCategoriasAdmin = (token: string, signal?: AbortSignal) =>
  request<CategoriaAdmin[]>(`${BASE}/categorias`, { token, signal });

export const crearCategoria = (token: string, nombre: string) =>
  request<{ mensaje: string; categoria: CategoriaAdmin }>(`${BASE}/categorias`, {
    method: "POST",
    body: { nombre },
    token,
  });

// Las categorías no se borran: se desactivan con activa = false
export const editarCategoria = (
  token: string,
  id: string,
  cambios: { nombre?: string; activa?: boolean },
) =>
  request<{ mensaje: string; categoria: CategoriaAdmin }>(
    `${BASE}/categorias/${encodeURIComponent(id)}`,
    { method: "PATCH", body: cambios, token },
  );
