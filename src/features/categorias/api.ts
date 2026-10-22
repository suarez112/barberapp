import { request } from "../../services/api/http";

export type Categoria = { id: string; nombre: string };

// Categorías de negocio activas, por orden alfabético (público)
export const listarCategorias = () => request<Categoria[]>("/api/v1/categorias");
