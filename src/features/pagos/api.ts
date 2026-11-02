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

// ---- Pagos manuales (proveedor "manual"): Nequi, llave Bre-B y código QR ----

export type TipoQr = "nequi" | "breb";

export type FormaDePago =
  | { tipo: "nequi"; numero: string }
  | { tipo: "llave_breb"; llave: string }
  | { tipo: "qr"; imagenes: { tipo: TipoQr; url: string }[] };

// Datos para pagar: solo trae las formas activas
export type DatosDePago = {
  titular: string;
  whatsapp: string;
  whatsappUrl: string;
  formas: FormaDePago[];
};

export type OrdenManual = {
  referencia: string;
  proveedor: string;
  profesionales: number;
  plan: { id: string; nombre: string };
  periodo: PlanSuscripcion;
  monto: number;
  moneda: string;
  estado: EstadoOrden;
  estadoTexto: string;
  creadaEn: string;
  zonaHoraria: string;
  negocio?: { nombre: string; codigoAcceso: string };
  // Solo en las pendientes
  pago?: DatosDePago;
  // Solo en las ya revisadas
  motivoRevision?: string | null;
  revisadaEn?: string;
};

export const crearOrdenManual = (token: string, periodo: PlanSuscripcion) =>
  request<OrdenManual>("/api/v1/pagos/ordenes", { method: "POST", body: { periodo }, token });

export const listarMisOrdenes = (token: string, signal?: AbortSignal) =>
  request<OrdenManual[]>("/api/v1/pagos/ordenes", { token, signal });

export const obtenerOrdenManual = (token: string, referencia: string, signal?: AbortSignal) =>
  request<OrdenManual>(`/api/v1/pagos/ordenes/${encodeURIComponent(referencia)}`, { token, signal });

export const obtenerFormasDePago = (token: string, signal?: AbortSignal) =>
  request<DatosDePago>("/api/v1/pagos/formas-pago", { token, signal });

// Ruta (sin dominio) de la imagen de un QR; exige el token, ver useImagenProtegida
export const rutaQrPago = (tipo: TipoQr) => `/api/v1/pagos/formas-pago/qr/${tipo}`;
