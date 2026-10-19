import { request } from "../../services/api/http";
import { Barbero } from "../../types";
import { FotoElegida, formularioFoto } from "../../utils/imagenes";

// Forma que devuelve /api/v1/equipo
type Profesional = {
  id: string;
  nombre: string;
  usuario: string;
  esAdmin: boolean;
  especialidad: string | null;
  porcentajeGanancia: number;
  foto: string | null;
};

export type DatosProfesional = {
  nombre: string;
  usuario: string;
  clave?: string; // obligatoria al crear; al editar, solo si se cambia
  esAdmin?: boolean;
  especialidad: string | null;
  porcentajeGanancia: number;
};

const aBarbero = (p: Profesional): Barbero => ({
  ...p,
  especialidad: p.especialidad ?? "",
  foto: p.foto ?? undefined,
});

const ruta = (id: string) => `/api/v1/equipo/${encodeURIComponent(id)}`;

export const crearProfesional = async (token: string, datos: DatosProfesional) =>
  aBarbero(
    await request<Profesional>("/api/v1/equipo", { method: "POST", body: datos, token }),
  );

export const actualizarProfesional = async (
  token: string,
  id: string,
  datos: Partial<DatosProfesional>,
) => aBarbero(await request<Profesional>(ruta(id), { method: "PATCH", body: datos, token }));

export const eliminarProfesional = (token: string, id: string) =>
  request<{ mensaje: string }>(ruta(id), { method: "DELETE", token });

export const subirFotoProfesional = (token: string, id: string, foto: FotoElegida) =>
  request<{ mensaje: string; foto: string }>(`${ruta(id)}/foto`, {
    method: "PUT",
    body: formularioFoto(foto),
    token,
  });
