import { request } from "../../services/api/http";
import { Barbero, Empresa, Servicio, DiaHorario } from "../../types";

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
export const obtenerNegocioActual = (token: string, signal?: AbortSignal) =>
  request<DatosNegocio>("/api/v1/empresas/actual", { token, signal });

// Información pública del negocio con su foto (sin datos de suscripción)
export type PerfilPublico = {
  id: string;
  nombre: string;
  codigoAcceso: string;
  categoria: string | null;
  direccion: string | null;
  departamento: string | null;
  ciudad: string | null;
  horario: DiaHorario[] | null;
  diasAtencion: number[] | null;
  horarioApertura: string | null;
  horarioCierre: string | null;
  logoUrl: string | null;
  fotoUrl: string | null;
};

export const obtenerPerfilPublico = (codigo: string) =>
  request<PerfilPublico>(
    `/api/v1/empresas/perfil/${encodeURIComponent(codigo)}`,
  );
