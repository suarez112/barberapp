import { useCuenta } from "../cuenta/CuentaProvider";
import { usePersonal } from "./usePersonal";

// Pantalla "de casa" de quien tiene la sesión abierta: su panel, sus negocios (cliente) o el inicio.
// Sirve como destino de la flecha de atrás cuando no hay una página anterior.
export function useDestinoPanel(): "/admin" | "/panel" | "/mis-negocios" | "/" {
  const personal = usePersonal();
  const { usuario } = useCuenta();
  if (personal) return personal.esCuentaAdmin ? "/admin" : "/panel";
  if (usuario?.rol === "cliente") return "/mis-negocios";
  return "/";
}
