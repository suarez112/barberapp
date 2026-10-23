import { request } from "../../services/api/http";
import { IdPlanEquipo } from "../cuenta/api";

// Un nivel (Emprendedor, Equipo, Pro) y cuántos profesionales cobrados abarca
export type NivelPlan = {
  id: IdPlanEquipo;
  nombre: string;
  profesionalesDesde: number;
  profesionalesHasta: number;
};

// Precio total del negocio con esa cantidad de profesionales
export type PrecioPlan = { profesionales: number; mensual: number; anual: number };

// Cobro por profesional (GET /api/v1/planes, público)
export type RespuestaPlanes = {
  moneda: string;
  precioPrimerProfesional: number;
  precioProfesionalAdicional: number;
  maximoProfesionales: number;
  maximoAdminsSinAtender: number;
  // 0.1 = 10 % menos pagando por año
  descuentoAnual: number;
  niveles: NivelPlan[];
  precios: PrecioPlan[];
};

export const obtenerPlanes = (signal?: AbortSignal) =>
  request<RespuestaPlanes>("/api/v1/planes", { signal });

// Una función de la app y desde qué nivel se puede usar (GET /api/v1/funciones)
export type FuncionPlan = {
  id: string;
  nombre: string;
  incluida: boolean;
  // Nivel más pequeño que la incluye
  planRequerido?: { id: IdPlanEquipo; nombre: string };
};

export type RespuestaFunciones = {
  plan: { id: IdPlanEquipo; nombre: string; cupo: number };
  nivel?: NivelPlan;
  enPrueba: boolean;
  profesionales?: {
    cobrados: number;
    maximo: number;
    adminsSinAtender: number;
    maximoAdminsSinAtender: number;
  };
  // Precio de hoy según los profesionales cobrados; los "siguiente" son null con el máximo
  precio?: {
    moneda: string;
    mensual: number;
    anual: number;
    siguienteProfesionalMensual: number | null;
    siguienteProfesionalAnual: number | null;
  };
  funciones: FuncionPlan[];
};

// Sirve con cualquier sesión del personal o de la administradora, aunque la suscripción esté vencida
export const obtenerFunciones = (token: string, signal?: AbortSignal) =>
  request<RespuestaFunciones>("/api/v1/funciones", { token, signal });
