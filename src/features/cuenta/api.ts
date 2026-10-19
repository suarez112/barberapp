import { request } from "../../services/api/http";
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

// Campos que se escriben en el registro y en "Mi negocio"
export type DatosEmpresa = {
  nombre: string;
  categoria: string;
  nit: string | null;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  diasAtencion: number[]; // 0 = domingo … 6 = sábado
  horarioApertura: string; // "08:00"
  horarioCierre: string; // "19:00"
  nombreAdministradora: string;
  numeroEmpleados: number;
  logoUrl: string | null;
};

export type PerfilEmpresa = DatosEmpresa & {
  id: string;
  codigoAcceso: string;
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

export const registrarEmpresa = (datos: DatosEmpresa & { clave: string }) =>
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
export const obtenerEstadoPrueba = (token: string) =>
  request<EstadoPrueba>("/api/v1/admin/empresa/prueba", { token });

export const obtenerMiEmpresa = (token: string) =>
  request<PerfilEmpresa>("/api/v1/admin/empresa", { token });

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
