import { useAgenda } from "../agenda/AgendaProvider";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useNegocio } from "../negocio/NegocioProvider";
import { useSesion } from "./SesionProvider";

// Cierra cualquier sesión (personal o cuenta), la borra del celular
// y olvida los datos del negocio que estaban en pantalla.
export function useCerrarSesion() {
  const { cerrarSesion } = useSesion();
  const { cerrarCuenta } = useCuenta();
  const { salirDelNegocio } = useNegocio();
  const { setCitas } = useAgenda();

  return async () => {
    await Promise.all([cerrarSesion(), cerrarCuenta()]);
    salirDelNegocio();
    setCitas([]);
  };
}
