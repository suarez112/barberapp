import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesionLista } from "../sesion/RestaurarSesionProvider";

// Estado de la sesión del cliente para las pantallas de su cuenta.
// "cargando": todavía se está leyendo la sesión guardada en el celular.
export function useClienteConSesion() {
  const { lista } = useSesionLista();
  const { usuario, token } = useCuenta();

  if (!lista) return { estado: "cargando" as const };
  if (!usuario) return { estado: "sin-sesion" as const };
  if (usuario.rol !== "cliente") return { estado: "otra-cuenta" as const };
  return { estado: "cliente" as const, usuario, token };
}
