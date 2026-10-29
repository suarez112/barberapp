import { request } from "../../services/api/http";
import { Barbero } from "../../types";
import { UsuarioCuenta } from "../cuenta/api";

export type BarberoLogin = Barbero & { empresaCodigo: string };

// Login único: la administradora, el personal o un cliente con cuenta entran
// con su correo o usuario.
// El backend responde con el tipo de sesión que corresponde.
export type RespuestaLoginUnico =
  | { tipo: "admin"; mensaje: string; token: string; usuario: UsuarioCuenta }
  | {
      tipo: "cliente";
      mensaje: string;
      token: string;
      usuario: UsuarioCuenta;
      debeAceptarDocumentos: boolean;
    }
  | { tipo: "personal"; mensaje: string; token: string; barbero: BarberoLogin };

export const loginUnico = (usuario: string, clave: string) =>
  request<RespuestaLoginUnico>("/api/v1/login", {
    method: "POST",
    body: { usuario, clave },
  });

// Recuperar la contraseña (administradoras y clientes con correo). El personal
// sin correo se la pide a su administrador.
// Responde el mismo mensaje exista o no la cuenta.
export const solicitarRecuperacion = (correo: string) =>
  request<{ mensaje: string }>("/api/v1/cuentas/solicitar-recuperacion", {
    method: "POST",
    body: { correo },
  });

// Cambia la contraseña con el código de 6 dígitos y cierra las sesiones abiertas
export const restablecerContrasena = (datos: { correo: string; codigo: string; clave: string }) =>
  request<{ mensaje: string }>("/api/v1/cuentas/restablecer-contrasena", {
    method: "POST",
    body: datos,
  });
