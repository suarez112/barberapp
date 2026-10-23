import { request } from "../../services/api/http";

export type TipoPqrs = "peticion" | "queja" | "reclamo" | "sugerencia";
export type EstadoPqrs = "recibida" | "en_proceso" | "resuelta" | "cerrada";

export type Pqrs = {
  radicado: string;
  tipo: TipoPqrs;
  mensaje: string;
  estado: EstadoPqrs;
  respuesta: string | null;
  respondidaEn: string | null;
  creadaEn: string;
  // Según el plan del negocio al radicar: 1 (Pro), 2 (Equipo) o 3 (Emprendedor)
  prioridad: number;
  planEquipo: string;
  diasHabiles: number;
  // Fecha estimada de respuesta, con zona horaria ("2026-10-27T23:59:59.000-05:00")
  fechaLimite: string;
};

export type DatosPqrs = {
  tipo: TipoPqrs;
  mensaje: string;
  // Solo se piden a un invitado; con sesión el backend usa los de la cuenta
  nombre?: string;
  contacto?: string;
};

// Sirve como invitado o con el token de una cuenta (administradora o cliente)
export const radicarPqrs = (datos: DatosPqrs, token?: string) =>
  request<{ mensaje: string; pqrs: Pqrs }>("/api/v1/pqrs", {
    method: "POST",
    body: datos,
    token: token || undefined,
  });

export const listarMisPqrs = (token: string, signal?: AbortSignal) =>
  request<Pqrs[]>("/api/v1/pqrs/mias", { token, signal });
