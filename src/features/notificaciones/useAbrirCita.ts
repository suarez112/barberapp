import { useRouter } from "expo-router";
import { useCuenta } from "../cuenta/CuentaProvider";
import { useSesion } from "../sesion/SesionProvider";
import { useNotificaciones } from "./NotificacionesProvider";

// Abre la cita de un aviso: el negocio la ve en su agenda y el cliente en "Mis citas"
export function useAbrirCita() {
  const router = useRouter();
  const { barbero } = useSesion();
  const { usuario } = useCuenta();
  const { abrirCitaEnPanel } = useNotificaciones();

  return (citaId: string) => {
    if (barbero || usuario?.rol === "admin") {
      abrirCitaEnPanel(citaId);
      router.navigate(barbero ? "/panel" : "/admin");
    } else if (usuario?.rol === "cliente") {
      router.navigate({ pathname: "/mis-citas", params: { citaId } });
    }
  };
}

// Abre Planes desde un aviso de la prueba gratuita (solo administradores)
export function useAbrirPlanes() {
  const router = useRouter();
  const { barbero } = useSesion();
  const { usuario } = useCuenta();
  const { abrirPlanesEnPanel } = useNotificaciones();

  return () => {
    if (!barbero?.esAdmin && usuario?.rol !== "admin") return;
    abrirPlanesEnPanel();
    router.navigate(barbero ? "/panel" : "/admin");
  };
}
