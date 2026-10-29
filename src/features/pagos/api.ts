import { request } from "../../services/api/http";
import { PlanSuscripcion } from "../cuenta/api";

export type EstadoOrden = "pendiente" | "aprobada" | "rechazada" | "anulada";

// Orden de pago de la suscripción (POST/GET /api/v1/pagos/ordenes)
export type OrdenPago = {
  referencia: string;
  proveedor: string;
  profesionales: number;
  periodo: PlanSuscripcion;
  monto: number;
  moneda: string;
  estado: EstadoOrden;
};

export type OrdenCreada = OrdenPago & { urlPago: string };

export const crearOrden = (token: string, datos: { profesionales: number; periodo: PlanSuscripcion }) =>
  request<OrdenCreada>("/api/v1/pagos/ordenes", { method: "POST", body: datos, token });

// Resultado público de un pago (sin sesión): GET /api/v1/pagos/ordenes/:referencia/estado?id=
export type ResultadoPago = {
  estado: "aprobado" | "pendiente" | "rechazado";
  nivel?: { id: string; nombre: string };
  vencimiento?: string;
};

export const consultarEstadoPago = (referencia: string, idTransaccion?: string, signal?: AbortSignal) =>
  request<ResultadoPago>(
    `/api/v1/pagos/ordenes/${encodeURIComponent(referencia)}/estado${idTransaccion ? `?id=${encodeURIComponent(idTransaccion)}` : ""}`,
    { signal },
  );

// Si la pasarela está en modo de prueba: GET /api/v1/pagos/configuracion (público)
export type ConfiguracionPagos = { disponible: boolean; proveedor: string; esDePrueba: boolean };

export const obtenerConfiguracionPagos = (signal?: AbortSignal) =>
  request<ConfiguracionPagos>("/api/v1/pagos/configuracion", { signal });
