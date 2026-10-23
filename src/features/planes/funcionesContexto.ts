import { createContext, useContext } from "react";
import { FuncionPlan, RespuestaFunciones, RespuestaPlanes } from "./api";

export type Valor = {
  // false hasta que el servidor responde (o si falla: entonces el backend decide cada caso)
  cargada: boolean;
  datos: RespuestaFunciones | null;
  // Cobro por profesional y niveles (null mientras carga o si falla)
  planes: RespuestaPlanes | null;
  // Si el plan incluye la función. Mientras no se sabe, se asume que sí: el backend la valida igual
  incluida: (id: string) => boolean;
  funcion: (id: string) => FuncionPlan | undefined;
  abrirPlanes: () => void;
};

const SIN_PROVEEDOR: Valor = {
  cargada: true,
  datos: null,
  planes: null,
  incluida: () => true,
  funcion: () => undefined,
  abrirPlanes: () => {},
};

export const FuncionesContext = createContext<Valor>(SIN_PROVEEDOR);

export const useFunciones = () => useContext(FuncionesContext);
