import { Barbero } from "@/types";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesion } from "./SesionProvider";

// Quien usa el panel del negocio: un integrante del personal o la cuenta
// del administrador de la empresa (el backend acepta los dos tokens).
export type Personal = {
  token: string;
  esAdmin: boolean;
  // El integrante que inició sesión; null para la cuenta del administrador
  barbero: Barbero | null;
  esCuentaAdmin: boolean;
  nombre: string;
};

export function usePersonal(): Personal | null {
  const { barbero, token } = useSesion();
  const { usuario, token: tokenCuenta } = useCuenta();

  if (barbero && token) {
    return {
      token,
      esAdmin: barbero.esAdmin,
      barbero,
      esCuentaAdmin: false,
      nombre: barbero.nombre,
    };
  }
  if (usuario?.rol === "admin" && tokenCuenta) {
    return {
      token: tokenCuenta,
      esAdmin: true,
      barbero: null,
      esCuentaAdmin: true,
      // AdminPanelScreen lo cambia por el nombre de la administradora al cargar "Mi negocio"
      nombre: usuario.usuario ?? usuario.correo ?? "",
    };
  }
  return null;
}
