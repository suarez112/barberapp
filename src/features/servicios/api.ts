import { request } from "../../services/api/http";
import { Servicio } from "../../types";

export type DatosServicio = { nombre: string; duracionMin: number; precio: number };

const ruta = (id: string) => `/api/v1/servicios/${encodeURIComponent(id)}`;

export const crearServicio = (token: string, datos: DatosServicio) =>
  request<Servicio>("/api/v1/servicios", { method: "POST", body: datos, token });

export const actualizarServicio = (token: string, id: string, datos: Partial<DatosServicio>) =>
  request<Servicio>(ruta(id), { method: "PATCH", body: datos, token });

export const eliminarServicio = (token: string, id: string) =>
  request<{ mensaje: string }>(ruta(id), { method: "DELETE", token });
