import { request } from "../../services/api/http";
import { IdPlanEquipo } from "../cuenta/api";

// Plan por tamaño de equipo, con sus precios en pesos (GET /api/v1/planes, público)
export type PlanEquipo = {
  id: IdPlanEquipo;
  nombre: string;
  cupo: number; // máximo de integrantes activos en Equipo
  precioMensual: number;
  precioAnual: number;
  moneda: string;
};

export const obtenerPlanes = (signal?: AbortSignal) =>
  request<PlanEquipo[]>("/api/v1/planes", { signal });

// Una función de la app y desde qué plan se puede usar (GET /api/v1/funciones)
export type FuncionPlan = {
  id: string;
  nombre: string;
  incluida: boolean;
  // Plan más pequeño que la incluye
  planRequerido?: { id: IdPlanEquipo; nombre: string };
};

export type RespuestaFunciones = {
  plan: { id: IdPlanEquipo; nombre: string; cupo: number };
  enPrueba: boolean;
  funciones: FuncionPlan[];
};

// Sirve con cualquier sesión del personal o de la administradora, aunque la suscripción esté vencida
export const obtenerFunciones = (token: string, signal?: AbortSignal) =>
  request<RespuestaFunciones>("/api/v1/funciones", { token, signal });
