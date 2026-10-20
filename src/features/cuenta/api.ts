import { request } from "../../services/api/http";
import { DiaHorario } from "../../types";
import { FotoElegida, formularioFoto } from "../../utils/imagenes";
import { Aceptacion } from "../legal/api";

export type { FotoElegida };

// Cuentas de empresa (administradores) y de clientes: /api/v1/cuentas y /api/v1/admin.
// Su token no sirve en los endpoints del personal (/auth, /citas) ni al revés.

export type RolCuenta = "admin" | "cliente";

export type UsuarioCuenta = {
  id: string;
  // Las administradoras siempre tienen correo; un cliente tiene correo, usuario o los dos
  correo: string | null;
  usuario: string | null;
  rol: RolCuenta;
  empresaId: string | null;
  // Datos del cliente que se usan al reservar (null en administradoras)
  nombre?: string | null;
  telefono?: string | null;
  indicativo?: string | null;
  // Cliente: se publicó una versión nueva de la política o los términos y debe
  // aceptarla en su próxima reserva
  debeAceptarDocumentos?: boolean;
};

// Horario de un día como lo recibe el backend: cerrado sin horas
export type DiaHorarioEnvio =
  | { dia: number; abierto: false }
  | { dia: number; abierto: true; apertura: string; cierre: string };

// Campos que se escriben en el registro y en "Mi negocio"
export type DatosEmpresa = {
  nombre: string;
  categoria: string;
  // Código que usan los clientes: letras y números, máximo 10 (se guarda en mayúsculas)
  codigoAcceso: string;
  direccion: string;
  departamento: string; // nombre oficial DIVIPOLA, ej. "SANTANDER"
  ciudad: string; // municipio de ese departamento, ej. "BUCARAMANGA"
  horario: DiaHorarioEnvio[]; // los 7 días, 0 = domingo … 6 = sábado
  nombreAdministradora: string;
  numeroEmpleados: number; // 1 a 10
};

// Acceso de la administradora: solo en el registro
export type AccesoAdministradora = {
  correo: string;
  usuario: string;
  clave: string;
};

export type PerfilEmpresa = Omit<DatosEmpresa, "departamento" | "horario"> & {
  id: string;
  // null en negocios registrados antes de la versión con departamento
  departamento: string | null;
  horario: DiaHorario[];
  diasAtencion: number[];
  horarioApertura: string;
  horarioCierre: string;
  logoUrl: string | null;
  fotoUrl: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
  // Ubicación en el mapa (opcional; siempre juntas)
  latitud: number | null;
  longitud: number | null;
  // Precisión del GPS en metros cuando se guardó (null si se ubicó a mano)
  precisionUbicacion: number | null;
  // Enlace de Google Maps (coordenadas o dirección); null si no hay datos
  googleMapsUrl: string | null;
  estadoSuscripcion: string;
  trialEndsAt: string | null;
  creadaEn: string;
};

export type EstadoSuscripcion = "prueba" | "activa" | "vencida";
export type PlanSuscripcion = "mensual" | "anual";

// Suscripción calculada con la fecha de Colombia (GET /admin/empresa/suscripcion)
export type Suscripcion = {
  estado: EstadoSuscripcion;
  plan: PlanSuscripcion | null; // null en la prueba
  fechaPago: string | null; // "2026-10-19"; null en la prueba
  // Día en que termina la prueba o el plan. null en empresas activas de antes de los planes
  fechaFin: string | null;
  diasRestantes: number | null; // 0 si está vencida
  // Días de prueba que quedaban al activar el plan durante la prueba (se sumaron al plan)
  diasPruebaSumados: number | null;
  // true siempre en la prueba y en los últimos 7 días de un plan
  mostrarRecordatorio: boolean;
  mensaje: string | null;
  // Plan por tamaño de equipo (también en la prueba). "plan" es el periodo
  planEquipo: { id: IdPlanEquipo; nombre: string; cupo: number };
  cupoUsado: number; // integrantes activos en Equipo
  cupoDisponible: number; // cuántos más se pueden agregar
  fechaRegistro: string | null; // "2026-10-05", día en que se registró el negocio
};

export type IdPlanEquipo = "basico" | "equipo" | "pro";

export type RespuestaRegistroEmpresa = {
  mensaje: string;
  token: string;
  usuario: UsuarioCuenta;
  empresa: {
    id: string;
    nombre: string;
    codigoAcceso: string;
    estadoSuscripcion: string;
    trialEndsAt: string;
    diasPruebaRestantes: number;
  };
};

export type RespuestaLoginCuenta = {
  mensaje: string;
  token: string;
  usuario: UsuarioCuenta;
};

export const registrarEmpresa = (datos: DatosEmpresa & AccesoAdministradora & Aceptacion) =>
  request<RespuestaRegistroEmpresa>("/api/v1/cuentas/registro/empresa", {
    method: "POST",
    body: datos,
  });

// Cuenta opcional de cliente: correo o usuario (al menos uno) para iniciar sesión
export type DatosCliente = {
  nombre: string;
  telefono: string;
  indicativo: string;
  correo?: string;
  usuario?: string;
  clave: string;
};

export const registrarCliente = (datos: DatosCliente & Aceptacion) =>
  request<RespuestaLoginCuenta>("/api/v1/cuentas/registro/cliente", {
    method: "POST",
    body: datos,
  });

// Responde aunque la suscripción haya vencido
export const obtenerSuscripcion = (token: string, signal?: AbortSignal) =>
  request<Suscripcion>("/api/v1/admin/empresa/suscripcion", { token, signal });

export const obtenerMiEmpresa = (token: string, signal?: AbortSignal) =>
  request<PerfilEmpresa>("/api/v1/admin/empresa", { token, signal });

// Coordenadas del negocio: van siempre juntas (null en las dos las quita)
// precisionUbicacion (metros) solo va con coordenadas leídas del GPS
export type Coordenadas = {
  latitud: number | null;
  longitud: number | null;
  precisionUbicacion?: number | null;
};

export const actualizarMiEmpresa = (
  token: string,
  cambios: Partial<DatosEmpresa> | Coordenadas,
) =>
  request<PerfilEmpresa>("/api/v1/admin/empresa", {
    method: "PATCH",
    body: cambios,
    token,
  });

// La foto viaja como multipart/form-data en el campo "foto"
export const subirFotoEmpresa = (token: string, foto: FotoElegida) =>
  request<{ mensaje: string; fotoUrl: string }>("/api/v1/admin/empresa/foto", {
    method: "PUT",
    body: formularioFoto(foto),
    token,
  });

// ¿Algún negocio usa ya ese código? (también responde false con el código propio)
export const consultarCodigoDisponible = (codigo: string) =>
  request<{ codigo: string; disponible: boolean }>(
    `/api/v1/empresas/codigo-disponible/${encodeURIComponent(codigo)}`,
  );

export type Departamento = {
  codigo: string;
  nombre: string;
  municipios: { codigo: string; nombre: string }[];
};

// Departamentos de Colombia con sus municipios (lista oficial DIVIPOLA)
export const listarUbicaciones = () => request<Departamento[]>("/api/v1/ubicaciones");
