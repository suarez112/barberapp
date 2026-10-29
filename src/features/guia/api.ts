import { request } from "../../services/api/http";

// Guía inicial del negocio (solo administradores; responde aunque la suscripción esté vencida)
export type PasoGuia = {
  id: "servicio" | "horario" | "enlace";
  titulo: string;
  completado: boolean;
};

export type Guia = {
  pasos: PasoGuia[];
  completados: number;
  total: number;
  completa: boolean;
  oculta: boolean;
  enlacePublico: string;
};

const RUTA = "/api/v1/admin/empresa/guia";

export const obtenerGuia = (token: string, signal?: AbortSignal) =>
  request<Guia>(RUTA, { token, signal });

// Se llama al tocar Compartir o Copiar el enlace
export const marcarEnlaceCompartido = (token: string) =>
  request<Guia>(`${RUTA}/enlace-compartido`, { method: "POST", token });

export const ocultarGuia = (token: string) => request<Guia>(`${RUTA}/ocultar`, { method: "POST", token });

export const mostrarGuia = (token: string) => request<Guia>(`${RUTA}/mostrar`, { method: "POST", token });
