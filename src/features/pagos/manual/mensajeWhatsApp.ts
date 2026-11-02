import { APP_NOMBRE } from "@/config/app";
import { formatearPesos } from "@/utils/formato";
import { OrdenManual } from "../api";

// Mensaje ya escrito para enviar el comprobante por WhatsApp
export const mensajeComprobante = (orden: OrdenManual) => {
  const profesionales = `${orden.profesionales} ${orden.profesionales === 1 ? "profesional" : "profesionales"}`;
  return (
    `Hola, envío el comprobante de pago de mi suscripción a ${APP_NOMBRE}. ` +
    `Negocio: ${orden.negocio?.nombre ?? "—"}. ` +
    `Plan: ${orden.plan.nombre} (${profesionales}). ` +
    `Periodo: ${orden.periodo}. ` +
    `Monto: $${formatearPesos(orden.monto)}.`
  );
};

// whatsappUrl del servidor + el texto codificado para el enlace
export const enlaceComprobante = (whatsappUrl: string, orden: OrdenManual) =>
  `${whatsappUrl}${whatsappUrl.includes("?") ? "&" : "?"}text=${encodeURIComponent(mensajeComprobante(orden))}`;
