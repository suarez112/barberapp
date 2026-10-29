import { request } from "../../services/api/http";
import { Barbero, RolEquipo } from "../../types";
import { FotoElegida, formularioFoto } from "../../utils/imagenes";

// Forma que devuelve /api/v1/equipo
type Profesional = {
  id: string;
  nombre: string;
  // null: el perfil de la administradora entra con su cuenta de siempre
  usuario: string | null;
  rol: RolEquipo;
  esAdmin: boolean;
  atiendeClientes: boolean;
  especialidad: string | null;
  porcentajeGanancia: number;
  foto: string | null;
};

export type DatosProfesional = {
  nombre: string;
  usuario: string;
  clave?: string; // obligatoria al crear; al editar, solo si se cambia
  // El plan Emprendedor no incluye roles ni comisiones: el backend rechazaría esos campos
  rol?: RolEquipo;
  atiendeClientes: boolean;
  especialidad: string | null;
  porcentajeGanancia?: number;
};

const aBarbero = (p: Profesional): Barbero => ({
  ...p,
  usuario: p.usuario ?? "",
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

// "Yo también atiendo clientes": solo la cuenta de la administradora (la de correo)
export type EstadoYoAtiendo = {
  atiendeClientes: boolean;
  // Su perfil como profesional (null si nunca lo activó)
  barberoId: string | null;
  perfil: Barbero | null;
};

type RespuestaYoAtiendo = Omit<EstadoYoAtiendo, "perfil"> & { perfil: Profesional | null; mensaje?: string };

const aEstado = (r: RespuestaYoAtiendo): EstadoYoAtiendo => ({
  atiendeClientes: r.atiendeClientes,
  barberoId: r.barberoId,
  perfil: r.perfil ? aBarbero(r.perfil) : null,
});

export const obtenerYoAtiendo = async (token: string, signal?: AbortSignal) =>
  aEstado(await request<RespuestaYoAtiendo>("/api/v1/equipo/yo-atiendo", { token, signal }));

export const cambiarYoAtiendo = async (token: string, atiende: boolean) =>
  aEstado(
    await request<RespuestaYoAtiendo>("/api/v1/equipo/yo-atiendo", {
      method: "PUT",
      body: { atiende },
      token,
    }),
  );
