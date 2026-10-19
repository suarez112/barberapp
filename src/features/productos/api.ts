import { request } from "../../services/api/http";
import { Producto } from "../../types";
import { FotoElegida, formularioFoto } from "../../utils/imagenes";

export type DatosProducto = {
  nombre: string;
  precio: number;
  descripcion: string | null;
};

const ruta = (id: string) => `/api/v1/productos/${encodeURIComponent(id)}`;

// Catálogo público para clientes (sin token), con el código del negocio
export const listarCatalogo = (codigo: string) =>
  request<Producto[]>(`/api/v1/productos/catalogo/${encodeURIComponent(codigo)}`);

// Administración (personal admin o cuenta admin)
export const listarProductos = (token: string) =>
  request<Producto[]>("/api/v1/productos", { token });

export const crearProducto = (token: string, datos: DatosProducto) =>
  request<Producto>("/api/v1/productos", { method: "POST", body: datos, token });

export const actualizarProducto = (token: string, id: string, datos: Partial<DatosProducto>) =>
  request<Producto>(ruta(id), { method: "PATCH", body: datos, token });

export const eliminarProducto = (token: string, id: string) =>
  request<{ mensaje: string }>(ruta(id), { method: "DELETE", token });

export const subirFotoProducto = (token: string, id: string, foto: FotoElegida) =>
  request<{ mensaje: string; fotoUrl: string }>(`${ruta(id)}/foto`, {
    method: "PUT",
    body: formularioFoto(foto),
    token,
  });

export const quitarFotoProducto = (token: string, id: string) =>
  request<{ mensaje: string; fotoUrl: null }>(`${ruta(id)}/foto`, {
    method: "DELETE",
    token,
  });
