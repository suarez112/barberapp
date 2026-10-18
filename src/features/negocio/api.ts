import { request } from "../../services/api/http";
import { Barbero, Empresa, Servicio } from "../../types";

export type DatosNegocio = {
  empresa: Empresa;
  barberos: Barbero[];
  servicios: Servicio[];
};

// Vista pública (clientes): no incluye los usuarios de inicio de sesión
export const validarCodigoEmpresa = (codigo: string) =>
  request<DatosNegocio>(
    `/api/v1/empresas/validar/${encodeURIComponent(codigo)}`,
  );

// Negocio de la sesión iniciada, con los usuarios del equipo
export const obtenerNegocioActual = (token: string) =>
  request<DatosNegocio>("/api/v1/empresas/actual", { token });
