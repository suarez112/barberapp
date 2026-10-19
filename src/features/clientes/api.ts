import { request } from "../../services/api/http";
import { EstadoCita } from "../../types";

// Clientes del negocio (solo administrador). Token del personal admin o de la cuenta admin.

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  indicativo: string | null;
  totalCitas: number;
  fechaUltimaCita: string | null; // "2026-10-10"
  enListaNegra: boolean;
  listaNegraId: string | null;
};

export type CitaHistorial = {
  id: string;
  fecha: string;
  hora: string; // "03:30 PM"
  servicio: string;
  barberoId: string;
  barberoNombre: string;
  precio: number;
  estado: EstadoCita;
};

export type Bloqueado = {
  id: string;
  nombre: string;
  telefono: string;
  agregadoEn: string;
};

export const listarClientes = (token: string, signal?: AbortSignal) =>
  request<Cliente[]>("/api/v1/clientes", { token, signal });

export const obtenerHistorial = (token: string, clienteId: string) =>
  request<{ cliente: Cliente; citas: CitaHistorial[] }>(
    `/api/v1/clientes/${encodeURIComponent(clienteId)}/historial`,
    { token },
  );

export const listarListaNegra = (token: string, signal?: AbortSignal) =>
  request<Bloqueado[]>("/api/v1/clientes/lista-negra", { token, signal });

export const agregarAListaNegra = (token: string, clienteId: string) =>
  request<Bloqueado & { mensaje: string }>("/api/v1/clientes/lista-negra", {
    method: "POST",
    body: { clienteId },
    token,
  });

// id = id de la lista negra (o listaNegraId del cliente)
export const quitarDeListaNegra = (token: string, id: string) =>
  request<{ mensaje: string }>(
    `/api/v1/clientes/lista-negra/${encodeURIComponent(id)}`,
    { method: "DELETE", token },
  );
