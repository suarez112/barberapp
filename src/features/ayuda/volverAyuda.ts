import { useRouter } from "expo-router";
import { useDestinoPanel } from "../sesion/useDestinoPanel";

// Flecha de atrás: vuelve a la pantalla anterior o, si no hay (se abrió el enlace directo),
// al panel de quien tiene la sesión abierta, o al inicio si no hay sesión
export function useVolver() {
  const { back, canGoBack, replace } = useRouter();
  const destino = useDestinoPanel();
  return () => {
    if (canGoBack()) back();
    else replace(destino);
  };
}
