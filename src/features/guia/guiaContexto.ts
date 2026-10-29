import { createContext, useContext } from "react";
import { Guia } from "./api";

export type ValorGuia = {
  // null mientras carga o si no se pudo cargar (entonces no se muestra nada)
  guia: Guia | null;
  // Vuelve a pedir el avance (en silencio)
  refrescar: () => void;
  // Marca el paso "compartir enlace"
  marcarEnlace: () => void;
  ocultar: () => Promise<void>;
  mostrar: () => Promise<void>;
};

const SIN_PROVEEDOR: ValorGuia = {
  guia: null,
  refrescar: () => {},
  marcarEnlace: () => {},
  ocultar: async () => {},
  mostrar: async () => {},
};

export const GuiaContext = createContext<ValorGuia>(SIN_PROVEEDOR);

export const useGuia = () => useContext(GuiaContext);
