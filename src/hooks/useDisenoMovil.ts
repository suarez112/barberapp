import { Platform, useWindowDimensions } from "react-native";
import { useSyncExternalStore } from "react";
import { ANCHO_MINIMO_TARJETA } from "@/components/layout/ContenedorWeb";

const sinSuscripcion = () => () => {};

// Diseño de celular con franja de marca: en Android/iOS y en la web angosta (la web ancha sigue
// con la tarjeta centrada). El prerenderizado de la web no conoce el ancho de la ventana, así que
// allí se decide recién cuando la página ya está montada.
export function useDisenoMovil() {
  const { width } = useWindowDimensions();
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  if (Platform.OS !== "web") return true;
  return montado && width < ANCHO_MINIMO_TARJETA;
}
