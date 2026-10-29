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

// Al volver del pago: el backend le pregunta a la pasarela y activa el plan si aprobó
export const confirmarOrden = (token: string, referencia: string, idTransaccion?: string) =>
  request<OrdenPago & { activada: boolean }>(`/api/v1/pagos/ordenes/${encodeURIComponent(referencia)}/confirmar`, {
    method: "POST",
    body: idTransaccion ? { idTransaccion } : {},
    token,
  });

// Pago de prueba: la pasarela simulada o una llave de prueba de Wompi (pub_test_…)
export const esModoPrueba = (orden: Pick<OrdenCreada, "proveedor"> & { urlPago?: string }) =>
  orden.proveedor === "simulado" || (orden.urlPago ?? "").includes("pub_test_");
