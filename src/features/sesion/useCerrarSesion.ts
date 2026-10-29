import { useAgenda } from "../agenda/AgendaProvider";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useNegocio } from "../negocio/NegocioProvider";
import { useNotificaciones } from "../notificaciones/NotificacionesProvider";
import { useSesion } from "./SesionProvider";

// Cierra cualquier sesión (personal o cuenta), da de baja las notificaciones
// de este celular, la borra del celular
// y olvida los datos del negocio que estaban en pantalla.
export function useCerrarSesion() {
  const { cerrarSesion } = useSesion();
  const { cerrarCuenta } = useCuenta();
  const { salirDelNegocio } = useNegocio();
  const { setCitas } = useAgenda();
  const { desregistrar } = useNotificaciones();

  return async () => {
    // Antes de descartar el token de la sesión: el servidor deja de avisar a este celular
    await desregistrar();
    await Promise.all([cerrarSesion(), cerrarCuenta()]);
    salirDelNegocio();
    setCitas([]);
  };
}
