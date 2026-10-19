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
