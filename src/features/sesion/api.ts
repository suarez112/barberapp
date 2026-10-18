import { request } from "../../services/api/http";
import { Barbero } from "../../types";

export type RespuestaLogin = {
  token: string;
  barbero: Barbero & { empresaCodigo: string };
};

export const loginBarbero = (usuario: string, clave: string) =>
  request<RespuestaLogin>("/api/v1/auth/login", {
    method: "POST",
    body: { usuario, clave },
  });
