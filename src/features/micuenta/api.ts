import { request } from "../../services/api/http";
import { EstadoCita } from "../../types";

// Cuenta del cliente: negocios guardados y citas reservadas con su sesión.
// Solo sirve el token de una cuenta de cliente.

export type NegocioGuardado = {
  id: string;
  nombre: string;
  codigoAcceso: string;
  categoria: string | null;
  direccion: string | null;
  departamento: string | null;
  ciudad: string | null;
  logoUrl: string | null;
  fotoUrl: string | null;
  // false si la suscripción del negocio venció
  recibiendoReservas: boolean;
  guardadoEn: string;
};

export type CitaCliente = {
  id: string;
  empresaId: string;
  negocio: string;
  codigoAcceso: string;
  servicio: string;
  barberoId: string;
  barberoNombre: string;
  fecha: string; // "2026-10-21"
  hora: string; // "10:00 AM"
  duracionMin: number;
  precio: number;
  estado: EstadoCita;
};

export const listarNegociosGuardados = (token: string, signal?: AbortSignal) =>
  request<NegocioGuardado[]>("/api/v1/mi-cuenta/negocios", { token, signal });

// Si ya estaba guardado responde igual
export const guardarNegocio = (token: string, codigo: string) =>
  request<{ mensaje: string; negocio: NegocioGuardado }>("/api/v1/mi-cuenta/negocios", {
    method: "POST",
    body: { codigo },
    token,
  });

export const quitarNegocio = (token: string, id: string) =>
  request<{ mensaje: string }>(`/api/v1/mi-cuenta/negocios/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });

// De la más reciente a la más antigua; las reservas como invitado no aparecen
export const listarMisCitas = (token: string, signal?: AbortSignal) =>
  request<CitaCliente[]>("/api/v1/mi-cuenta/citas", { token, signal });
