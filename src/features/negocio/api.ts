import { request } from "../../services/api/http";
import { Barbero, Empresa, Servicio } from "../../types";

export type DatosNegocio = {
  empresa: Empresa;
  barberos: Barbero[];
  servicios: Servicio[];
};

export const validarCodigoEmpresa = (codigo: string) =>
  request<DatosNegocio>(
    `/api/v1/empresas/validar/${encodeURIComponent(codigo)}`,
  );
