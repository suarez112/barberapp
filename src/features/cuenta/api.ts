import { request } from "../../services/api/http";
import { DiaHorario } from "../../types";
import { FotoElegida, formularioFoto } from "../../utils/imagenes";

export type { FotoElegida };

// Cuentas de empresa (administradores) y de clientes: /api/v1/cuentas y /api/v1/admin.
// Su token no sirve en los endpoints del personal (/auth, /citas) ni al revés.

export type RolCuenta = "admin" | "cliente";

export type UsuarioCuenta = {
  id: string;
  correo: string;
  // Usuario de inicio de sesión de la administradora; null en clientes
  usuario: string | null;
  rol: RolCuenta;
  empresaId: string | null;
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
  estadoSuscripcion: string;
  trialEndsAt: string | null;
  creadaEn: string;
};

export type EstadoPrueba = {
  estadoSuscripcion: string;
  trialEndsAt: string | null;
  diasRestantes: number | null; // null si la empresa no está en prueba
  pruebaVencida: boolean;
};

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

export const registrarEmpresa = (datos: DatosEmpresa & AccesoAdministradora) =>
  request<RespuestaRegistroEmpresa>("/api/v1/cuentas/registro/empresa", {
    method: "POST",
    body: datos,
  });

export const loginCuenta = (correo: string, clave: string) =>
  request<RespuestaLoginCuenta>("/api/v1/cuentas/login", {
    method: "POST",
    body: { correo, clave },
  });

// Responde aunque la prueba haya vencido
export const obtenerEstadoPrueba = (token: string, signal?: AbortSignal) =>
  request<EstadoPrueba>("/api/v1/admin/empresa/prueba", { token, signal });

export const obtenerMiEmpresa = (token: string, signal?: AbortSignal) =>
  request<PerfilEmpresa>("/api/v1/admin/empresa", { token, signal });

export const actualizarMiEmpresa = (
  token: string,
  cambios: Partial<DatosEmpresa>,
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
