import { Redirect, useLocalSearchParams } from "expo-router";
import { ComponentType, useCallback, useState } from "react";
import { View } from "react-native";
import { useCuenta } from "@/features/cuenta/CuentaProvider";
import AnimacionInicio from "@/features/inicio/AnimacionInicio";
import SeleccionRolScreen from "@/features/inicio/SeleccionRolScreen";
import { useSesionLista } from "@/features/sesion/RestaurarSesionProvider";
import { usePersonal } from "@/features/sesion/usePersonal";

// Página principal: solo existe en la web. En Android e iOS la condición se resuelve al compilar,
// así que ni sus textos ni sus precios entran en la app del celular.
const PaginaPrincipalWeb: ComponentType | null =
  process.env.EXPO_OS === "web"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/features/landing/LandingScreen").default
    : null;

// La animación se ve una vez por cada vez que se abre la app, no al volver a esta pantalla
let animacionMostrada = false;

export default function InicioRoute() {
  // Compatibilidad con enlaces antiguos: /?codigo=INFINITY -> /cliente?codigo=INFINITY
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();
  const { lista } = useSesionLista();
  const personal = usePersonal();
  const { usuario } = useCuenta();
  const [animada, setAnimada] = useState(animacionMostrada);
  const terminarAnimacion = useCallback(() => {
    animacionMostrada = true;
    setAnimada(true);
  }, []);

  if (typeof codigo === "string" && codigo.trim() !== "") {
    return <Redirect href={{ pathname: "/cliente", params: { codigo } }} />;
  }
  // Web: sin sesión se ve la página principal; con sesión se va al panel como en el celular
  if (PaginaPrincipalWeb) {
    if (!lista) return <View style={{ flex: 1, backgroundColor: "#FFFFFF" }} />;
    if (personal) return <Redirect href={personal.esCuentaAdmin ? "/admin" : "/panel"} />;
    if (usuario?.rol === "cliente") return <Redirect href="/mis-negocios" />;
    return <PaginaPrincipalWeb />;
  }
  // The intro always plays first (also with a saved session); the session is read meanwhile
  if (!animada || !lista) return <AnimacionInicio onTerminar={terminarAnimacion} />;
  // Con una sesión guardada se entra directo al panel, sin volver a iniciar sesión
  if (personal) {
    return <Redirect href={personal.esCuentaAdmin ? "/admin" : "/panel"} />;
  }
  if (usuario?.rol === "cliente") return <Redirect href="/mis-negocios" />;
  return <SeleccionRolScreen />;
}
