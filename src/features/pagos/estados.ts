import { COLORES } from "@/theme/paleta";
import { EstadoOrden } from "./api";

// Texto y color de cada estado de una orden de pago (app y panel del superadmin)
export const ESTADOS_ORDEN: Record<EstadoOrden, { texto: string; color: string }> = {
  pendiente: { texto: "PENDIENTE DE VERIFICACIÓN", color: COLORES.azul },
  aprobada: { texto: "APROBADA", color: COLORES.verde },
  rechazada: { texto: "RECHAZADA", color: COLORES.rojo },
  anulada: { texto: "ANULADA", color: COLORES.neutro },
};

// Tipos de aviso que llegan al revisar un pago (campana y push)
export const TIPOS_AVISO_PAGO = ["pago_aprobado", "pago_rechazado"];

// Texto de "Mi suscripción" y de "Mi plan"
export const AVISO_DIAS_SE_SUMAN = "Si pagas antes de que termine tu periodo, los días que te quedan se suman.";
